/**
 * Encrypts a .env.<env> file into .env.<env>.age using age encryption.
 *
 * Supports both:
 *  - Public key encryption (via keyFile / pubFile)
 *  - Passphrase-based encryption
 */
import * as age from "age-encryption";
import fs from "fs/promises";
import path from "path";
import { readRecipientFromFile } from "./keygen.js";
import type { EnvOptions } from "../types.js";

/**
 * Encrypt a .env.<env> file into .env.<env>.age.
 *
 * Either `keyFile` (path to a .age/key.pub) or `passphrase` must be supplied.
 * If `keyFile` points to a private key (key.txt), the corresponding public key
 * is derived automatically if key.pub lives alongside it.
 *
 * @returns The path to the written .age file
 */
export async function encryptEnv(options: EnvOptions): Promise<string> {
  const { folder, env, keyFile, passphrase } = options;

  const plainPath = path.join(folder, `.env.${env}`);
  const cipherPath = path.join(folder, `.env.${env}.age`);

  // Read the plaintext env file
  let plaintext: Uint8Array;
  try {
    const buf = await fs.readFile(plainPath);
    plaintext = new Uint8Array(buf);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Cannot read ${plainPath}: ${msg}\n` +
        `Make sure the file exists before encrypting.`
    );
  }

  const encrypter = new age.Encrypter();

  if (passphrase) {
    encrypter.setPassphrase(passphrase);
  } else if (keyFile) {
    // Determine the pub file: prefer key.pub alongside the key file
    const pubFile = keyFile.replace(/key\.txt$/, "key.pub");
    let recipient: string;
    try {
      recipient = await readRecipientFromFile(pubFile);
    } catch {
      // If no .pub, try reading the keyFile as a private key and deriving the recipient
      const { readIdentityFromFile } = await import("./keygen.js");
      const { identityToRecipient } = await import("age-encryption");
      const identity = await readIdentityFromFile(keyFile);
      recipient = await identityToRecipient(identity);
    }
    encrypter.addRecipient(recipient);
  } else {
    throw new Error(
      "Either --key (key file path) or --passphrase must be provided for encryption."
    );
  }

  const ciphertext = await encrypter.encrypt(plaintext);

  await fs.writeFile(cipherPath, ciphertext);

  return cipherPath;
}

/**
 * Build the encrypted file path for a given folder + env.
 */
export function encryptedPath(folder: string, env: string): string {
  return path.join(folder, `.env.${env}.age`);
}

/**
 * Build the plaintext file path for a given folder + env.
 */
export function plaintextPath(folder: string, env: string): string {
  return path.join(folder, `.env.${env}`);
}
