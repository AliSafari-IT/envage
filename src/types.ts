/** Status of a single env/environment slot within a folder. */
export interface EnvStatus {
  /** The app folder path (e.g. "apps/web") */
  folder: string;
  /** The environment name (e.g. "dev", "prod") */
  env: string;
  /** Whether the plaintext .env.<env> file exists */
  decrypted: boolean;
  /** Whether the encrypted .env.<env>.age file exists */
  encrypted: boolean;
  /** Full path to the plaintext file */
  decryptedPath: string;
  /** Full path to the encrypted file */
  encryptedPath: string;
}

/** Shape of envage.config.json */
export interface EnvageConfig {
  /** App/package folder paths relative to cwd (e.g. ["apps/web", "packages/api"]) */
  apps: string[];
  /** Environment names to manage (e.g. ["dev", "staging", "prod"]) */
  envs: string[];
  /** Path to the age private key file (default: ".age/key.txt") */
  keyFile: string;
  /** Path to the age public key file (default: ".age/key.pub") */
  keyPubFile?: string;
}

/** Options for encryptEnv / decryptEnv */
export interface EnvOptions {
  /** App/package folder path */
  folder: string;
  /** Environment name */
  env: string;
  /** Path to age key file (for key-based encryption) */
  keyFile?: string;
  /** Passphrase (for passphrase-based encryption) */
  passphrase?: string;
}

/**
 * Resolve the base filename for a given env name.
 * - `"root"` → `.env` (plain root env file)
 * - anything else → `.env.<env>`
 */
export function resolveEnvFilename(env: string): string {
  return env === "root" ? ".env" : `.env.${env}`;
}

/**
 * Resolve the encrypted filename for a given env name.
 * - `"root"` → `.env.age`
 * - anything else → `.env.<env>.age`
 */
export function resolveEnvAgeName(env: string): string {
  return env === "root" ? ".env.age" : `.env.${env}.age`;
}

/** Default config values */
export const DEFAULT_CONFIG: EnvageConfig = {
  apps: [],
  envs: ["dev", "staging", "prod"],
  keyFile: ".age/key.txt",
  keyPubFile: ".age/key.pub",
};
