import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { generateKeyPairToFolder } from "../src/lib/keygen.js";
import { runEncryptAll } from "../src/cli/commands/encrypt.js";

/**
 * `runEncryptAll` reads envage.config.json from process.cwd() and expands the
 * `apps` globs. Folders without a source .env file for the target env should be
 * skipped (informational), NOT treated as a hard failure.
 */
describe("encrypt --all — glob expansion & skipping", () => {
  let tmpDir: string;
  let keyFile: string;
  let cwdSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(async () => {
    tmpDir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "envage-all-")));

    const result = await generateKeyPairToFolder(".age", tmpDir);
    keyFile = result.keyFile;

    // Monorepo layout: only "." and apps/admin have a root .env.
    await fs.mkdir(path.join(tmpDir, "apps", "admin"), { recursive: true });
    await fs.mkdir(path.join(tmpDir, "apps", "web"), { recursive: true });
    await fs.mkdir(path.join(tmpDir, "apps", "hub"), { recursive: true });
    await fs.writeFile(path.join(tmpDir, ".env"), "ROOT=1", "utf-8");
    await fs.writeFile(path.join(tmpDir, "apps", "admin", ".env"), "A=1", "utf-8");

    await fs.writeFile(
      path.join(tmpDir, "envage.config.json"),
      JSON.stringify({
        apps: [".", "apps/*"],
        envs: ["root", "production"],
        keyFile: ".age/key.txt",
        keyPubFile: ".age/key.pub",
      }),
      "utf-8",
    );

    cwdSpy = jest.spyOn(process, "cwd").mockReturnValue(tmpDir);
  });

  afterEach(async () => {
    cwdSpy.mockRestore();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("encrypts apps that have a .env and skips those that don't (no failure)", async () => {
    await runEncryptAll("root", keyFile);

    // Encrypted where a source .env existed.
    await expect(fs.access(path.join(tmpDir, ".env.age"))).resolves.toBeUndefined();
    await expect(
      fs.access(path.join(tmpDir, "apps", "admin", ".env.age")),
    ).resolves.toBeUndefined();

    // Skipped (no .age written) where the source was missing.
    await expect(
      fs.access(path.join(tmpDir, "apps", "web", ".env.age")),
    ).rejects.toBeTruthy();
    await expect(
      fs.access(path.join(tmpDir, "apps", "hub", ".env.age")),
    ).rejects.toBeTruthy();
  });
});
