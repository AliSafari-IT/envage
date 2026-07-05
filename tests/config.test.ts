import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fs from "fs/promises";
import os from "os";
import path from "path";
import {
  loadConfig,
  saveConfig,
  resolveAppPaths,
  resolveApps,
  isGlobPattern,
  CONFIG_FILENAME,
} from "../src/lib/config.js";
import type { EnvageConfig } from "../src/types.js";
import { DEFAULT_CONFIG } from "../src/types.js";

describe("loadConfig()", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "envage-test-cfg-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("returns defaults when config file does not exist", async () => {
    const config = await loadConfig(tmpDir);
    expect(config.apps).toEqual(DEFAULT_CONFIG.apps);
    expect(config.envs).toEqual(DEFAULT_CONFIG.envs);
    expect(config.keyFile).toBe(DEFAULT_CONFIG.keyFile);
  });

  it("loads config from envage.config.json", async () => {
    const data: EnvageConfig = {
      apps: ["apps/web", "packages/api"],
      envs: ["dev", "prod"],
      keyFile: ".keys/main.txt",
    };
    await fs.writeFile(
      path.join(tmpDir, CONFIG_FILENAME),
      JSON.stringify(data),
      "utf-8",
    );
    const config = await loadConfig(tmpDir);
    expect(config.apps).toEqual(["apps/web", "packages/api"]);
    expect(config.envs).toEqual(["dev", "prod"]);
    expect(config.keyFile).toBe(".keys/main.txt");
  });

  it("fills missing fields with defaults", async () => {
    await fs.writeFile(
      path.join(tmpDir, CONFIG_FILENAME),
      JSON.stringify({ apps: ["apps/web"] }),
      "utf-8",
    );
    const config = await loadConfig(tmpDir);
    expect(config.apps).toEqual(["apps/web"]);
    expect(config.envs).toEqual(DEFAULT_CONFIG.envs);
    expect(config.keyFile).toBe(DEFAULT_CONFIG.keyFile);
  });
});

describe("saveConfig()", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "envage-test-savecfg-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("writes a valid JSON config file", async () => {
    const config: EnvageConfig = {
      apps: ["apps/web"],
      envs: ["dev"],
      keyFile: ".age/key.txt",
    };
    await saveConfig(config, tmpDir);
    const raw = await fs.readFile(path.join(tmpDir, CONFIG_FILENAME), "utf-8");
    const parsed = JSON.parse(raw) as EnvageConfig;
    expect(parsed.apps).toEqual(["apps/web"]);
    expect(parsed.envs).toEqual(["dev"]);
  });

  it("roundtrips: load → save → load yields same config", async () => {
    const original: EnvageConfig = {
      apps: ["apps/web", "apps/admin"],
      envs: ["dev", "staging", "prod"],
      keyFile: ".age/key.txt",
    };
    await saveConfig(original, tmpDir);
    const reloaded = await loadConfig(tmpDir);
    expect(reloaded.apps).toEqual(original.apps);
    expect(reloaded.envs).toEqual(original.envs);
    expect(reloaded.keyFile).toBe(original.keyFile);
  });
});

describe("resolveAppPaths()", () => {
  it("resolves relative app paths against cwd", () => {
    const root = path.join(os.tmpdir(), "envage-test-project");
    const config: EnvageConfig = {
      apps: ["apps/web", "packages/api"],
      envs: ["dev"],
      keyFile: ".age/key.txt",
    };
    const resolved = resolveAppPaths(config, root);
    expect(resolved).toEqual([
      path.join(root, "apps", "web"),
      path.join(root, "packages", "api"),
    ]);
  });

  it("keeps absolute paths as-is", () => {
    const absApp = path.join(os.tmpdir(), "absolute", "path", "app");
    const config: EnvageConfig = {
      apps: [absApp],
      envs: ["dev"],
      keyFile: ".age/key.txt",
    };
    const root = path.join(os.tmpdir(), "envage-test-project");
    const resolved = resolveAppPaths(config, root);
    expect(resolved).toEqual([absApp]);
  });
});

describe("isGlobPattern()", () => {
  it("detects glob characters", () => {
    expect(isGlobPattern("apps/*")).toBe(true);
    expect(isGlobPattern("packages/**")).toBe(true);
    expect(isGlobPattern("apps/web-?")).toBe(true);
    expect(isGlobPattern("apps/{web,api}")).toBe(true);
  });

  it("returns false for plain paths", () => {
    expect(isGlobPattern(".")).toBe(false);
    expect(isGlobPattern("apps/web")).toBe(false);
    expect(isGlobPattern("packages/api")).toBe(false);
  });
});

describe("resolveApps()", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "envage-test-resolve-"));
    // Create a small monorepo layout:
    //   <tmp>/apps/{web,admin}
    //   <tmp>/packages/api
    //   <tmp>/apps/notes.txt (a file, must be ignored by "apps/*")
    await fs.mkdir(path.join(tmpDir, "apps", "web"), { recursive: true });
    await fs.mkdir(path.join(tmpDir, "apps", "admin"), { recursive: true });
    await fs.mkdir(path.join(tmpDir, "packages", "api"), { recursive: true });
    await fs.writeFile(path.join(tmpDir, "apps", "notes.txt"), "x", "utf-8");
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("expands 'apps/*' to existing subdirectories only", async () => {
    const config: EnvageConfig = {
      apps: ["apps/*"],
      envs: ["dev"],
      keyFile: ".age/key.txt",
    };
    const resolved = await resolveApps(config, tmpDir);
    expect(resolved).toEqual([
      path.join(tmpDir, "apps", "admin"),
      path.join(tmpDir, "apps", "web"),
    ]);
  });

  it("mixes literal entries with glob patterns", async () => {
    const config: EnvageConfig = {
      apps: [".", "apps/*"],
      envs: ["dev"],
      keyFile: ".age/key.txt",
    };
    const resolved = await resolveApps(config, tmpDir);
    expect(resolved).toEqual([
      path.resolve(tmpDir),
      path.join(tmpDir, "apps", "admin"),
      path.join(tmpDir, "apps", "web"),
    ]);
  });

  it("keeps non-glob entries even when the directory does not exist", async () => {
    const config: EnvageConfig = {
      apps: ["apps/does-not-exist"],
      envs: ["dev"],
      keyFile: ".age/key.txt",
    };
    const resolved = await resolveApps(config, tmpDir);
    expect(resolved).toEqual([path.join(tmpDir, "apps", "does-not-exist")]);
  });

  it("expands '**' across nested directories", async () => {
    const config: EnvageConfig = {
      apps: ["**"],
      envs: ["dev"],
      keyFile: ".age/key.txt",
    };
    const resolved = await resolveApps(config, tmpDir);
    expect(resolved).toContain(path.join(tmpDir, "apps"));
    expect(resolved).toContain(path.join(tmpDir, "apps", "web"));
    expect(resolved).toContain(path.join(tmpDir, "packages", "api"));
  });

  it("de-duplicates overlapping matches", async () => {
    const config: EnvageConfig = {
      apps: ["apps/*", "apps/web"],
      envs: ["dev"],
      keyFile: ".age/key.txt",
    };
    const resolved = await resolveApps(config, tmpDir);
    const webCount = resolved.filter(
      (p) => p === path.join(tmpDir, "apps", "web"),
    ).length;
    expect(webCount).toBe(1);
  });
});
