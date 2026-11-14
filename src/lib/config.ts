/**
 * Loads, saves, and validates envage.config.json.
 */
import fs from "fs/promises";
import path from "path";
import type { EnvageConfig } from "../types.js";
import { DEFAULT_CONFIG } from "../types.js";

export const CONFIG_FILENAME = "envage.config.json";

/**
 * Load config from a given root directory.
 * Falls back to DEFAULT_CONFIG if the file does not exist.
 */
export async function loadConfig(cwd = process.cwd()): Promise<EnvageConfig> {
  const configPath = path.join(cwd, CONFIG_FILENAME);
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<EnvageConfig>;
    return {
      ...(parsed.recipients !== undefined ? { recipients: parsed.recipients } : {}),
      apps: parsed.apps ?? DEFAULT_CONFIG.apps,
      envs: parsed.envs ?? DEFAULT_CONFIG.envs,
      keyFile: parsed.keyFile ?? DEFAULT_CONFIG.keyFile,
      keyPubFile: parsed.keyPubFile ?? DEFAULT_CONFIG.keyPubFile,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("Cannot load envage.config.json; check JSON and permissions.");
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save config to the given root directory.
 */
export async function saveConfig(
  config: EnvageConfig,
  cwd = process.cwd(),
): Promise<void> {
  const configPath = path.join(cwd, CONFIG_FILENAME);
  await fs.writeFile(
    configPath,
    JSON.stringify(config, null, 2) + "\n",
    "utf-8",
  );
}

/**
 * Starter config written by `envage init-key`: the repository root only, with
 * the `production` and `root` environments. Users add their app folders.
 */
export const STARTER_CONFIG: EnvageConfig = {
  apps: ["."],
  envs: ["production", "root"],
  keyFile: ".age/key.txt",
  keyPubFile: ".age/key.pub",
};

/**
 * Create envage.config.json in `cwd` unless one already exists.
 * An existing file is never read, changed or overwritten.
 *
 * @returns the config path and whether this call created the file.
 */
export async function initConfig(
  cwd = process.cwd(),
  overrides: Partial<EnvageConfig> = {},
): Promise<{ configPath: string; created: boolean }> {
  const configPath = path.join(cwd, CONFIG_FILENAME);
  const config: EnvageConfig = { ...STARTER_CONFIG, ...overrides };
  try {
    // "wx" fails if the file exists, so a concurrent or earlier config is kept.
    await fs.writeFile(configPath, JSON.stringify(config, null, 2) + "\n", {
      encoding: "utf-8",
      flag: "wx",
    });
    return { configPath, created: true };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      return { configPath, created: false };
    }
    throw error;
  }
}

/**
 * Resolve all app folder paths as absolute paths.
 *
 * Note: this is a purely lexical resolution and does NOT expand glob
 * patterns (e.g. "apps/*"). Use {@link resolveApps} to expand globs against
 * the filesystem.
 */
export function resolveAppPaths(
  config: EnvageConfig,
  cwd = process.cwd(),
): string[] {
  return config.apps.map((app) =>
    path.isAbsolute(app) ? app : path.resolve(cwd, app),
  );
}

/** Characters that mark an app entry as a glob pattern. */
const GLOB_CHARS = /[*?[\]{}]/;

/**
 * Whether an app entry contains glob syntax and needs filesystem expansion.
 */
export function isGlobPattern(pattern: string): boolean {
  return GLOB_CHARS.test(pattern);
}

/**
 * Resolve all app folder paths as absolute paths, expanding glob patterns
 * (e.g. "apps/*", "packages/**") against the filesystem.
 *
 * - Non-glob entries are resolved lexically and returned as-is, even if the
 *   directory does not exist (matching the historical behavior).
 * - Glob entries are matched against existing directories only.
 * - Results are de-duplicated while preserving order.
 */
export async function resolveApps(
  config: EnvageConfig,
  cwd = process.cwd(),
): Promise<string[]> {
  const results: string[] = [];

  for (const app of config.apps) {
    if (!isGlobPattern(app)) {
      results.push(path.isAbsolute(app) ? app : path.resolve(cwd, app));
      continue;
    }

    const abs = path.isAbsolute(app) ? app : path.resolve(cwd, app);
    const { root } = path.parse(abs);
    const base = path.isAbsolute(app) ? root : cwd;
    const relative = path.relative(base, abs);
    const segments = relative.split(/[\\/]+/).filter(Boolean);

    const matches = await expandPattern(base, segments);
    matches.sort();
    results.push(...matches);
  }

  return [...new Set(results)];
}

/**
 * Recursively expand the remaining glob `segments` starting from `base`,
 * returning absolute paths of matching directories.
 */
async function expandPattern(
  base: string,
  segments: string[],
): Promise<string[]> {
  if (segments.length === 0) return [base];

  const [segment, ...rest] = segments;

  // "**" matches zero or more nested directories.
  if (segment === "**") {
    const results = new Set<string>(await expandPattern(base, rest));
    for (const dir of await listDirectories(base)) {
      for (const match of await expandPattern(path.join(base, dir), segments)) {
        results.add(match);
      }
    }
    return [...results];
  }

  if (isGlobPattern(segment)) {
    const regex = segmentToRegExp(segment);
    const results: string[] = [];
    for (const dir of await listDirectories(base)) {
      if (regex.test(dir)) {
        results.push(...(await expandPattern(path.join(base, dir), rest)));
      }
    }
    return results;
  }

  // Literal segment: descend without touching the filesystem.
  return expandPattern(path.join(base, segment), rest);
}

/** Convert a single glob path segment into an anchored RegExp. */
function segmentToRegExp(segment: string): RegExp {
  let source = "";
  for (const char of segment) {
    if (char === "*") source += "[^/\\\\]*";
    else if (char === "?") source += "[^/\\\\]";
    else source += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${source}$`);
}

/** List the names of immediate subdirectories of `dir` (empty if unreadable). */
async function listDirectories(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}
