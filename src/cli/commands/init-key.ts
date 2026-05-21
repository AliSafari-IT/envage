/**
 * CLI `init-key` command.
 *
 * Usage:
 *   envage init-key [--output .age]
 *
 * Generates a new age X25519 keypair and writes:
 *   .age/key.txt  (private key, mode 0600)
 *   .age/key.pub  (public key)
 */
import type { Command } from "commander";
import { generateKeyPairToFolder } from "../../lib/keygen.js";
import { ensureGitignore } from "../../lib/gitignore.js";
import { logger } from "../../lib/logger.js";

interface InitKeyOptions {
  output?: string;
}

export function registerInitKey(program: Command): void {
  program
    .command("init-key")
    .description("Generate a new age keypair (.age/key.txt and .age/key.pub)")
    .option("-o, --output <folder>", "output folder for the keypair", ".age")
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
        logger.raw("");
        logger.raw(
          "  To encrypt:  envage encrypt apps/web --env dev"
        );
        logger.raw(
          "  To decrypt:  envage decrypt apps/web --env dev"
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to generate keypair: ${msg}`);
        process.exit(1);
      }
    });
}
