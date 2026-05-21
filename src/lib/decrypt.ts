/**
 * Decrypts a .env.<env>.age file into .env.<env> using age encryption.
 *
 * Supports both:
 *  - Private key decryption (via keyFile)
 *  - Passphrase-based decryption
 *
 * SECURITY: decrypted content is never logged.
 */
import * as age from "age-encryption";
import fs from "fs/promises";
import path from "path";
import { readIdentityFromFile } from "./keygen.js";
import type { EnvOptions } from "../types.js";
import { resolveEnvFilename, resolveEnvAgeName } from "../types.js";

/**
 * Decrypt a .env.<env>.age file into .env.<env>.
 *
 * Either `keyFile` (path to private key .age/key.txt) or `passphrase` must be supplied.
 *
 * @returns The path to the written plaintext file
 */
export async function decryptEnv(options: EnvOptions): Promise<string> {
  const { folder, env, keyFile, passphrase } = options;

  const cipherPath = path.join(folder, resolveEnvAgeName(env));
  const plainPath = path.join(folder, resolveEnvFilename(env));

  // Read the ciphertext
  let ciphertext: Uint8Array;
  try {
    const buf = await fs.readFile(cipherPath);
    ciphertext = new Uint8Array(buf);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Cannot read ${cipherPath}: ${msg}\n` +
        `Make sure the encrypted file exists before decrypting.`
    );
  }

  const decrypter = new age.Decrypter();

  if (passphrase) {
    decrypter.addPassphrase(passphrase);
  } else if (keyFile) {
    const identity = await readIdentityFromFile(keyFile);
    decrypter.addIdentity(identity);
  } else {
    throw new Error(
      "Either --key (key file path) or --passphrase must be provided for decryption."
    );
  }

  let plaintext: Uint8Array;
  try {
    plaintext = await decrypter.decrypt(ciphertext, "uint8array");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Decryption failed for ${cipherPath}: ${msg}\n` +
        `Check that you are using the correct key or passphrase.`
    );
  }

  // Write decrypted content — never log it
  await fs.writeFile(plainPath, plaintext);

  return plainPath;
}
