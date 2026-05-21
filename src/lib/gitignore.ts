/**
 * Git integration helpers:
 * - generate .gitignore rules for env files
 * - warn if decrypted env files are staged
 */
import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";

/** The gitignore block managed by envage */
const ENVAGE_BLOCK_START = "# --- envage managed ---";
const ENVAGE_BLOCK_END = "# --- end envage ---";

const ENVAGE_RULES = `${ENVAGE_BLOCK_START}
# Decrypted env files — never commit
.env*
!.env*.age
!.env.example
!.env.template
# Age private key
.age/key.txt
${ENVAGE_BLOCK_END}`;

/**
 * Ensures the envage gitignore rules are present in <cwd>/.gitignore.
 * If the file doesn't exist, it is created. If the block already exists,
 * it is updated in place.
 */
export async function ensureGitignore(cwd = process.cwd()): Promise<void> {
  const gitignorePath = path.join(cwd, ".gitignore");

  let existing = "";
  try {
    existing = await fs.readFile(gitignorePath, "utf-8");
  } catch {
    // file doesn't exist — we'll create it
  }

  if (existing.includes(ENVAGE_BLOCK_START)) {
    // Update the block in place
    const startIdx = existing.indexOf(ENVAGE_BLOCK_START);
    const endIdx = existing.indexOf(ENVAGE_BLOCK_END);
    if (endIdx !== -1) {
      const updated =
        existing.slice(0, startIdx) +
        ENVAGE_RULES +
        existing.slice(endIdx + ENVAGE_BLOCK_END.length);
      await fs.writeFile(gitignorePath, updated, "utf-8");
    }
  } else {
    // Append the block
    const separator = existing.endsWith("\n") || existing === "" ? "" : "\n";
    await fs.writeFile(
      gitignorePath,
      existing + separator + "\n" + ENVAGE_RULES + "\n",
      "utf-8"
    );
  }
}

/**
 * Checks whether any staged files in the current git repo are decrypted
 * .env files (i.e. match .env* but NOT .env*.age).
 *
 * Returns an array of offending file paths.
 * Returns empty array if git is not available or not in a repo.
 */
export function checkStagedEnvFiles(cwd = process.cwd()): string[] {
  try {
    const output = execSync("git diff --cached --name-only", {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    const staged = output.split("\n").filter(Boolean);
    return staged.filter((f) => {
      const base = path.basename(f);
      return base.match(/^\.env/) && !base.endsWith(".age");
    });
  } catch {
    return [];
  }
}

/**
 * Returns the recommended gitignore content block as a string (for display).
 */
export function getGitignoreRules(): string {
  return ENVAGE_RULES;
}
