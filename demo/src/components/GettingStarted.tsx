import { useState } from "react";

const STEPS = [
  {
    number: "01",
    title: "Install the package",
    description: "Add envage as a dev dependency in your monorepo root. Works with npm, yarn, and pnpm.",
    color: "var(--accent-green)",
    code: `# pnpm (recommended for monorepos)
pnpm add -D @asafarim/envage

# npm
npm install --save-dev @asafarim/envage

# yarn
yarn add --dev @asafarim/envage`,
    lang: "bash",
  },
  {
    number: "02",
    title: "Generate your keypair",
    description: "Run init-key once in your repo root. It creates a private key (.gitignored automatically) and a public key you can share with teammates.",
    color: "var(--accent-blue)",
    code: `npx envage init-key

# Output:
# ℹ Generating age X25519 keypair in .age/
# ✔ Private key written to: .age/key.txt
# ✔ Public key written to:  .age/key.pub
# ✔ .gitignore updated.
# ⚠ IMPORTANT: Never commit your private key (.age/key.txt).`,
    lang: "bash",
  },
  {
    number: "03",
    title: "Configure your apps",
    description: "Create envage.config.json at your monorepo root. List your app folders and environment names. Use \"root\" as an env name to target a plain .env file instead of .env.<env>.",
    color: "var(--accent-purple)",
    code: `// envage.config.json
{
  "apps": [
    "apps/web",
    "apps/admin",
    "packages/api"
  ],
  "envs": ["dev", "staging", "prod"],
  "keyFile": ".age/key.txt"
}

// Use "root" to target a plain .env file:
{
  "apps": ["apps/portal"],
  "envs": ["root", "staging", "prod"],
  "keyFile": ".age/key.txt"
}
// "root" → encrypts .env → .env.age`,
    lang: "json",
  },
  {
    number: "04",
    title: "Encrypt & commit",
    description: "Create your .env files normally, then encrypt them. Only the .age files go into Git — the plaintext files are gitignored.",
    color: "var(--accent-orange)",
    code: `# Encrypt a single app/env
npx envage encrypt apps/web --env dev

# Encrypt ALL apps at once
npx envage encrypt --all --env prod

# Check what's encrypted / decrypted
npx envage status`,
    lang: "bash",
  },
];

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: "relative",
      background: "var(--terminal-bg)",
      border: "1px solid var(--terminal-border)",
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px",
        background: "var(--bg-tertiary)",
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
          {lang === "bash" ? "terminal" : lang}
        </span>
        <button onClick={copy} style={{
          background: "none", border: "none", cursor: "pointer",
          color: copied ? "var(--accent-green)" : "var(--text-muted)",
          fontSize: "0.75rem", fontWeight: 600, transition: "color 0.2s",
        }}>
          {copied ? "✔ copied" : "copy"}
        </button>
      </div>
      <pre style={{
        padding: "16px 20px",
        margin: 0,
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "0.82rem",
        lineHeight: 1.7,
        color: "var(--terminal-text)",
        overflowX: "auto",
        whiteSpace: "pre",
      }}>
        {lang === "bash"
          ? code.split("\n").map((line, i) => (
              <span key={i} style={{ display: "block" }}>
                {line.startsWith("#")
                  ? <span style={{ color: "var(--terminal-comment)" }}>{line}</span>
                  : line.startsWith("npx") || line.startsWith("pnpm") || line.startsWith("npm") || line.startsWith("yarn")
                  ? <><span style={{ color: "var(--terminal-prompt)" }}>$ </span><span>{line}</span></>
                  : line.startsWith("# Output") || line.startsWith("#")
                  ? <span style={{ color: "var(--terminal-comment)" }}>{line}</span>
                  : <span style={{ color: "var(--text-secondary)" }}>{line}</span>}
              </span>
            ))
          : <code>{code}</code>
        }
      </pre>
    </div>
  );
}

export default function GettingStarted() {
  const [activeStep, setActiveStep] = useState(0);
  const step = STEPS[activeStep];

  return (
    <section id="getting-started" className="section">
      <div className="container">
        <p className="section-label">Onboarding</p>
        <h2 className="section-title">Get started in 4 steps</h2>
        <p className="section-subtitle" style={{ marginBottom: 60 }}>
          From installation to your first encrypted commit in under 5 minutes.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32, alignItems: "start" }}>
          {/* Step list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "sticky", top: "calc(var(--nav-height) + 24px)" }}>
            {STEPS.map((s, i) => (
              <button key={s.number} onClick={() => setActiveStep(i)} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "16px 20px",
                background: activeStep === i ? "var(--bg-card)" : "transparent",
                border: activeStep === i ? `1px solid ${s.color}` : "1px solid transparent",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all var(--transition)",
              }}>
                <span style={{
                  minWidth: 36, height: 36,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "50%",
                  background: activeStep === i ? s.color : "var(--bg-tertiary)",
                  color: activeStep === i ? "#fff" : "var(--text-muted)",
                  fontWeight: 700, fontSize: "0.8rem",
                  transition: "all var(--transition)",
                }}>
                  {i + 1}
                </span>
                <span style={{
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: activeStep === i ? "var(--text-primary)" : "var(--text-secondary)",
                  transition: "color var(--transition)",
                }}>
                  {s.title}
                </span>
              </button>
            ))}
          </div>

          {/* Step content */}
          <div key={activeStep} style={{ animation: "fadeInUp 0.35s ease" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 16, marginBottom: 20,
            }}>
              <span style={{
                width: 52, height: 52,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "50%",
                background: `color-mix(in srgb, ${step.color} 15%, transparent)`,
                border: `2px solid ${step.color}`,
                fontWeight: 800, fontSize: "1.1rem",
                color: step.color,
              }}>
                {step.number}
              </span>
              <div>
                <h3 style={{ color: "var(--text-primary)", marginBottom: 4 }}>{step.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                  {step.description}
                </p>
              </div>
            </div>

            <CodeBlock code={step.code} lang={step.lang} />

            {/* Navigation */}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {activeStep > 0 && (
                <button onClick={() => setActiveStep((s) => s - 1)} className="btn btn-secondary">
                  ← Previous
                </button>
              )}
              {activeStep < STEPS.length - 1 && (
                <button onClick={() => setActiveStep((s) => s + 1)} className="btn btn-primary"
                  style={{ background: step.color }}>
                  Next step →
                </button>
              )}
              {activeStep === STEPS.length - 1 && (
                <span style={{
                  display: "flex", alignItems: "center", gap: 8,
                  color: "var(--accent-green)", fontWeight: 600, fontSize: "0.9rem",
                }}>
                  🎉 You're all set!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #getting-started .container > div {
            grid-template-columns: 1fr !important;
          }
          #getting-started .container > div > div:first-child {
            position: static !important;
            flex-direction: row !important;
            overflow-x: auto;
            padding-bottom: 8px;
          }
        }
      `}</style>
    </section>
  );
}
