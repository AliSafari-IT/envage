import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { ensureGitignore, getGitignoreRules } from "../src/lib/gitignore.js";

describe("ensureGitignore()", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "envage-test-gi-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("creates .gitignore if it does not exist", async () => {
    await ensureGitignore(tmpDir);
    const gitignorePath = path.join(tmpDir, ".gitignore");
    await expect(fs.access(gitignorePath)).resolves.toBeUndefined();
  });

  it("includes .env* ignore rule", async () => {
    await ensureGitignore(tmpDir);
    const content = await fs.readFile(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toContain(".env*");
  });

  it("includes negation for .env*.age", async () => {
    await ensureGitignore(tmpDir);
    const content = await fs.readFile(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toContain("!.env*.age");
  });

  it("includes .age/key.txt ignore rule", async () => {
    await ensureGitignore(tmpDir);
    const content = await fs.readFile(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toContain(".age/key.txt");
  });

  it("appends to an existing .gitignore without destroying it", async () => {
    const existing = "node_modules/\ndist/\n";
    await fs.writeFile(path.join(tmpDir, ".gitignore"), existing);
    await ensureGitignore(tmpDir);
    const content = await fs.readFile(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toContain("node_modules/");
    expect(content).toContain("dist/");
    expect(content).toContain(".env*");
  });

  it("does not duplicate the block if called twice", async () => {
    await ensureGitignore(tmpDir);
    await ensureGitignore(tmpDir);
    const content = await fs.readFile(path.join(tmpDir, ".gitignore"), "utf-8");
    const count = (content.match(/# --- envage managed ---/g) ?? []).length;
    expect(count).toBe(1);
  });
});

describe("getGitignoreRules()", () => {
  it("returns a non-empty string", () => {
    const rules = getGitignoreRules();
    expect(typeof rules).toBe("string");
    expect(rules.length).toBeGreaterThan(0);
  });

  it("contains the envage block markers", () => {
    const rules = getGitignoreRules();
    expect(rules).toContain("# --- envage managed ---");
    expect(rules).toContain("# --- end envage ---");
  });
});
