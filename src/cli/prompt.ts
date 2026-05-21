/**
 * Simple interactive prompt helpers using readline (no extra deps).
 */
import readline from "readline";

/**
 * Ask a yes/no question. Returns true if the user confirms.
 */
export function confirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`${question} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

/**
 * Prompt for a passphrase (hidden input).
 */
export function promptPassphrase(prompt = "Passphrase: "): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Hide input
    if (process.stdin.isTTY) {
      process.stdout.write(prompt);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf-8");

      let passphrase = "";
      const handler = (ch: string) => {
        if (ch === "\n" || ch === "\r" || ch === "") {
          process.stdin.setRawMode(false);
          process.stdin.removeListener("data", handler);
          process.stdout.write("\n");
          rl.close();
          resolve(passphrase);
        } else if (ch === "") {
          passphrase = passphrase.slice(0, -1);
        } else {
          passphrase += ch;
        }
      };
      process.stdin.on("data", handler);
    } else {
      // Non-TTY (piped input) — just read normally
      rl.question(prompt, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}
