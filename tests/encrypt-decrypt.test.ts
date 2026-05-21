import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { encryptEnv } from "../src/lib/encrypt.js";
import { decryptEnv } from "../src/lib/decrypt.js";
import { generateKeyPairToFolder } from "../src/lib/keygen.js";

const TEST_ENV_CONTENT = `
APP_NAME=my-app
DATABASE_URL=postgres://user:secret@localhost:5432/mydb
API_KEY=super-secret-key-12345
NODE_ENV=development
`.trim();

describe("encrypt / decrypt roundtrip — key-based", () => {
  let tmpDir: string;
  let keyFile: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "envage-test-enc-"));
    // Generate a keypair in the temp folder
    const result = await generateKeyPairToFolder(".age", tmpDir);
    keyFile = result.keyFile;
    // Write a sample .env.dev
    await fs.writeFile(path.join(tmpDir, ".env.dev"), TEST_ENV_CONTENT, "utf-8");
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("creates a .env.dev.age file after encryption", async () => {
    await encryptEnv({ folder: tmpDir, env: "dev", keyFile });
    const agePath = path.join(tmpDir, ".env.dev.age");
    await expect(fs.access(agePath)).resolves.toBeUndefined();
  });

  it("encrypted file is not human-readable plaintext", async () => {
    await encryptEnv({ folder: tmpDir, env: "dev", keyFile });
    const cipherBuf = await fs.readFile(path.join(tmpDir, ".env.dev.age"));
    expect(cipherBuf.toString("utf-8")).not.toContain("APP_NAME");
    expect(cipherBuf.toString("utf-8")).not.toContain("super-secret-key");
  });

  it("decrypts back to the original content", async () => {
    await encryptEnv({ folder: tmpDir, env: "dev", keyFile });
    // Remove the plaintext file to prove decrypt recreates it
    await fs.rm(path.join(tmpDir, ".env.dev"));
    await decryptEnv({ folder: tmpDir, env: "dev", keyFile });
    const decrypted = await fs.readFile(path.join(tmpDir, ".env.dev"), "utf-8");
    expect(decrypted).toBe(TEST_ENV_CONTENT);
  });

  it("returns the path to the encrypted file", async () => {
    const result = await encryptEnv({ folder: tmpDir, env: "dev", keyFile });
    expect(result).toBe(path.join(tmpDir, ".env.dev.age"));
  });

  it("returns the path to the decrypted file", async () => {
    await encryptEnv({ folder: tmpDir, env: "dev", keyFile });
    await fs.rm(path.join(tmpDir, ".env.dev"));
    const result = await decryptEnv({ folder: tmpDir, env: "dev", keyFile });
    expect(result).toBe(path.join(tmpDir, ".env.dev"));
  });

  it("handles multiple environments independently", async () => {
    await fs.writeFile(path.join(tmpDir, ".env.prod"), "ENV=production\nSECRET=prod-secret");
    await encryptEnv({ folder: tmpDir, env: "dev", keyFile });
    await encryptEnv({ folder: tmpDir, env: "prod", keyFile });

    await fs.rm(path.join(tmpDir, ".env.dev"));
    await fs.rm(path.join(tmpDir, ".env.prod"));

    await decryptEnv({ folder: tmpDir, env: "dev", keyFile });
    await decryptEnv({ folder: tmpDir, env: "prod", keyFile });

    const devContent = await fs.readFile(path.join(tmpDir, ".env.dev"), "utf-8");
    const prodContent = await fs.readFile(path.join(tmpDir, ".env.prod"), "utf-8");

    expect(devContent).toBe(TEST_ENV_CONTENT);
    expect(prodContent).toBe("ENV=production\nSECRET=prod-secret");
  });
});

describe("encrypt / decrypt roundtrip — passphrase-based", () => {
  let tmpDir: string;
  const PASSPHRASE = "test-passphrase-do-not-use-in-prod";

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "envage-test-pass-"));
    await fs.writeFile(path.join(tmpDir, ".env.dev"), TEST_ENV_CONTENT, "utf-8");
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("encrypts and decrypts correctly with a passphrase", async () => {
    await encryptEnv({ folder: tmpDir, env: "dev", passphrase: PASSPHRASE });
    await fs.rm(path.join(tmpDir, ".env.dev"));
    await decryptEnv({ folder: tmpDir, env: "dev", passphrase: PASSPHRASE });
    const content = await fs.readFile(path.join(tmpDir, ".env.dev"), "utf-8");
    expect(content).toBe(TEST_ENV_CONTENT);
  });

  it("fails to decrypt with the wrong passphrase", async () => {
    await encryptEnv({ folder: tmpDir, env: "dev", passphrase: PASSPHRASE });
    await fs.rm(path.join(tmpDir, ".env.dev"));
    await expect(
      decryptEnv({ folder: tmpDir, env: "dev", passphrase: "wrong-passphrase" })
    ).rejects.toThrow(/Decryption failed/);
  });
});

describe("encrypt error handling", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "envage-test-err-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("throws if the plaintext file does not exist", async () => {
    await expect(
      encryptEnv({ folder: tmpDir, env: "dev", passphrase: "test" })
    ).rejects.toThrow(/Cannot read/);
  });

  it("throws if no key or passphrase is provided", async () => {
    await fs.writeFile(path.join(tmpDir, ".env.dev"), "KEY=value");
    await expect(
      encryptEnv({ folder: tmpDir, env: "dev" })
    ).rejects.toThrow(/Either --key.*or --passphrase/);
  });
});

describe("decrypt error handling", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "envage-test-derr-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("throws if the encrypted file does not exist", async () => {
    await expect(
      decryptEnv({ folder: tmpDir, env: "dev", passphrase: "test" })
    ).rejects.toThrow(/Cannot read/);
  });

  it("throws if no key or passphrase is provided", async () => {
    const cipherPath = path.join(tmpDir, ".env.dev.age");
    // Write a dummy file so the "file not found" check passes
    await fs.writeFile(cipherPath, Buffer.from([0x00, 0x01]));
    await expect(
      decryptEnv({ folder: tmpDir, env: "dev" })
    ).rejects.toThrow(/Either --key.*or --passphrase/);
  });
});
