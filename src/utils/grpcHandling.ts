import * as grpc from "@grpc/grpc-js";

import { beginGrpcCall } from "@utils/testArtifacts";
import type { RateLimiter } from "@utils/rateLimiter";

const toMs = (iso: string | undefined): number | undefined => {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : undefined;
};

export const createDefaultGrpcClientOptions = (target: string): grpc.ClientOptions => {
  return {
    "grpc.keepalive_time_ms": 30_000,
    "grpc.keepalive_timeout_ms": 10_000,
    interceptors: [
      (options, nextCall) => {
        const method = options.method_definition.path;
        const entry = beginGrpcCall({ target, method });

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
};

export const ensureMetadata = (metadata?: grpc.Metadata): grpc.Metadata => {
  return metadata ?? new grpc.Metadata();
};

export const unaryCallWithLimiter = async <TRes>(
  limiter: RateLimiter | undefined,
  invoke: (cb: (err: grpc.ServiceError | null, res?: TRes) => void) => void
): Promise<TRes> => {
  const release = limiter ? await limiter.acquire() : () => {};
  try {
    return await new Promise<TRes>((resolve, reject) => {
      try {
        invoke((err, res) => {
          release();
          if (err) return reject(err);
          if (!res) return reject(new Error("missing response"));
          resolve(res);
        });
      } catch (err) {
        release();
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  } catch (err) {
    release();
    throw err;
  }
};

export const streamCallWithLimiter = async <TRes>(
  limiter: RateLimiter | undefined,
  startStream: () => grpc.ClientReadableStream<TRes>
): Promise<TRes[]> => {
  const responses: TRes[] = [];
  const release = limiter ? await limiter.acquire() : () => {};

  return await new Promise<TRes[]>((resolve, reject) => {
    let stream: grpc.ClientReadableStream<TRes> | undefined;
    try {
      stream = startStream();
    } catch (err) {
      release();
      reject(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    stream.on("data", (chunk: TRes) => {
      responses.push(chunk);
    });

    stream.on("end", () => {
      release();
      resolve(responses);
    });

    stream.on("error", (err: Error) => {
      release();
      reject(err);
    });
  });
};
