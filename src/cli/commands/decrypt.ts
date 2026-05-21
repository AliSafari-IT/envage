/**
 * CLI `decrypt` command.
 *
 * Usage:
 *   envage decrypt [path] [--env prod] [--key .age/key.txt]
 *   envage decrypt --all [--env prod]
 *
 * Production decryption always prompts for manual confirmation.
 */
import type { Command } from "commander";
import path from "path";
import { decryptEnv } from "../../lib/decrypt.js";
import { loadConfig } from "../../lib/config.js";
import { logger } from "../../lib/logger.js";
import { confirm, promptPassphrase } from "../prompt.js";

interface DecryptOptions {
  env?: string;
  key?: string;
  passphrase?: string;
  all?: boolean;
}

const PROD_ENVS = new Set(["prod", "production"]);

export function registerDecrypt(program: Command): void {
  program
    .command("decrypt [path]")
    .description("Decrypt .env.<env>.age → .env.<env>")
    .option("-e, --env <env>", "environment name (e.g. dev, prod)", "dev")
    .option("-k, --key <keyFile>", "path to age private key file (.age/key.txt)")
    .option("-p, --passphrase <pass>", "passphrase for decryption")
    .option("--all", "decrypt all apps defined in envage.config.json")
    .action(async (folderArg: string | undefined, opts: DecryptOptions) => {
      const envName = opts.env ?? "dev";
      let keyFile = opts.key;
      let passphrase = opts.passphrase;

      // Production guard — always require explicit confirmation
      if (PROD_ENVS.has(envName)) {
        logger.warn(`You are about to decrypt PRODUCTION environment files.`);
        const ok = await confirm("Are you sure you want to continue?");
        if (!ok) {
          logger.info("Aborted.");
          process.exit(0);
        }
      }

      // Resolve credential
      if (!passphrase && !keyFile) {
        const config = await loadConfig();
        const defaultKey = config.keyFile;
        try {
          const { readIdentityFromFile } = await import("../../lib/keygen.js");
          await readIdentityFromFile(path.resolve(process.cwd(), defaultKey));
          keyFile = path.resolve(process.cwd(), defaultKey);
          logger.detail(`Using key file: ${keyFile}`);
        } catch {
          logger.info("No key file found. Enter the passphrase for decryption:");
          passphrase = await promptPassphrase();
        }
      }

      if (opts.all) {
        await decryptAll(envName, keyFile, passphrase);
      } else {
        const folder = folderArg ? path.resolve(process.cwd(), folderArg) : process.cwd();
        await decryptOne(folder, envName, keyFile, passphrase);
      }
    });
}

async function decryptOne(
  folder: string,
  env: string,
  keyFile: string | undefined,
  passphrase: string | undefined
): Promise<void> {
  const fromFile = path.join(folder, `.env.${env}.age`);
  const toFile = path.join(folder, `.env.${env}`);

  logger.decrypting(fromFile, toFile);

  try {
    await decryptEnv({ folder, env, keyFile, passphrase });
    logger.success("Done");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(msg);
    process.exit(1);
  }
}

async function decryptAll(
  env: string,
  keyFile: string | undefined,
  passphrase: string | undefined
): Promise<void> {
  const config = await loadConfig();
  if (config.apps.length === 0) {
    logger.warn("No apps defined in envage.config.json. Nothing to decrypt.");
    return;
  }

  let anyFailed = false;
  for (const app of config.apps) {
    const folder = path.resolve(process.cwd(), app);
    const fromFile = path.join(folder, `.env.${env}.age`);
    const toFile = path.join(folder, `.env.${env}`);
    logger.decrypting(fromFile, toFile);
    try {
      await decryptEnv({ folder, env, keyFile, passphrase });
      logger.success("Done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(msg);
      anyFailed = true;
    }
  }

  if (anyFailed) process.exit(1);
}
