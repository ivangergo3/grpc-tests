export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export type Logger = {
  debug: (msg: string, ...args: unknown[]) => void;
  info: (msg: string, ...args: unknown[]) => void;
  warn: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
  /** Alias for info(). */
  log: (msg: string, ...args: unknown[]) => void;
  child: (scope: string) => Logger;
};

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100
};

const normalizeLevel = (input: unknown): LogLevel => {
  const raw = (typeof input === "string" ? input : "").toLowerCase().trim();
  if (raw === "debug") return "debug";
  if (raw === "info" || raw === "log") return "info";
  if (raw === "warn" || raw === "warning") return "warn";
  if (raw === "error") return "error";
  if (raw === "silent" || raw === "none" || raw === "off") return "silent";
  return "info";
};

const formatPrefix = (level: LogLevel, scope?: string): string => {
  const ts = new Date().toISOString();
  const s = scope ? ` ${scope}` : "";
  return `[${ts}] [${level.toUpperCase()}]${s}`;
};

export const createLogger = (opts?: { scope?: string; level?: LogLevel }): Logger => {
  const scope = opts?.scope;
  const minLevel: LogLevel = opts?.level ?? normalizeLevel(process.env.LOG_LEVEL);

  const shouldLog = (level: LogLevel) => levelOrder[level] >= levelOrder[minLevel];

  const write = (level: LogLevel, msg: string, args: unknown[]) => {
    if (!shouldLog(level)) return;
    const prefix = formatPrefix(level, scope);
    if (level === "error") console.error(prefix, msg, ...args);
    else if (level === "warn") console.warn(prefix, msg, ...args);
    else if (level === "debug") console.debug(prefix, msg, ...args);
    else console.info(prefix, msg, ...args);
  };

  const base: Logger = {
    debug: (msg, ...args) => write("debug", msg, args),
    info: (msg, ...args) => write("info", msg, args),
    warn: (msg, ...args) => write("warn", msg, args),
    error: (msg, ...args) => write("error", msg, args),
    log: (msg, ...args) => write("info", msg, args),
    child: (childScope: string) => {
      const combined = scope ? `${scope}:${childScope}` : childScope;
      return createLogger({ scope: combined, level: minLevel });
    }
  };

  return base;
};

/** Default logger. Control verbosity via LOG_LEVEL=debug|info|warn|error|silent */
export const logger: Logger = createLogger();
