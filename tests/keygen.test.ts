import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fs from "fs/promises";
import os from "os";
import path from "path";
import {
  generateKeyPair,
  generateKeyPairToFolder,
  readIdentityFromFile,
  readRecipientFromFile,
} from "../src/lib/keygen.js";

describe("generateKeyPair()", () => {
  it("returns a valid age identity string", async () => {
    const { identity } = await generateKeyPair();
    expect(identity).toMatch(/^AGE-SECRET-KEY-1/);
  });

  it("returns a valid age recipient string", async () => {
    const { recipient } = await generateKeyPair();
    expect(recipient).toMatch(/^age1/);
  });

  it("generates unique keypairs on each call", async () => {
    const a = await generateKeyPair();
    const b = await generateKeyPair();
    expect(a.identity).not.toBe(b.identity);
    expect(a.recipient).not.toBe(b.recipient);
  });
});

describe("generateKeyPairToFolder()", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "envage-test-keygen-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("creates key.txt and key.pub files", async () => {
    await generateKeyPairToFolder(".age", tmpDir);
    const keyFile = path.join(tmpDir, ".age", "key.txt");
    const pubFile = path.join(tmpDir, ".age", "key.pub");
    await expect(fs.access(keyFile)).resolves.toBeUndefined();
    await expect(fs.access(pubFile)).resolves.toBeUndefined();
  });

  it("key.txt contains the AGE-SECRET-KEY-1 identity", async () => {
    await generateKeyPairToFolder(".age", tmpDir);
    const keyFile = path.join(tmpDir, ".age", "key.txt");
    const content = await fs.readFile(keyFile, "utf-8");
    expect(content).toMatch(/AGE-SECRET-KEY-1/);
  });

  it("key.pub contains the age1 recipient", async () => {
    await generateKeyPairToFolder(".age", tmpDir);
    const pubFile = path.join(tmpDir, ".age", "key.pub");
    const content = await fs.readFile(pubFile, "utf-8");
    expect(content.trim()).toMatch(/^age1/);
  });

  it("key.txt has mode 0600 (owner-only read/write)", async () => {
    await generateKeyPairToFolder(".age", tmpDir);
    const keyFile = path.join(tmpDir, ".age", "key.txt");
    const stat = await fs.stat(keyFile);
    // On Unix: mode & 0o777 === 0o600
    if (process.platform !== "win32") {
      expect(stat.mode & 0o777).toBe(0o600);
    }
  });
});

describe("readIdentityFromFile()", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "envage-test-read-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("reads the identity from a standard key.txt", async () => {
    const { keyFile } = await generateKeyPairToFolder(".age", tmpDir);
    const identity = await readIdentityFromFile(keyFile);
    expect(identity).toMatch(/^AGE-SECRET-KEY-1/);
  });

  it("ignores comment lines", async () => {
    const keyPath = path.join(tmpDir, "mykey.txt");
    const { identity: expected } = await generateKeyPair();
    await fs.writeFile(keyPath, `# this is a comment\n# another comment\n${expected}\n`);
    const read = await readIdentityFromFile(keyPath);
    expect(read).toBe(expected);
  });

  it("throws if the file contains no valid identity", async () => {
    const keyPath = path.join(tmpDir, "empty.txt");
    await fs.writeFile(keyPath, "# only comments\n");
    await expect(readIdentityFromFile(keyPath)).rejects.toThrow(
      /No valid age identity/
    );
  });
});

describe("readRecipientFromFile()", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "envage-test-pub-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("reads the recipient from a standard key.pub", async () => {
    const { pubFile } = await generateKeyPairToFolder(".age", tmpDir);
    const recipient = await readRecipientFromFile(pubFile);
    expect(recipient).toMatch(/^age1/);
  });
});
