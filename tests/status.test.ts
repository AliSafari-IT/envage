import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { checkEnvStatus, getEnvStatus, getFolderStatus } from "../src/lib/status.js";
import { encryptEnv } from "../src/lib/encrypt.js";
import { generateKeyPairToFolder } from "../src/lib/keygen.js";
import type { EnvageConfig } from "../src/types.js";

describe("checkEnvStatus()", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "envage-test-status-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("reports both false when neither file exists", async () => {
    const s = await checkEnvStatus(tmpDir, "dev");
    expect(s.decrypted).toBe(false);
    expect(s.encrypted).toBe(false);
    expect(s.env).toBe("dev");
    expect(s.folder).toBe(tmpDir);
  });

  it("reports decrypted=true when only plaintext exists", async () => {
    await fs.writeFile(path.join(tmpDir, ".env.dev"), "KEY=value");
    const s = await checkEnvStatus(tmpDir, "dev");
    expect(s.decrypted).toBe(true);
    expect(s.encrypted).toBe(false);
  });

  it("reports encrypted=true when only .age file exists", async () => {
    const { keyFile } = await generateKeyPairToFolder(".age", tmpDir);
    await fs.writeFile(path.join(tmpDir, ".env.dev"), "KEY=value");
    await encryptEnv({ folder: tmpDir, env: "dev", keyFile });
    await fs.rm(path.join(tmpDir, ".env.dev"));
    const s = await checkEnvStatus(tmpDir, "dev");
    expect(s.encrypted).toBe(true);
    expect(s.decrypted).toBe(false);
  });

  it("reports both=true when both files exist", async () => {
    const { keyFile } = await generateKeyPairToFolder(".age", tmpDir);
    await fs.writeFile(path.join(tmpDir, ".env.dev"), "KEY=value");
    await encryptEnv({ folder: tmpDir, env: "dev", keyFile });
    // Don't remove the plaintext
    const s = await checkEnvStatus(tmpDir, "dev");
    expect(s.decrypted).toBe(true);
    expect(s.encrypted).toBe(true);
  });

  it("returns correct paths", async () => {
    const s = await checkEnvStatus(tmpDir, "prod");
    expect(s.decryptedPath).toBe(path.join(tmpDir, ".env.prod"));
    expect(s.encryptedPath).toBe(path.join(tmpDir, ".env.prod.age"));
  });
});

describe("getEnvStatus()", () => {
  let tmpDir: string;
  let appA: string;
  let appB: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "envage-test-allstatus-"));
    appA = path.join(tmpDir, "apps", "web");
    appB = path.join(tmpDir, "apps", "admin");
    await fs.mkdir(appA, { recursive: true });
    await fs.mkdir(appB, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("returns entries for every app × env combination", async () => {
    const config: EnvageConfig = {
      apps: [appA, appB],
      envs: ["dev", "prod"],
      keyFile: ".age/key.txt",
    };
    const statuses = await getEnvStatus(config, tmpDir);
    expect(statuses).toHaveLength(4); // 2 apps × 2 envs
  });

  it("correctly reflects mixed state across apps", async () => {
    const { keyFile } = await generateKeyPairToFolder(".age", tmpDir);
    await fs.writeFile(path.join(appA, ".env.dev"), "APP=web");
    const config: EnvageConfig = {
      apps: [appA, appB],
      envs: ["dev"],
      keyFile,
    };
    const statuses = await getEnvStatus(config, tmpDir);
    const webStatus = statuses.find((s) => s.folder === appA && s.env === "dev")!;
    const adminStatus = statuses.find((s) => s.folder === appB && s.env === "dev")!;
    expect(webStatus.decrypted).toBe(true);
    expect(adminStatus.decrypted).toBe(false);
    expect(adminStatus.encrypted).toBe(false);
  });
});

describe("getFolderStatus()", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "envage-test-folderstatus-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("returns one entry per configured env", async () => {
    const config: EnvageConfig = {
      apps: [],
      envs: ["dev", "staging", "prod"],
      keyFile: ".age/key.txt",
    };
    const statuses = await getFolderStatus(tmpDir, config);
    expect(statuses).toHaveLength(3);
    expect(statuses.map((s) => s.env)).toEqual(["dev", "staging", "prod"]);
  });
});
