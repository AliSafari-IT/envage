/**
 * CLI `status` command.
 *
 * Usage:
 *   envage status [path]
 *
 * Shows which env files are encrypted/decrypted for all configured apps.
 */
import type { Command } from "commander";
import path from "path";
import chalk from "chalk";
import { loadConfig } from "../../lib/config.js";
import { getEnvStatus, getFolderStatus } from "../../lib/status.js";
import { logger } from "../../lib/logger.js";
import type { EnvStatus } from "../../types.js";

interface StatusOptions {
  env?: string;
}

export function registerStatus(program: Command): void {
  program
    .command("status [path]")
    .description("Show encryption status of env files")
    .option("-e, --env <env>", "filter by environment name")
    .action(async (folderArg: string | undefined, opts: StatusOptions) => {
      const config = await loadConfig();

      let statuses: EnvStatus[];

      if (folderArg) {
        const folder = path.resolve(process.cwd(), folderArg);
        statuses = await getFolderStatus(folder, config);
      } else if (config.apps.length > 0) {
        statuses = await getEnvStatus(config);
      } else {
        // Fallback: scan current directory with all configured envs
        statuses = await getFolderStatus(process.cwd(), config);
      }

      // Filter by env if requested
      if (opts.env) {
        statuses = statuses.filter((s) => s.env === opts.env);
      }

      if (statuses.length === 0) {
        logger.warn("No env files found. Check your envage.config.json.");
        return;
      }

      // Group by folder
      const byFolder = new Map<string, EnvStatus[]>();
      for (const s of statuses) {
        const existing = byFolder.get(s.folder) ?? [];
        existing.push(s);
        byFolder.set(s.folder, existing);
      }

      for (const [folder, envStatuses] of byFolder) {
        // Print relative folder name
        const rel = path.relative(process.cwd(), folder) || ".";
        logger.header(rel);

        for (const s of envStatuses) {
          const tag = renderStatusTag(s);
          console.log(`  ${chalk.bold(s.env.padEnd(10))} ${tag}`);
        }
      }

      // Summary
      const encrypted = statuses.filter((s) => s.encrypted && !s.decrypted).length;
      const decrypted = statuses.filter((s) => s.decrypted).length;
      const missing = statuses.filter((s) => !s.encrypted && !s.decrypted).length;

      logger.raw("");
      logger.raw(
        chalk.dim(
          `${statuses.length} entries — ` +
            `${chalk.green(encrypted + " encrypted")}  ` +
            `${chalk.yellow(decrypted + " decrypted")}  ` +
            (missing > 0 ? chalk.red(missing + " missing") : "")
        )
      );
    });
}

function renderStatusTag(s: EnvStatus): string {
  if (s.decrypted && s.encrypted) {
    return (
      chalk.yellow("⚠  both exist") +
      chalk.dim(" (decrypted + encrypted — consider removing the plaintext file)")
    );
  }
  if (s.encrypted) {
    return chalk.green("🔒 encrypted");
  }
  if (s.decrypted) {
    return chalk.yellow("🔓 decrypted") + chalk.dim(" (not yet encrypted)");
  }
  return chalk.red("✗  missing");
}
