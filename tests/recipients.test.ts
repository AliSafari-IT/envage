import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import fs from "fs/promises";
import path from "path";
import os from "os";
import * as age from "age-encryption";
import { generateKeyPairToFolder, generateKeyPair } from "../src/lib/keygen.js";
import { encryptEnv } from "../src/lib/encrypt.js";
import { updateRecipient, validateRecipients } from "../src/lib/recipients.js";
import { createCLI } from "../src/cli/index.js";
import { loadConfig, saveConfig } from "../src/lib/config.js";

describe("recipient lifecycle", () => {
  let cwd: string, keyFile: string, second: Awaited<ReturnType<typeof generateKeyPair>>;
  beforeEach(async () => {
    cwd = await fs.mkdtemp(path.join(os.tmpdir(), "envage-team-"));
    ({ keyFile } = await generateKeyPairToFolder(".age", cwd));
    second = await generateKeyPair();
    await saveConfig({ apps: [".", "apps/*"], envs: ["root", "dev"], keyFile: ".age/key.txt", custom: "preserved" } as any, cwd);
    await fs.mkdir(path.join(cwd, "apps/web"), {recursive: true});
    for (const folder of [cwd, path.join(cwd, "apps/web")]) {
      await fs.writeFile(path.join(folder, ".env.dev"), "TOKEN=test-fixture");
      await encryptEnv({folder, env: "dev", keyFile});
      await fs.rm(path.join(folder, ".env.dev"));
    }
  });
  afterEach(async () => { jest.restoreAllMocks(); await fs.rm(cwd, {recursive: true, force: true}); });
  async function decrypt(identity: string, folder = cwd) {
    const d = new age.Decrypter(); d.addIdentity(identity);
    return d.decrypt(await fs.readFile(path.join(folder, ".env.dev.age")), "text");
  }
  it("onboards independent keys across a glob monorepo without plaintext files", async () => {
    expect(await updateRecipient("add", second.recipient, {cwd})).toBe(2);
    const first = (await fs.readFile(keyFile, "utf8")).split("\n").find(l => l.startsWith("AGE-SECRET"))!;
    for (const folder of [cwd, path.join(cwd, "apps/web")]) {
      expect(await decrypt(first, folder)).toBe("TOKEN=test-fixture");
      expect(await decrypt(second.identity, folder)).toBe("TOKEN=test-fixture");
      await expect(fs.access(path.join(folder, ".env.dev"))).rejects.toThrow();
    }
    expect(JSON.parse(await fs.readFile(path.join(cwd, "envage.config.json"), "utf8")).custom).toBe("preserved");
  });
  it("removes access to new ciphertext while keeping the remaining identity authorized", async () => {
    await updateRecipient("add", second.recipient, {cwd});
    await updateRecipient("remove", second.recipient, {cwd});
    await expect(decrypt(second.identity)).rejects.toThrow();
    const first = (await fs.readFile(keyFile, "utf8")).split("\n").find(l => l.startsWith("AGE-SECRET"))!;
    expect(await decrypt(first)).toBe("TOKEN=test-fixture");
  });
  it("rejects invalid, duplicate, missing, and final recipients", async () => {
    expect(() => validateRecipients(["age1invalid"])).toThrow(/Invalid/);
    expect(() => validateRecipients([second.recipient, second.recipient])).toThrow(/Duplicate/);
    await expect(updateRecipient("remove", second.recipient, {cwd})).rejects.toThrow(/not configured/);
    await updateRecipient("add", second.recipient, {cwd});
    await expect(updateRecipient("add", second.recipient, {cwd})).rejects.toThrow(/Duplicate/);
    await updateRecipient("remove", second.recipient, {cwd});
    await expect(updateRecipient("remove", (await loadConfig(cwd)).recipients![0], {cwd})).rejects.toThrow(/At least one/);
  });
  it("fails before writes if any ciphertext is undecryptable", async () => {
    const before = await fs.readFile(path.join(cwd, ".env.dev.age"));
    const config = await fs.readFile(path.join(cwd, "envage.config.json"));
    await fs.writeFile(path.join(cwd, "apps/web/.env.dev.age"), "broken");
    await expect(updateRecipient("add", second.recipient, {cwd})).rejects.toThrow(/Cannot decrypt/);
    expect(await fs.readFile(path.join(cwd, ".env.dev.age"))).toEqual(before);
    expect(await fs.readFile(path.join(cwd, "envage.config.json"))).toEqual(config);
  });
  it.each([2, 3])("rolls back ciphertext and config when replacement %i fails", async (failure) => {
    const files = [".env.dev.age", "apps/web/.env.dev.age", "envage.config.json"].map(f => path.join(cwd, f));
    const before = await Promise.all(files.map(f => fs.readFile(f)));
    const rename = fs.rename.bind(fs); let calls = 0;
    jest.spyOn(fs, "rename").mockImplementation(async (a, b) => {
      if (files.includes(String(b)) && ++calls === failure) throw new Error("injected rename failure");
      return rename(a, b);
    });
    await expect(updateRecipient("add", second.recipient, {cwd})).rejects.toThrow(/injected/);
    expect(await Promise.all(files.map(f => fs.readFile(f)))).toEqual(before);
    expect((await fs.readdir(cwd)).filter(f => /\.tmp$|\.lock$/.test(f))).toEqual([]);
  });
  it("keeps recovery backups and blocks further changes if rollback fails", async () => {
    const file = path.join(cwd, ".env.dev.age");
    const original = await fs.readFile(file);
    const rename = fs.rename.bind(fs); let replacements = 0;
    jest.spyOn(fs, "rename").mockImplementation(async (a, b) => {
      if (!String(b).includes(".envage-recovery-") && ++replacements >= 2) throw new Error("persistent disk failure");
      return rename(a, b);
    });
    await expect(updateRecipient("add", second.recipient, {cwd})).rejects.toThrow(/Rollback failed/);
    jest.restoreAllMocks();
    const recovery = (await fs.readdir(cwd)).find(f => f.startsWith(".envage-recovery-"))!;
    const manifest = JSON.parse(await fs.readFile(path.join(cwd, recovery, "manifest.json"), "utf8"));
    expect(await fs.readFile(path.join(cwd, recovery, manifest[0].backup))).toEqual(original);
    await expect(updateRecipient("add", second.recipient, {cwd})).rejects.toThrow(/Unfinished/);
  });
  it("preserves root environment ciphertext during membership updates", async () => {
    await fs.writeFile(path.join(cwd, ".env"), "ROOT=yes");
    await encryptEnv({folder: cwd, env: "root", keyFile});
    await fs.rm(path.join(cwd, ".env"));
    expect(await updateRecipient("add", second.recipient, {cwd})).toBe(3);
    const d = new age.Decrypter(); d.addIdentity(second.identity);
    expect(await d.decrypt(await fs.readFile(path.join(cwd, ".env.age")), "text")).toBe("ROOT=yes");
    await expect(fs.access(path.join(cwd, ".env"))).rejects.toThrow();
  });
  it("honors an existing transaction lock", async () => {
    await fs.writeFile(path.join(cwd, "envage.config.json.lock"), "");
    await expect(updateRecipient("add", second.recipient, {cwd})).rejects.toThrow(/locked/);
  });
  it("encrypts directly to multiple recipients without a private key", async () => {
    const third = await generateKeyPair();
    await fs.writeFile(path.join(cwd, ".env.dev"), "PUBLIC_ONLY=yes");
    await encryptEnv({folder: cwd, env: "dev", recipients: [second.recipient, third.recipient]});
    expect(await decrypt(second.identity)).toBe("PUBLIC_ONLY=yes");
    expect(await decrypt(third.identity)).toBe("PUBLIC_ONLY=yes");
    await expect(encryptEnv({folder: cwd, env: "dev", recipients: [], passphrase: "x"})).rejects.toThrow();
  });
  it("CLI encrypts with configured public recipients even without local private keys", async () => {
    await updateRecipient("add", second.recipient, {cwd});
    await fs.rm(keyFile);
    await fs.writeFile(path.join(cwd, ".env.dev"), "TEAM=yes");
    const previous = process.cwd();
    try {
      process.chdir(cwd);
      await createCLI().parseAsync(["encrypt", "--all", "--env", "dev"], {from: "user"});
      expect(await decrypt(second.identity)).toBe("TEAM=yes");
    } finally { process.chdir(previous); }
  });
  it("rejects malformed config rather than falling back to defaults", async () => {
    await fs.writeFile(path.join(cwd, "envage.config.json"), "{");
    await expect(loadConfig(cwd)).rejects.toThrow(/Cannot load/);
  });
});
