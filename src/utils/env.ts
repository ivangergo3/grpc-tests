import fs from "node:fs";
import path from "node:path";

let loaded = false;

const parseLine = (line: string): [key: string, value: string] | undefined => {
  const trimmed = line.trim();
  if (trimmed === "" || trimmed.startsWith("#")) return undefined;

  const eq = trimmed.indexOf("=");
  if (eq <= 0) return undefined;

  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();

  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
};

/**
 * Minimal `.env` loader so Vitest/Vite config and runtime code
 * see the same required env vars (without adding a dotenv dependency).
 *
 * Only sets keys that are currently undefined in process.env.
 */
export const loadDotEnvOnce = (file = path.resolve(process.cwd(), ".env")): void => {
  if (loaded) return;
  loaded = true;

  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const kv = parseLine(line);
    if (!kv) continue;
    const [key, value] = kv;
    if (process.env[key] === undefined) process.env[key] = value;
  }
};

