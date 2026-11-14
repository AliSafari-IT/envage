/**
 * CLI `init-key` command.
 *
 * Usage:
 *   envage init-key [--output .age]
 *
 * Generates a new age X25519 keypair and writes:
 *   .age/key.txt  (private key, mode 0600)
 *   .age/key.pub  (public key)
 * and creates a starter envage.config.json when the folder has none.
 */
import type { Command } from "commander";
import { generateKeyPairToFolder } from "../../lib/keygen.js";
import path from "path";
import { CONFIG_FILENAME, initConfig } from "../../lib/config.js";
import { ensureGitignore } from "../../lib/gitignore.js";
import { logger } from "../../lib/logger.js";

interface InitKeyOptions {
  output?: string;
  config: boolean;
}

export function registerInitKey(program: Command): void {
  program
    .command("init-key")
    .description("Generate a new age keypair (.age/key.txt and .age/key.pub)")
    .option("-o, --output <folder>", "output folder for the keypair", ".age")
    .option("--no-config", `do not create ${CONFIG_FILENAME}`)
    .action(async (opts: InitKeyOptions) => {
      const outputFolder = opts.output ?? ".age";

      logger.info(`Generating age X25519 keypair in ${outputFolder}/`);

      try {
        const { keyFile, pubFile } = await generateKeyPairToFolder(outputFolder);
        logger.success(`Private key written to: ${keyFile}`);
        logger.success(`Public key written to:  ${pubFile}`);

        logger.info("Updating .gitignore to protect the private key…");
        await ensureGitignore();
        logger.success(".gitignore updated.");

        logger.warn("IMPORTANT: Never commit your private key (.age/key.txt).");
        logger.warn("Share .age/key.pub with teammates who need to encrypt files.");
        let all = false;
        if (opts.config) {
          const { created } = await initConfig(process.cwd(), {
            keyFile: toConfigPath(keyFile),
            keyPubFile: toConfigPath(pubFile),
          });
          all = true;
          if (created) {
            logger.success(`${CONFIG_FILENAME} created with defaults.`);
            logger.info(
              `Add your app folders to "apps" in ${CONFIG_FILENAME}, for example [".", "apps/*"], and adjust "envs" to the environments you use.`
            );
          } else {
            logger.info(`${CONFIG_FILENAME} already exists; left unchanged.`);
          }
        }

        logger.raw("");
        if (all) {
          logger.raw("  To encrypt:  envage encrypt --all --env production");
          logger.raw("  To decrypt:  envage decrypt --all --env production");
        } else {
          logger.raw("  To encrypt:  envage encrypt apps/web --env dev");
          logger.raw("  To decrypt:  envage decrypt apps/web --env dev");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to generate keypair: ${msg}`);
        process.exit(1);
      }
    });
}

/** Key path as stored in the config: relative to the project root, with "/" separators. */
function toConfigPath(file: string): string {
  const relative = path.relative(process.cwd(), file);
  const inside = relative && !relative.startsWith("..") && !path.isAbsolute(relative);
  return inside ? relative.split(path.sep).join("/") : file;
}
