/**
 * @asafarim/envage CLI entry point.
 *
 * Registered commands:
 *   encrypt   — Encrypt .env.<env> → .env.<env>.age
 *   decrypt   — Decrypt .env.<env>.age → .env.<env>
 *   init-key  — Generate an age keypair
 *   status    — Show encryption status
 */
import { Command } from "commander";
import { createRequire } from "module";
import { registerEncrypt } from "./commands/encrypt.js";
import { registerDecrypt } from "./commands/decrypt.js";
import { registerInitKey } from "./commands/init-key.js";
import { registerStatus } from "./commands/status.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pkg = require("../../package.json") as { version: string; description: string };

export function createCLI(): Command {
  const program = new Command();

  program
    .name("envage")
    .version(pkg.version)
    .description(pkg.description)
    .addHelpText(
      "after",
      `
Examples:
  $ envage init-key
  $ envage encrypt apps/web --env dev
  $ envage encrypt --all --env prod
  $ envage decrypt apps/web --env dev
  $ envage decrypt --all --env prod
  $ envage status
  $ envage status apps/web`
    );

  registerEncrypt(program);
  registerDecrypt(program);
  registerInitKey(program);
  registerStatus(program);

  return program;
}

export async function runCLI(): Promise<void> {
  const program = createCLI();
  await program.parseAsync(process.argv);
}
