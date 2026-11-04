import { useState } from "react";

type Snippet = { label: string; icon: string; code: string };

const SNIPPETS: Snippet[] = [
  {
    label: "Encrypt",
    icon: "🔐",
    code: `import { encryptEnv } from "@asafarim/envage";

// Named env: .env.dev → .env.dev.age
await encryptEnv({
  folder: "apps/web",
  env: "dev",
  keyFile: ".age/key.txt",
});

// Root env: .env → .env.age
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
});`,
  },
  {
    label: "Recipients",
    icon: "👥",
    code: `import { readFile } from "node:fs/promises";
import { encryptEnv, loadConfig, updateRecipient } from "@asafarim/envage";

// Use a teammate's PUBLIC key file, never their private identity.
const teammatePublic = (await readFile("teammate.pub", "utf8")).trim();

// Re-encrypt existing configured files using an authorized identity.
await updateRecipient("add", teammatePublic, { keyFile: ".age/key.txt" });

// The Node API takes recipients explicitly; the CLI loads them for you.
const config = await loadConfig();
await encryptEnv({
  folder: "apps/web",
  env: "dev",
  recipients: config.recipients,
});

// Removal affects new ciphertext, not old history or known secrets.
await updateRecipient("remove", teammatePublic, { keyFile: ".age/key.txt" });`,
  },
  {
    label: "Decrypt",
    icon: "🔓",
    code: `import { decryptEnv } from "@asafarim/envage";

// Named env: .env.prod.age → .env.prod
await decryptEnv({
  folder: "apps/web",
  env: "prod",
  keyFile: ".age/key.txt",
});

// Root env: .env.age → .env
await decryptEnv({
  folder: "apps/portal",
  env: "root",
  keyFile: ".age/key.txt",
});

// Passphrase-based decryption
await decryptEnv({
  folder: "apps/web",
  env: "dev",
  passphrase: "my-secret-passphrase",
});`,
  },
  {
    label: "Keygen",
    icon: "🔑",
    code: `import {
  generateKeyPair,
  generateKeyPairToFolder,
} from "@asafarim/envage";

// Generate in memory (returns strings)
const { identity, recipient } = await generateKeyPair();
// Keep identity private: never log it or commit it.
console.log(recipient);  // age1...

// Generate and write to disk
await generateKeyPairToFolder(".age");
// Creates: .age/key.txt (mode 0600)
//          .age/key.pub`,
  },
  {
    label: "Status",
    icon: "📊",
    code: `import {
  getEnvStatus,
  loadConfig,
  resolveApps,
} from "@asafarim/envage";

// Load config from envage.config.json
const config = await loadConfig();

// Expand glob patterns ("apps/*") to real folders
const folders = await resolveApps(config);
// → ["/repo/apps/web", "/repo/apps/admin", ...]

// Scan all apps × envs (globs expanded automatically)
const statuses = await getEnvStatus(config);

statuses.forEach((s) => {
  console.log(
    \`\${s.folder} [\${s.env}]\`,
    s.encrypted ? "🔒 encrypted" : "🔓 plaintext",
    s.decrypted  ? "(also decrypted)" : ""
  );
});`,
  },
  {
    label: "Git",
    icon: "🛡️",
    code: `import {
  ensureGitignore,
  checkStagedEnvFiles,
} from "@asafarim/envage";

// Add envage rules to .gitignore
// (runs automatically on init-key too)
await ensureGitignore();

// Detect staged plaintext .env files
const offenders = checkStagedEnvFiles();
if (offenders.length > 0) {
  console.error("❌ Staged decrypted files:", offenders);
  process.exit(1);
}`,
  },
];

function highlight(code: string) {
  return code.split(/(\/\/[^\n]*|"(?:\\.|[^"\\])*"|\b(?:import|from|await|const|async|if|process|true|false|null|undefined)\b|\b\d+\b)/g).map((token, i) => {
    const color = token.startsWith("//") ? "var(--terminal-comment)"
      : token.startsWith('"') ? "var(--terminal-string)"
      : /^(import|from|await|const|async|if|process)$/.test(token) ? "var(--terminal-keyword)"
      : /^(true|false|null|undefined|[0-9]+)$/.test(token) ? "var(--accent-orange)"
      : "var(--terminal-text)";
    return <span key={i} style={{ color }}>{token}</span>;
  });
}

export default function ApiDemo() {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(SNIPPETS[active].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="api-demo"
      className="section"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="container">
        <p className="section-label">Programmatic API</p>
        <h2 className="section-title">Use it as a library</h2>
        <p className="section-subtitle" style={{ marginBottom: 48 }}>
          Use the Node.js API in build scripts and custom tooling. Envage has no React
          dependency and works with React 18 and 19 projects; filesystem encryption runs outside browser components.
        </p>

        <div
          style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24 }}
        >
          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SNIPPETS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setActive(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: active === i ? "var(--bg-card)" : "transparent",
                  border: "1px solid",
                  borderColor:
                    active === i ? "var(--accent-blue)" : "transparent",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  textAlign: "left",
                  color:
                    active === i
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  fontWeight: active === i ? 600 : 400,
                  fontSize: "0.88rem",
                  transition: "all var(--transition)",
                }}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}

            {/* TypeScript badge */}
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--accent-blue)",
                  marginBottom: 6,
                }}
              >
                🔷 Fully typed
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}
              >
                All exports ship with TypeScript declarations. IntelliSense
                works out of the box.
              </div>
            </div>
          </div>

          {/* Code panel */}
          <div key={active} style={{ animation: "fadeInUp 0.3s ease" }}>
            <div
              style={{
                background: "var(--terminal-bg)",
                border: "1px solid var(--terminal-border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  background: "var(--bg-tertiary)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.9rem" }}>
                    {SNIPPETS[active].icon}
                  </span>
                  <span
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    TypeScript
                  </span>
                </div>
                <button
                  onClick={copy}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: copied ? "var(--accent-green)" : "var(--text-muted)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    transition: "color 0.2s",
                  }}
                >
                  {copied ? "✔ copied" : "copy"}
                </button>
              </div>
              <pre
                style={{
                  padding: "20px 24px",
                  margin: 0,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "0.83rem",
                  lineHeight: 1.75,
                  overflowX: "auto",
                }}
              ><code>{highlight(SNIPPETS[active].code)}</code></pre>
            </div>
          </div>
        </div>

        {/* Type exports */}
        <div style={{ marginTop: 48 }}>
          <h3 style={{ marginBottom: 20, color: "var(--text-primary)" }}>
            Type exports
          </h3>
          <div className="grid-3">
            {[
              {
                name: "EnvOptions",
                desc: "Options for encryptEnv / decryptEnv (folder, env, keyFile, passphrase, recipients)",
              },
              {
                name: "EnvStatus",
                desc: "Status of a single folder+env slot: encrypted, decrypted, paths",
              },
              {
                name: "EnvageConfig",
                desc: "Shape of envage.config.json: apps, envs, keyFile, keyPubFile, recipients",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="card"
                style={{ padding: "20px 24px" }}
              >
                <code
                  style={{
                    color: "var(--accent-blue)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  {t.name}
                </code>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    marginTop: 8,
                    lineHeight: 1.5,
                  }}
                >
                  {t.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          #api-demo .container > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
