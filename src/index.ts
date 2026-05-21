/**
 * @asafarim/envage — Public programmatic API
 *
 * @example
 * ```ts
 * import { encryptEnv, decryptEnv, generateKeyPair, getEnvStatus } from "@asafarim/envage";
 * ```
 */

export { encryptEnv } from "./lib/encrypt.js";
export { decryptEnv } from "./lib/decrypt.js";
export {
  generateKeyPair,
  generateKeyPairToFolder,
  readIdentityFromFile,
  readRecipientFromFile,
} from "./lib/keygen.js";
export { getEnvStatus, getFolderStatus, checkEnvStatus } from "./lib/status.js";
export { loadConfig, saveConfig, resolveAppPaths, CONFIG_FILENAME } from "./lib/config.js";
export { ensureGitignore, checkStagedEnvFiles, getGitignoreRules } from "./lib/gitignore.js";
export type { EnvStatus, EnvageConfig, EnvOptions } from "./types.js";
