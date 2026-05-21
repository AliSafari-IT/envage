# @asafarim/envage

> **Secure, age-based encryption for `.env` files across monorepo environments.**

`envage` lets you safely commit encrypted `.env` files to Git while keeping the
decrypted secrets out of version control. It uses the battle-tested
[age](https://age-encryption.org) encryption format — the same tool used by
Go, Rust, and DevSecOps toolchains worldwide.

---

## Features

- 🔐 **age encryption** — uses `age-encryption` (pure TypeScript, no native deps)
- 🌍 **Multi-environment** — `dev`, `staging`, `prod` and any custom names
- 📁 **Monorepo-aware** — encrypt/decrypt all apps at once with `--all`
- 🔑 **Key or passphrase** — supports X25519 keypairs and passphrase-based encryption
- 🛡 **Git-safe** — auto-updates `.gitignore`; warns if you stage a decrypted file
- ✅ **Production guard** — interactive confirmation required to decrypt `prod` files
- 🧩 **Programmatic API** — use as a library in your own scripts
- 📦 **pnpm / monorepo friendly** — works seamlessly with pnpm workspaces

---

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
# envage.config.json (at the monorepo root)
{
  "apps": ["apps/web", "apps/admin", "packages/api"],
  "envs": ["dev", "staging", "prod"],
  "keyFile": ".age/key.txt"
}
```

### 3. Encrypt your env files

```bash
# Encrypt a single app/env
npx envage encrypt apps/web --env dev

# Encrypt all apps at once
npx envage encrypt --all --env prod
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

Encrypt `.env.<env>` → `.env.<env>.age`.

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
```

---

### `envage decrypt`

Decrypt `.env.<env>.age` → `.env.<env>`.

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

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `apps` | `string[]` | `[]` | App folder paths (relative to cwd) |
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
  ensureGitignore,
} from "@asafarim/envage";

// Generate a keypair
const { identity, recipient } = await generateKeyPair();

// Write keypair to disk
await generateKeyPairToFolder(".age");

// Encrypt a file (key-based)
await encryptEnv({
  folder: "apps/web",
  env: "dev",
  keyFile: ".age/key.txt",
});

// Encrypt a file (passphrase-based)
await encryptEnv({
  folder: "apps/web",
  env: "dev",
  passphrase: "my-secret-passphrase",
});

// Decrypt a file
await decryptEnv({
  folder: "apps/web",
  env: "dev",
  keyFile: ".age/key.txt",
});

// Check status
const config = await loadConfig();
const statuses = await getEnvStatus(config);
statuses.forEach((s) => {
  console.log(`${s.folder} [${s.env}]: encrypted=${s.encrypted} decrypted=${s.decrypted}`);
});

// Ensure .gitignore rules are present
await ensureGitignore();
```

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
│   ├── key.txt          ← private key (gitignored)
│   └── key.pub          ← public key  (commit this)
├── apps/
│   ├── web/
│   │   ├── .env.dev     ← decrypted (gitignored)
│   │   ├── .env.dev.age ← encrypted (committed ✅)
│   │   ├── .env.prod    ← decrypted (gitignored)
│   │   └── .env.prod.age← encrypted (committed ✅)
│   └── admin/
│       ├── .env.dev.age
│       └── .env.prod.age
├── packages/
│   └── api/
│       ├── .env.dev.age
│       └── .env.prod.age
├── envage.config.json   ← committed ✅
└── .gitignore           ← auto-updated by envage
```

---

## Security Notes

- **Never commit `.age/key.txt`** — it is your private key. Share it with
  teammates via a secrets manager (1Password, Vault, AWS SSM, etc.)
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
