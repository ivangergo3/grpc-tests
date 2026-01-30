import * as grpc from "@grpc/grpc-js";
import { getEnvironment } from "@utils/environments";
import { ContentType, attachment } from "allure-js-commons";

export type unary_call_options = {
  metadata?: grpc.Metadata;
  deadlineMs?: number;
  /**
   * Reporting controls (Allure).
   * Defaults: attach on error, do not attach on success.
   */
  report?: {
    attachOnError?: boolean;
    attachOnSuccess?: boolean;
  };
};

const redactKey = (key: string): boolean =>
  /(authorization|token|secret|password|cookie|set-cookie|clientkey|privatekey|key|cert)/i.test(
    key
  );

const safeJson = (value: unknown, maxChars = 200_000): string => {
  const seen = new WeakSet<object>();
  const replacer = (k: string, v: unknown): unknown => {
    if (k && redactKey(k)) return "[REDACTED]";
    if (typeof v === "bigint") return v.toString();
    if (typeof v === "object" && v !== null) {
      const obj = v;
      if (seen.has(obj)) return "[Circular]";
      seen.add(obj);
    }
    return v;
  };

  const json = JSON.stringify(value, (k: string, v: unknown) => replacer(k, v), 2);
  if (json.length <= maxChars) return json;
  return `${json.slice(0, maxChars)}\n\n[TRUNCATED ${json.length - maxChars} chars]`;
};

const metadataToObject = (m: grpc.Metadata | undefined): Record<string, string> | undefined => {
  if (!m) return undefined;
  const out: Record<string, string> = {};
  const map = m.getMap();
  for (const [k, v] of Object.entries(map)) {
    if (redactKey(k)) {
      out[k] = "[REDACTED]";
      continue;
    }
    out[k] = Buffer.isBuffer(v) ? `<Buffer length=${v.length}>` : String(v);
  }
  return out;
};

const toGrpcErrorSummary = (err: unknown): Record<string, unknown> => {
  if (!(err instanceof Error)) return { message: String(err) };
  const e = err as grpc.ServiceError;
  return {
    name: e.name,
    message: e.message,
    code: e.code,
    details: e.details,
    metadata: metadataToObject(e.metadata)
  };
};

const tryAllureAttachment = async (name: string, jsonObject: unknown, fileBaseName: string) => {
  try {
    await attachment(name, safeJson(jsonObject), {
      contentType: ContentType.JSON,
      fileExtension: `${fileBaseName}.json`
    });
  } catch {
    // Allure context might not exist (e.g. reporter disabled). Never fail tests because of reporting.
  }
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
    creds: grpc.ChannelCredentials,
    options?: grpc.ClientOptions
  ) {
    this.target = target;
    this.client = new ClientCtor(target, creds, options ?? this.defaultGrpcClientOptions());
  }

  protected defaultGrpcClientOptions(): grpc.ClientOptions {
    return {
      "grpc.keepalive_time_ms": 30_000,
      "grpc.keepalive_timeout_ms": 10_000
    };
  }

  protected metadata(opts: unary_call_options): grpc.Metadata {
    return opts.metadata ?? new grpc.Metadata();
  }

  protected deadlineFromNowMs(ms: number): Date {
    return new Date(Date.now() + ms);
  }

  /**
   * Default unary deadline used when callers don't provide `deadlineMs`.
   *
   * Override in subclasses if specific services need longer timeouts.
   * Configure globally via `GRPC_DEFAULT_DEADLINE_MS` (or `GRPC_DEADLINE_MS`).
   */
  protected defaultDeadlineMs(): number {
    // Optional override via env vars (handy for quick CI tuning),
    // otherwise use the selected environment config.
    const raw = process.env.GRPC_DEFAULT_DEADLINE_MS ?? process.env.GRPC_DEADLINE_MS;
    if (raw) {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) return n;
    }

    const fromConfig = getEnvironment().timeouts.grpcDefaultDeadlineMs;
    return fromConfig > 0 ? fromConfig : 5_000;
  }

  protected callOptions(opts: unary_call_options): grpc.CallOptions | undefined {
    // Allow explicitly disabling deadlines for a call by passing `deadlineMs: 0`.
    const ms = opts.deadlineMs ?? this.defaultDeadlineMs();
    if (!ms || ms <= 0) return undefined;
    return { deadline: this.deadlineFromNowMs(ms) };
  }

  protected reportOpts(
    opts: unary_call_options
  ): Required<NonNullable<unary_call_options["report"]>> {
    return {
      attachOnError: opts.report?.attachOnError ?? true,
      attachOnSuccess: opts.report?.attachOnSuccess ?? false
    };
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
   * Promise wrapper around unary call + Allure artifacts (failure-only by default).
   */
  protected async unaryCallWithReport<TReq, TRes>(
    ctx: { rpc: string; request: TReq; metadata?: grpc.Metadata; deadlineMs?: number },
    opts: unary_call_options,
    invoke: (cb: (err: grpc.ServiceError | null, res?: TRes) => void) => void
  ): Promise<TRes> {
    const ro = this.reportOpts(opts);

    try {
      const res = await this.unaryCall<TRes>(invoke);
      if (ro.attachOnSuccess) {
        await tryAllureAttachment(
          `gRPC ${ctx.rpc} (success)`,
          {
            rpc: ctx.rpc,
            target: this.target,
            deadlineMs: ctx.deadlineMs,
            request: ctx.request,
            response: res,
            requestMetadata: metadataToObject(ctx.metadata)
          },
          `grpc-${ctx.rpc.replaceAll("/", "_").replaceAll(".", "_")}-success`
        );
      }
      return res;
    } catch (err) {
      if (ro.attachOnError) {
        await tryAllureAttachment(
          `gRPC ${ctx.rpc} (error)`,
          {
            rpc: ctx.rpc,
            target: this.target,
            deadlineMs: ctx.deadlineMs,
            request: ctx.request,
            requestMetadata: metadataToObject(ctx.metadata),
            error: toGrpcErrorSummary(err)
          },
          `grpc-${ctx.rpc.replaceAll("/", "_").replaceAll(".", "_")}-error`
        );
      }
      throw err;
    }
  }
}
