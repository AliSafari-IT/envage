/**
 * Colorized logger for the envage CLI.
 * Uses chalk for output — secrets are never logged.
 */
import chalk from "chalk";

export const logger = {
  /** Informational step message */
  info(msg: string): void {
    console.log(chalk.cyan("ℹ") + " " + msg);
  },

  /** Success message */
  success(msg: string): void {
    console.log(chalk.green("✔") + " " + chalk.green(msg));
  },

  /** Warning message */
  warn(msg: string): void {
    console.warn(chalk.yellow("⚠") + " " + chalk.yellow(msg));
  },

  /** Error message */
  error(msg: string): void {
    console.error(chalk.red("✖") + " " + chalk.red(msg));
  },

  /** Bold section header */
  header(msg: string): void {
    console.log("\n" + chalk.bold(msg));
  },

  /** Dimmed detail line */
  detail(msg: string): void {
    console.log("  " + chalk.dim(msg));
  },

  /** Raw output with no prefix */
  raw(msg: string): void {
    console.log(msg);
  },

  /** Lock icon line — used when encrypting */
  encrypting(from: string, to: string): void {
    console.log(
      chalk.blue("🔐") +
        " Encrypting " +
        chalk.cyan(from) +
        " → " +
        chalk.cyan(to)
    );
  },

  /** Unlock icon line — used when decrypting */
  decrypting(from: string, to: string): void {
    console.log(
      chalk.magenta("🔓") +
        " Decrypting " +
        chalk.cyan(from) +
        " → " +
        chalk.cyan(to)
    );
  },
};
