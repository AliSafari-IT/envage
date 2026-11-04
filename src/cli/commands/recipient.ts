import type { Command } from "commander";
import { loadConfig } from "../../lib/config.js";
import { updateRecipient, validateRecipients } from "../../lib/recipients.js";

export function registerRecipient(program: Command): void {
  const command = program.command("recipient").description("Manage public recipients and re-encrypt configured ciphertext");
  command.command("list").action(async () => {
    const config = await loadConfig();
    if (config.recipients === undefined) console.log("Legacy single-key mode (no explicit recipients configured).");
    else validateRecipients(config.recipients).forEach(r => console.log(r));
  });
  for (const action of ["add", "remove"] as const) {
    command.command(`${action} <recipient>`)
      .description(`${action} a public recipient across all configured apps and environments`)
      .option("--key <file>", "existing authorized private identity for re-encryption")
      .action(async (recipient: string, opts: {key?: string}) => {
        const count = await updateRecipient(action, recipient, {keyFile: opts.key});
        console.log(`Recipients updated; re-encrypted ${count} file(s).`);
      });
  }
}
