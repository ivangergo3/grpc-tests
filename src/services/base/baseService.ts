import * as grpc from "@grpc/grpc-js";
import type { ChannelCredentialsInput } from "@services/types";
import { createRateLimiterFromEnv, type RateLimiter } from "@utils/rateLimiter";

import {
  createDefaultGrpcClientOptions,
  ensureMetadata,
  streamCallWithLimiter,
  unaryCallWithLimiter
} from "@utils/grpcHandling";

/**
 * Base class for "service objects" (Page Object Model style) around generated ts-proto clients.
 *
 * - Handles target + credentials + default options
 * - Provides helpers for metadata/deadline and unary promise wrapping
 * - Leaves concrete RPC methods to subclasses (no asserts here; tests own assertions)
 */
export abstract class BaseGrpcService<TClient extends grpc.Client> {
  private static readonly rateLimiter: RateLimiter = createRateLimiterFromEnv();

  private readonly rateLimiter: RateLimiter | undefined;
  protected readonly client: TClient;
  protected readonly target: string;

  protected constructor(
    ClientCtor: new (
      target: string,
      creds: grpc.ChannelCredentials,
      options?: grpc.ClientOptions
    ) => TClient,
    target: string,
    creds: ChannelCredentialsInput,
    options?: grpc.ClientOptions,
    rateLimiter?: RateLimiter | null
  ) {
    this.target = target;
    this.rateLimiter =
      rateLimiter === null ? undefined : (rateLimiter ?? BaseGrpcService.rateLimiter);
    const resolvedCreds: grpc.ChannelCredentials = (() => {
      if (!creds) return grpc.credentials.createInsecure();

      // grpc.ChannelCredentials is a class with required methods (e.g. compose()).
      // If those exist, treat it as a real credentials instance.
      if (typeof creds === "object" && "compose" in creds) {
        return creds;
      }

      // Otherwise treat it as our config object.
      if (creds.creds) return creds.creds;
      if (creds.insecure) return grpc.credentials.createInsecure();
      throw new Error('missing credentials: pass { insecure: true } or provide "creds"');
    })();
    const base = this.defaultGrpcClientOptions();
    const merged: grpc.ClientOptions = {
      ...base,
      ...options,
      interceptors: [...(base.interceptors ?? []), ...(options?.interceptors ?? [])]
    };
    this.client = new ClientCtor(target, resolvedCreds, merged);
  }

  // TODO: Need to check if we have this implemented in the service the keep alive ?
  protected defaultGrpcClientOptions(): grpc.ClientOptions {
    return createDefaultGrpcClientOptions(this.target);
  }

  // TODO: Need to check if we have this implemented in the service the metadata thing ?
  protected metadata(metadata?: grpc.Metadata): grpc.Metadata {
    return ensureMetadata(metadata);
  }

  protected async unaryCall<TRes>(
    invoke: (cb: (err: grpc.ServiceError | null, res?: TRes) => void) => void
  ): Promise<TRes> {
    return await unaryCallWithLimiter(this.rateLimiter, invoke);
  }

  /**
   * Collect server-streaming responses into an array.
   */
  protected async streamCall<TRes>(
    startStream: () => grpc.ClientReadableStream<TRes>
  ): Promise<TRes[]> {
    return await streamCallWithLimiter(this.rateLimiter, startStream);
  }

  /**
   * Collect server-streaming messages, then aggregate into a single result.
   */
  protected async streamAggregate<TChunk, TAgg>(
    startStream: () => grpc.ClientReadableStream<TChunk>,
    aggregate: (chunks: TChunk[]) => TAgg | Promise<TAgg>
  ): Promise<TAgg> {
    const chunks = await this.streamCall<TChunk>(startStream);
    return await aggregate(chunks);
  }

  /**
   * Utility for common aggregations: pick defined values from stream chunks.
   */
  protected pickDefined<TChunk, TItem>(
    chunks: TChunk[],
    pick: (chunk: TChunk) => TItem | null | undefined
  ): TItem[] {
    const out: TItem[] = [];
    for (const c of chunks) {
      const v = pick(c);
      if (v !== undefined && v !== null) out.push(v);
    }
    return out;
  }

  protected last<T>(items: T[]): T | undefined {
    return items.length > 0 ? items[items.length - 1] : undefined;
  }

  close(): void {
    this.client.close();
  }
}
