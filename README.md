# Commit encrypted .env files with confidence

### @asafarim/envage TS Package

> **Secure, age-based encryption for `.env` files across monorepo environments.**

`envage` lets you safely commit encrypted `.env` files to Git while keeping the
decrypted secrets out of version control. It uses the battle-tested
[age](https://age-encryption.org) encryption format — the same tool used by
Go, Rust, and DevSecOps toolchains worldwide.

---

## Features

- 🔐 **age encryption** — uses `age-encryption` (pure TypeScript, no native deps)
- 🌍 **Multi-environment** — `dev`, `staging`, `prod`, any custom names, or `root` for a plain `.env` file
- 📁 **Monorepo-aware** — encrypt/decrypt all apps at once with `--all`
- 👥 **Team recipients** — independent identities decrypt shared ciphertext; no private-key sharing
- 🔑 **Key or passphrase** — supports X25519 keypairs and passphrase-based encryption
- 🛡 **Git-safe** — auto-updates `.gitignore`; warns if you stage a decrypted file
- ✅ **Production guard** — interactive confirmation required to decrypt `prod` files
- 🧩 **Programmatic API** — use as a library in your own scripts
- 📦 **pnpm / monorepo friendly** — works seamlessly with pnpm workspaces

---

## Compatibility

Requires Node.js 20 or newer. Envage has no React dependency or peer-version
restriction and works in React 18 and React 19 project tooling. Its CLI and
filesystem API run in Node.js, outside browser-rendered components. The demo
uses React 18.

## Installation

```bash
# In your monorepo root
pnpm add -D @asafarim/envage

# Or globally
pnpm add -g @asafarim/envage
```

---

## Quick Start

### 1. Generate a keypair

```bash
npx envage init-key
```

This creates:
```
.age/key.txt   ← private key (mode 0600, gitignored automatically)
.age/key.pub   ← public key  (safe to share with teammates)
```

### 2. Create your config

```bash
# envage.config.json (add it to the monorepo root)
# use relative paths from the monorepo root
# use 'root' for the .env files regardless of environment, 'dev' for development environment .env.dev, 'staging' for staging environment .env.staging, 'prod' for production environment .env.prod
# use '.' for the current directory (monorepo root): "apps": [".", "apps/web"],
{
  "apps": [".", "apps/web", "apps/admin", "packages/api"],
  "envs": ["root", "dev", "staging", "prod"],
  "keyFile": ".age/key.txt"
}
```

### 3. Encrypt your env files

```bash
# Encrypt a single app/env
npx envage encrypt apps/web --env dev

# Encrypt all apps at once
npx envage encrypt --all --env prod

# Encrypt all apps for all environments
npx envage encrypt --all --env root
```

### 4. Check status

```bash
npx envage status
```

```
apps/web
  dev        🔒 encrypted
  staging    🔒 encrypted
  prod       🔒 encrypted

apps/admin
  dev        🔓 decrypted (not yet encrypted)
  prod       🔒 encrypted

packages/api
  dev        🔒 encrypted
  prod       🔒 encrypted

9 entries — 8 encrypted  1 decrypted
```

### 5. Decrypt on a new machine

```bash
# Copy your private key to .age/key.txt (never commit it!)
npx envage decrypt apps/web --env dev

# Decrypt all at once
npx envage decrypt --all --env dev
```

---

## CLI Reference

### `envage init-key`

Generate a new age X25519 keypair.

```bash
envage init-key [--output <folder>]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--output` | `.age` | Output folder for `key.txt` and `key.pub` |

---

### `envage encrypt`

Encrypt `.env.<env>` → `.env.<env>.age` (or `.env` → `.env.age` when `--env root`).

```bash
envage encrypt [path] [options]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--env` | `dev` | Environment name |
| `--key` | auto-detected | Path to age key file |
| `--passphrase` | — | Passphrase (prompted if omitted) |
| `--all` | — | Encrypt all apps in `envage.config.json` |

**Examples:**
```bash
envage encrypt apps/web --env dev
envage encrypt apps/web --env prod --key .age/key.txt
envage encrypt --all --env staging
envage encrypt apps/web --env dev --passphrase "my secret"

# Root env — targets the plain .env file (no suffix)
envage encrypt apps/portal --env root
envage encrypt --all --env root
```

---

### `envage decrypt`

Decrypt `.env.<env>.age` → `.env.<env>` (or `.env.age` → `.env` when `--env root`).

```bash
envage decrypt [path] [options]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--env` | `dev` | Environment name |
| `--key` | auto-detected | Path to age private key file |
| `--passphrase` | — | Passphrase |
| `--all` | — | Decrypt all apps in `envage.config.json` |

> ⚠️ Decrypting `prod` or `production` environments always prompts for
> manual confirmation.

**Examples:**
```bash
envage decrypt apps/web --env dev
envage decrypt --all --env prod

# Root env — targets .env.age → .env
envage decrypt apps/portal --env root
envage decrypt --all --env root
```

---

### `envage status`

Show encryption status for all configured apps and environments.

```bash
envage status [path]
```

| Option | Description |
|--------|-------------|
| `--env` | Filter output to a single environment |

---

## Configuration — `envage.config.json`

Place this file at the root of your monorepo:

```json
{
  "apps": [
    "apps/web",
    "apps/admin",
    "packages/api"
  ],
  "envs": ["dev", "staging", "prod"],
  "keyFile": ".age/key.txt",
  "keyPubFile": ".age/key.pub"
}
```

### Root env — plain `.env` files

Use `"root"` as an env name to target the bare `.env` file (no suffix) in each app folder.
This is useful for projects that already use a single `.env` and don't want to rename it.

```json
{
  "apps": [".", "apps/web", "apps/admin", "packages/api"],
  "envs": ["root", "dev", "staging", "prod"],
  "keyFile": ".age/key.txt"
}
```

| env name | plaintext file | encrypted file |
|----------|---------------|----------------|
| `root` | `.env` | `.env.age` |
| `dev` | `.env.dev` | `.env.dev.age` |
| `staging` | `.env.staging` | `.env.staging.age` |
| `prod` | `.env.prod` | `.env.prod.age` |

### Glob patterns in `apps`

App entries may use glob patterns, which are expanded against the filesystem
to the matching **directories** that exist. This is handy for monorepos where
you don't want to list every package by hand.

```json
{
  "apps": [".", "apps/*", "packages/*"],
  "envs": ["root", "production"],
  "keyFile": ".age/key.txt",
  "keyPubFile": ".age/key.pub"
}
```

- `*` matches a single path segment (e.g. `apps/*` → `apps/web`, `apps/admin`).
- `**` matches nested directories at any depth.
- Only existing directories are matched; files are ignored.
- Non-glob entries (like `.` or `apps/web`) are kept as-is, even if the folder
  does not exist yet.
- Results are de-duplicated, so overlapping patterns are safe.

### Config fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `apps` | `string[]` | `[]` | App folder paths (relative to cwd). Supports glob patterns (see below) |
| `envs` | `string[]` | `["dev","staging","prod"]` | Environment names to manage |
| `keyFile` | `string` | `.age/key.txt` | Path to private key |
| `keyPubFile` | `string` | `.age/key.pub` | Path to public key |

---

## Programmatic API

```typescript
import {
  encryptEnv,
  decryptEnv,
  generateKeyPair,
  generateKeyPairToFolder,
  getEnvStatus,
  loadConfig,
  resolveApps,
  ensureGitignore,
} from "@asafarim/envage";

// Generate a keypair
const { identity, recipient } = await generateKeyPair();

// Write keypair to disk
await generateKeyPairToFolder(".age");

// Encrypt a named env file (.env.dev → .env.dev.age)
await encryptEnv({
  folder: "apps/web",
  env: "dev",
  keyFile: ".age/key.txt",
});

// Encrypt the root env (.env → .env.age)
await encryptEnv({
  folder: "apps/portal",
  env: "root",
  keyFile: ".age/key.txt",
});

// Passphrase-based encryption
await encryptEnv({
  folder: "apps/web",
  env: "dev",
  passphrase: "my-secret-passphrase",
});

// Decrypt a named env file (.env.dev.age → .env.dev)
await decryptEnv({
  folder: "apps/web",
  env: "dev",
  keyFile: ".age/key.txt",
});

// Decrypt the root env (.env.age → .env)
await decryptEnv({
  folder: "apps/portal",
  env: "root",
  keyFile: ".age/key.txt",
});

// Expand app globs ("apps/*") to actual folder paths
const config = await loadConfig();
const folders = await resolveApps(config);
// → ["/repo/apps/web", "/repo/apps/admin", ...]

// Check status (globs in config are expanded automatically)
const statuses = await getEnvStatus(config);
statuses.forEach((s) => {
  console.log(`${s.folder} [${s.env}]: encrypted=${s.encrypted} decrypted=${s.decrypted}`);
});

// Ensure .gitignore rules are present
await ensureGitignore();
```

---

## Team encryption (v0.5.0)

Each teammate runs `envage init-key` locally and shares **only** their public
`key.pub`. Keep private identities on their owner's machine or in a secure backup.
An existing authorized member can onboard another public recipient:

```bash
envage recipient add age1... --key .age/key.txt
envage recipient list
envage recipient remove age1... --key .age/key.txt
```

Replace `age1...` with a complete age X25519 public key. Commands run from the
project root and require an existing `envage.config.json` with nonempty `apps`
and `envs`. Add/remove re-encrypt **all existing ciphertext** in those configured
slots, including glob-expanded apps and `root` environments. Unconfigured files
are outside their scope. Missing ciphertext is skipped. Passphrase-encrypted or
undecryptable files abort the entire operation before replacements begin.

Public recipients are saved in the versioned config:

```json
{
  "apps": [".", "apps/*"],
  "envs": ["root", "dev", "prod"],
  "keyFile": ".age/key.txt",
  "recipients": ["age1...", "age1..."]
}
```

Commit the updated config and ciphertext together. Ordinary CLI encryption uses
configured recipients, even when `--key` is supplied, and needs no private key.
An explicit `--passphrase` selects passphrase encryption instead. Configs without
`recipients` keep the legacy single-key behavior. The first `recipient add`
retains the supplied identity's public key as the initial authorized member.
Duplicate, invalid, unknown, or last-recipient removal requests fail safely.

The programmatic API accepts explicit public recipients:

```ts
await encryptEnv({ folder: "apps/web", env: "dev", recipients: [alicePublic, bobPublic] });
await updateRecipient("add", bobPublic, { cwd: projectRoot, keyFile: ".age/key.txt" });
```

`encryptEnv` does not load config automatically; pass `config.recipients` yourself.
Recipient changes decrypt only in memory, never to plaintext files. Replacements
use same-directory temporary files and atomic renames. On a write failure,
completed replacements are rolled back. Multi-file replacement is **not** one
filesystem transaction: do not run concurrent encryption/config writers. A lock
prevents concurrent recipient updates. Originals and a manifest are saved in a
private `.envage-recovery-*` directory until success or successful rollback.
After a process interruption or failed rollback, stop all writers, restore **every**
original listed in that directory's `manifest.json`, verify decryption, then
remove the recovery directory and `envage.config.json.lock`. Never commit these
recovery artifacts. Keep a secure backup or clean Git checkpoint before changes.

Removing a recipient blocks access to the newly encrypted files only. Old Git
history, ciphertext copies, and previously learned secrets remain accessible.
Rotate underlying API credentials separately if access must be revoked.

---

## Git Integration

### `.gitignore` rules

Running `envage init-key` automatically adds these rules to your `.gitignore`:

```gitignore
# --- envage managed ---
# Decrypted env files — never commit
.env*
!.env*.age
!.env.example
!.env.template
# Age private key
.age/key.txt
# --- end envage ---
```

### Staged file warning

If you accidentally `git add` a decrypted env file before encrypting, the
`encrypt` command will catch it and exit with:

```
✖ You are trying to commit a decrypted env file.
✖ Only encrypted .age files are allowed.
  apps/web/.env.prod
```

### Optional: pre-commit hook

Add this to `.git/hooks/pre-commit` to prevent accidental commits entirely:

```bash
#!/usr/bin/env bash
npx envage status 2>/dev/null | grep -q "decrypted" && \
  echo "❌ You have decrypted env files. Run: npx envage encrypt --all" && \
  exit 1
exit 0
```

---

## Monorepo Structure

```
monorepo/
├── .age/
│   ├── key.txt              ← private key (gitignored)
│   └── key.pub              ← public key  (commit this)
├── apps/
│   ├── web/
│   │   ├── .env.dev         ← decrypted (gitignored)
│   │   ├── .env.dev.age     ← encrypted (committed ✅)
│   │   ├── .env.prod        ← decrypted (gitignored)
│   │   └── .env.prod.age    ← encrypted (committed ✅)
│   ├── admin/
│   │   ├── .env.dev.age
│   │   └── .env.prod.age
│   └── portal/              ← app using root env (plain .env)
│       ├── .env             ← decrypted (gitignored)
│       ├── .env.age         ← encrypted (committed ✅)
│       └── .env.staging.age ← encrypted (committed ✅)
├── packages/
│   └── api/
│       ├── .env.dev.age
│       └── .env.prod.age
├── envage.config.json       ← committed ✅
└── .gitignore               ← auto-updated by envage
```

---

## Security Notes

- **Never commit or share `.age/key.txt`** — it is your private identity.
  Give each teammate their own identity and add only their public recipient.
- **Decrypted values are never logged** — not in verbose mode, not in errors
- **Production decryption is gated** — always requires explicit `y` confirmation
- **Encrypted files are binary** — they cannot be accidentally read as text
- The `age` format provides authenticated encryption; tampering is detectable

---

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Type-check only
pnpm lint
```

---

## License

MIT © [Ali Safarim](https://github.com/asafarim)
