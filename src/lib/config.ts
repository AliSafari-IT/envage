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
      apps: parsed.apps ?? DEFAULT_CONFIG.apps,
      envs: parsed.envs ?? DEFAULT_CONFIG.envs,
      keyFile: parsed.keyFile ?? DEFAULT_CONFIG.keyFile,
      keyPubFile: parsed.keyPubFile ?? DEFAULT_CONFIG.keyPubFile,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save config to the given root directory.
 */
export async function saveConfig(
  config: EnvageConfig,
  cwd = process.cwd()
): Promise<void> {
  const configPath = path.join(cwd, CONFIG_FILENAME);
  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

/**
 * Resolve all app folder paths as absolute paths.
 */
export function resolveAppPaths(
  config: EnvageConfig,
  cwd = process.cwd()
): string[] {
  return config.apps.map((app) =>
    path.isAbsolute(app) ? app : path.resolve(cwd, app)
  );
}
