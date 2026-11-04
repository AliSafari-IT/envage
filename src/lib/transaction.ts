import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/** Replace one file using a private, same-directory temporary file. */
export async function atomicWrite(file: string, data: Uint8Array | string): Promise<void> {
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    const handle = await fs.open(temp, "wx", 0o600);
    try { await handle.writeFile(data); await handle.sync(); }
    finally { await handle.close(); }
    await fs.rename(temp, file);
  } finally {
    await fs.rm(temp, { force: true });
  }
}

/** Roll back completed replacements if a later replacement fails. */
export async function replaceFiles(changes: { file: string; before: Uint8Array; after: Uint8Array }[]): Promise<void> {
  if (!changes.length) return;
  // Keep durable ciphertext/config backups for process interruption or failed rollback.
  const recovery = await fs.mkdtemp(path.join(path.dirname(changes[changes.length - 1].file), ".envage-recovery-"));
  let retainRecovery = false;
  const completed: typeof changes = [];
  try {
    for (const [index, change] of changes.entries()) {
      await atomicWrite(path.join(recovery, `${index}.backup`), change.before);
    }
    await atomicWrite(path.join(recovery, "manifest.json"), JSON.stringify(changes.map((c, i) => ({file: c.file, backup: `${i}.backup`})), null, 2));
    for (const change of changes) {
      // Reject concurrent edits before overwriting them.
      if (!Buffer.from(await fs.readFile(change.file)).equals(Buffer.from(change.before))) {
        throw new Error("File changed during recipient update; retry with no concurrent writers.");
      }
      await atomicWrite(change.file, change.after);
      completed.push(change);
    }
  } catch (error) {
    const failures: string[] = [];
    for (const change of completed.reverse()) {
      try { await atomicWrite(change.file, change.before); }
      catch { failures.push(change.file); }
    }
    if (failures.length) {
      retainRecovery = true;
      throw new Error(`Rollback failed for: ${failures.join(", ")}. Restore originals from ${recovery}/manifest.json before continuing.`);
    }
    throw error;
  } finally {
    if (!retainRecovery) await fs.rm(recovery, { recursive: true, force: true });
  }
}
