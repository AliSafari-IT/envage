/**
 * Scans folders and reports on the encrypted/decrypted state of env files.
 */
import fs from "fs/promises";
import path from "path";
import type { EnvStatus, EnvageConfig } from "../types.js";
import { resolveEnvFilename, resolveEnvAgeName } from "../types.js";

/**
 * Check a single folder + env combination.
 */
export async function checkEnvStatus(
  folder: string,
  env: string
): Promise<EnvStatus> {
  const decryptedPath = path.join(folder, resolveEnvFilename(env));
  const encryptedPath = path.join(folder, resolveEnvAgeName(env));

  const [decrypted, encrypted] = await Promise.all([
    fileExists(decryptedPath),
    fileExists(encryptedPath),
  ]);

  return { folder, env, decrypted, encrypted, decryptedPath, encryptedPath };
}

/**
 * Check all folder + env combinations defined in a config.
 */
export async function getEnvStatus(
  config: EnvageConfig,
  cwd = process.cwd()
): Promise<EnvStatus[]> {
  const results: EnvStatus[] = [];

  for (const app of config.apps) {
    const absFolder = path.isAbsolute(app) ? app : path.resolve(cwd, app);
    for (const env of config.envs) {
      results.push(await checkEnvStatus(absFolder, env));
    }
  }

  return results;
}

/**
 * Check a single folder across all envs in a config.
 */
export async function getFolderStatus(
  folder: string,
  config: EnvageConfig
): Promise<EnvStatus[]> {
  const absFolder = path.isAbsolute(folder)
    ? folder
    : path.resolve(process.cwd(), folder);

  return Promise.all(
    config.envs.map((env) => checkEnvStatus(absFolder, env))
  );
}

/** Helper: check if a file exists */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
