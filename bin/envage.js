#!/usr/bin/env node
/**
 * @asafarim/envage CLI entrypoint
 * Compiled output lives in dist/cli/index.js
 */
import { runCLI } from "../dist/cli/index.js";

runCLI().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
