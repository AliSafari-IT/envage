/**
 * Age keypair generation.
 * Produces an identity (private key) and recipient (public key)
 * in the standard age text format.
 */
import * as age from "age-encryption";
import fs from "fs/promises";
import path from "path";

export interface KeyPair {
  /** Private key string — starts with AGE-SECRET-KEY-1 */
  identity: string;
  /** Public key string — starts with age1 */
  recipient: string;
}

/**
 * Generate a new age X25519 keypair and return the strings.
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const identity = await age.generateIdentity();
  const recipient = await age.identityToRecipient(identity);
  return { identity, recipient };
}

/**
 * Generate a new keypair and write it to disk.
 *
 * @param outputFolder  Directory to write key.txt and key.pub (default: ".age")
 * @param cwd           Base directory (default: process.cwd())
 */
export async function generateKeyPairToFolder(
  outputFolder = ".age",
  cwd = process.cwd()
): Promise<{ keyFile: string; pubFile: string }> {
  const { identity, recipient } = await generateKeyPair();

  const absFolder = path.isAbsolute(outputFolder)
    ? outputFolder
    : path.join(cwd, outputFolder);

  await fs.mkdir(absFolder, { recursive: true });

  const keyFile = path.join(absFolder, "key.txt");
  const pubFile = path.join(absFolder, "key.pub");

  const timestamp = new Date().toISOString();
  const keyContent = `# created: ${timestamp}\n# public key: ${recipient}\n${identity}\n`;

  await fs.writeFile(keyFile, keyContent, { encoding: "utf-8", mode: 0o600 });
  await fs.writeFile(pubFile, recipient + "\n", "utf-8");

  return { keyFile, pubFile };
}

/**
 * Read the private key (identity) from a key file.
 * Strips comments and blank lines; returns the first non-comment line.
 */
export async function readIdentityFromFile(keyFile: string): Promise<string> {
  const contents = await fs.readFile(keyFile, "utf-8");
  const identity = contents
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#"));

  if (!identity) {
    throw new Error(`No valid age identity found in key file: ${keyFile}`);
  }
  return identity;
}

/**
 * Read the public key (recipient) from a .pub file.
 */
export async function readRecipientFromFile(pubFile: string): Promise<string> {
  const contents = await fs.readFile(pubFile, "utf-8");
  const recipient = contents
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#"));

  if (!recipient) {
    throw new Error(`No valid age recipient found in pub file: ${pubFile}`);
  }
  return recipient;
}
