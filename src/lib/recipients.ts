import * as age from "age-encryption";
import fs from "fs/promises";
import path from "path";
import { loadConfig, resolveApps, CONFIG_FILENAME } from "./config.js";
import { readIdentityFromFile } from "./keygen.js";
import { resolveEnvAgeName } from "../types.js";
import { replaceFiles } from "./transaction.js";

export function validateRecipients(values: unknown): string[] {
  if (!Array.isArray(values) || values.length === 0) throw new Error("At least one public age recipient is required.");
  const result: string[] = [];
  for (const value of values) {
    if (typeof value !== "string" || !value.startsWith("age1")) throw new Error("Invalid public age recipient.");
    try { new age.Encrypter().addRecipient(value); }
    catch { throw new Error("Invalid public age recipient."); }
    if (result.includes(value)) throw new Error("Duplicate public age recipient.");
    result.push(value);
  }
  return result;
}

/** Update all existing ciphertext in configured apps/environments; plaintext stays in memory. */
export async function updateRecipient(
  action: "add" | "remove", recipient: string,
  options: { cwd?: string; keyFile?: string } = {},
): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  validateRecipients([recipient]);
  const configPath = path.join(cwd, CONFIG_FILENAME);
  // Require a real config: never silently omit files on a membership change.
  const lock = await fs.open(`${configPath}.lock`, "wx", 0o600).catch(() => {
    throw new Error("Recipient update locked; ensure no update is running before removing envage.config.json.lock.");
  });
  try {
    if ((await fs.readdir(cwd)).some(name => name.startsWith(".envage-recovery-"))) {
      throw new Error("Unfinished recipient update: restore originals from the recovery manifest before continuing.");
    }
    const before = await fs.readFile(configPath);
    const config = await loadConfig(cwd);
    const raw = JSON.parse(before.toString("utf8"));
    const identity = await readIdentityFromFile(path.resolve(cwd, options.keyFile ?? config.keyFile));
    const current = config.recipients === undefined
      ? [await age.identityToRecipient(identity)] : validateRecipients(config.recipients);
    if (action === "add" && current.includes(recipient)) throw new Error("Duplicate public age recipient.");
    if (action === "remove" && !current.includes(recipient)) throw new Error("Recipient is not configured.");
    const next = validateRecipients(action === "add" ? [...current, recipient] : current.filter(r => r !== recipient));
    const folders = await resolveApps(config, cwd);
    if (!folders.length || !config.envs.length) throw new Error("Configure apps and envs before changing recipients.");
    const changes: {file: string; before: Uint8Array; after: Uint8Array}[] = [];
    const files = new Set(folders.flatMap(folder => config.envs.map(env => path.join(folder, resolveEnvAgeName(env)))));
    for (const file of files) {
      let ciphertext: Buffer;
      try { ciphertext = await fs.readFile(file); }
      catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error; }
      const decrypter = new age.Decrypter();
      decrypter.addIdentity(identity);
      let plaintext: Uint8Array;
      try { plaintext = await decrypter.decrypt(ciphertext, "uint8array"); }
      catch { throw new Error(`Cannot decrypt ${file}; no files changed. Check identity and ciphertext.`); }
      try {
        const encrypter = new age.Encrypter();
        next.forEach(r => encrypter.addRecipient(r));
        changes.push({ file, before: ciphertext, after: await encrypter.encrypt(plaintext) });
      } finally { plaintext.fill(0); }
    }
    const count = changes.length;
    changes.push({file: configPath, before, after: Buffer.from(JSON.stringify({...raw, recipients: next}, null, 2) + "\n")});
    await replaceFiles(changes);
    return count;
  } finally {
    await lock.close();
    await fs.rm(`${configPath}.lock`, { force: true });
  }
}
