/**
 * CLI `encrypt` command.
 *
 * Usage:
 *   envage encrypt [path] [--env dev] [--key .age/key.txt] [--passphrase ...]
 *   envage encrypt --all [--env dev] [--key .age/key.txt]
 */
import type { Command } from "commander";
import path from "path";
import { encryptEnv } from "../../lib/encrypt.js";
import { loadConfig } from "../../lib/config.js";
import { checkStagedEnvFiles } from "../../lib/gitignore.js";
import { logger } from "../../lib/logger.js";
import { confirm, promptPassphrase } from "../prompt.js";

interface EncryptOptions {
  env?: string;
  key?: string;
  passphrase?: string;
  all?: boolean;
}

export function registerEncrypt(program: Command): void {
  program
    .command("encrypt [path]")
    .description("Encrypt .env.<env> → .env.<env>.age")
    .option("-e, --env <env>", "environment name (e.g. dev, prod)", "dev")
    .option("-k, --key <keyFile>", "path to age key file (.age/key.txt or .age/key.pub)")
    .option("-p, --passphrase <pass>", "passphrase for encryption (not recommended via CLI arg — use without value to be prompted)")
    .option("--all", "encrypt all apps defined in envage.config.json")
    .action(async (folderArg: string | undefined, opts: EncryptOptions) => {
      // Warn about staged decrypted files first
      const staged = checkStagedEnvFiles();
      if (staged.length > 0) {
        logger.error("You are trying to commit a decrypted env file.");
        logger.error("Only encrypted .age files are allowed.");
        staged.forEach((f) => logger.detail(f));
        process.exit(1);
      }

      // Resolve encryption credential
      let passphrase = opts.passphrase;
      let keyFile = opts.key;

      if (!passphrase && !keyFile) {
        // Auto-detect default key file
        const config = await loadConfig();
        const defaultKey = config.keyFile;
        try {
          const { readIdentityFromFile } = await import("../../lib/keygen.js");
          await readIdentityFromFile(path.resolve(process.cwd(), defaultKey));
          keyFile = path.resolve(process.cwd(), defaultKey);
          logger.detail(`Using key file: ${keyFile}`);
        } catch {
          // No key file found — prompt for passphrase
          logger.info("No key file found. Enter a passphrase for encryption:");
          passphrase = await promptPassphrase();
        }
      }

      const envName = opts.env ?? "dev";

      if (opts.all) {
        await encryptAll(envName, keyFile, passphrase);
      } else {
        const folder = folderArg ? path.resolve(process.cwd(), folderArg) : process.cwd();
        await encryptOne(folder, envName, keyFile, passphrase);
      }
    });
}

async function encryptOne(
  folder: string,
  env: string,
  keyFile: string | undefined,
  passphrase: string | undefined
): Promise<void> {
  const fromFile = path.join(folder, `.env.${env}`);
  const toFile = path.join(folder, `.env.${env}.age`);

  logger.encrypting(fromFile, toFile);

  try {
    await encryptEnv({ folder, env, keyFile, passphrase });
    logger.success("Done");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(msg);
    process.exit(1);
  }
}

async function encryptAll(
  env: string,
  keyFile: string | undefined,
  passphrase: string | undefined
): Promise<void> {
  const config = await loadConfig();
  if (config.apps.length === 0) {
    logger.warn("No apps defined in envage.config.json. Nothing to encrypt.");
    return;
  }

  let anyFailed = false;
  for (const app of config.apps) {
    const folder = path.resolve(process.cwd(), app);
    const fromFile = path.join(folder, `.env.${env}`);
    const toFile = path.join(folder, `.env.${env}.age`);
    logger.encrypting(fromFile, toFile);
    try {
      await encryptEnv({ folder, env, keyFile, passphrase });
      logger.success("Done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(msg);
      anyFailed = true;
    }
  }

  if (anyFailed) process.exit(1);
}

export async function runEncryptAll(env: string, keyFile?: string, passphrase?: string): Promise<void> {
  await encryptAll(env, keyFile, passphrase);
}
