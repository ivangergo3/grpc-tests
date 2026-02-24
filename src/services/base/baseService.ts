import * as grpc from "@grpc/grpc-js";
import type { ChannelCredentialsInput } from "@services/types";
import { beginGrpcCall } from "@utils/testArtifacts";

const toMs = (iso: string | undefined): number | undefined => {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : undefined;
};

/**
 * Base class for "service objects" (Page Object Model style) around generated ts-proto clients.
 *
 * - Handles target + credentials + default options
 * - Provides helpers for metadata/deadline and unary promise wrapping
 * - Leaves concrete RPC methods to subclasses (no asserts here; tests own assertions)
 */
export abstract class BaseGrpcService<TClient> {
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
    options?: grpc.ClientOptions
  ) {
    this.target = target;
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

  // TODO: Need to check if we have this implemented in the service
  protected defaultGrpcClientOptions(): grpc.ClientOptions {
    return {
      "grpc.keepalive_time_ms": 30_000,
      "grpc.keepalive_timeout_ms": 10_000,
      interceptors: [
        (options, nextCall) => {
          const method = options.method_definition.path;
          const entry = beginGrpcCall({ target: this.target, method });

          const requester: grpc.Requester = {
            start: (metadata, listener, next) => {
              if (entry) {
                try {
                  entry.requestMetadata = metadata.getMap() as Record<string, unknown>;
                } catch {
                  // ignore
                }
              }

              const wrapped: grpc.Listener = {
                onReceiveMessage: (message, nextMessage) => {
                  if (entry) {
                    const receivedAtIso = new Date().toISOString();
                    entry.responses.push({ receivedAtIso, message });
                    if (entry.timeToFirstResponseMs === undefined) {
                      const sent = toMs(entry.requestSentAtIso) ?? toMs(entry.startedAtIso);
                      const received = toMs(receivedAtIso);
                      if (sent !== undefined && received !== undefined) {
                        entry.timeToFirstResponseMs = Math.max(0, received - sent);
                      }
                    }
                  }
                  nextMessage(message);
                },
                onReceiveStatus: (status, nextStatus) => {
                  if (entry) {
                    entry.status = {
                      code: status.code,
                      details: status.details,
                      metadata: (() => {
                        try {
                          return status.metadata.getMap();
                        } catch {
                          return undefined;
                        }
                      })()
                    };
                    entry.statusReceivedAtIso = new Date().toISOString();
                    const sent = toMs(entry.requestSentAtIso) ?? toMs(entry.startedAtIso);
                    const done = toMs(entry.statusReceivedAtIso);
                    if (sent !== undefined && done !== undefined) {
                      entry.durationMs = Math.max(0, done - sent);
                    }
                  }
                  nextStatus(status);
                }
              };

              next(metadata, wrapped);
            },
            sendMessage: (message, next) => {
              if (entry && entry.request === undefined) {
                entry.request = message;
                entry.requestSentAtIso = new Date().toISOString();
              }
              next(message);
            }
          };

          return new grpc.InterceptingCall(nextCall(options), requester);
        }
      ]
    };
  }

  // TODO: Need to check if we have this implemented in the service
  protected metadata(metadata?: grpc.Metadata): grpc.Metadata {
    return metadata ?? new grpc.Metadata();
  }

  protected unaryCall<TRes>(
    invoke: (cb: (err: grpc.ServiceError | null, res?: TRes) => void) => void
  ): Promise<TRes> {
    return new Promise<TRes>((resolve, reject) => {
      invoke((err, res) => {
        if (err) return reject(err);
        if (!res) return reject(new Error("missing response"));
        resolve(res);
      });
    });
  }

  /**
   * Collect server-streaming responses into an array.
   */
  protected streamCall<TRes>(startStream: () => grpc.ClientReadableStream<TRes>): Promise<TRes[]> {
    const responses: TRes[] = [];

    return new Promise<TRes[]>((resolve, reject) => {
      const stream = startStream();

      stream.on("data", (chunk: TRes) => {
        responses.push(chunk);
      });

      stream.on("end", () => {
        resolve(responses);
      });

      stream.on("error", (err: Error) => {
        reject(err);
      });
    });
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
}
