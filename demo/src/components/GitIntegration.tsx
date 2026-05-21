function CodeSnippet({ title, lang, code }: { title: string; lang: string; code: string }) {
  return (
    <div style={{
      background: "var(--terminal-bg)",
      border: "1px solid var(--terminal-border)",
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "8px 16px",
        background: "var(--bg-tertiary)",
        borderBottom: "1px solid var(--border)",
        display: "flex", gap: 8, alignItems: "center",
      }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{lang}</span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>—</span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{title}</span>
      </div>
      <pre style={{
        padding: "16px 20px", margin: 0,
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "0.8rem", lineHeight: 1.75,
        color: "var(--terminal-text)",
        overflowX: "auto",
      }}>
        {code}
      </pre>
    </div>
  );
}

const WORKFLOW_STEPS = [
  {
    icon: "📝",
    title: "Create your .env file",
    desc: "Write your environment variables normally. The file stays local — gitignored immediately.",
    code: "apps/web/.env.dev",
    color: "var(--accent-yellow)",
  },
  {
    icon: "🔐",
    title: "Encrypt it",
    desc: "Run encrypt to produce the .age file. This is the file you'll commit.",
    code: "npx envage encrypt apps/web --env dev",
    color: "var(--accent-green)",
  },
  {
    icon: "📤",
    title: "Commit the .age file",
    desc: "Only the encrypted file goes into Git. Your teammates can decrypt it with their copy of the key.",
    code: "git add apps/web/.env.dev.age && git commit",
    color: "var(--accent-blue)",
  },
  {
    icon: "🔓",
    title: "Teammates decrypt",
    desc: "After cloning, teammates decrypt to get the plaintext back. No secrets are shared via Git.",
    code: "npx envage decrypt --all --env dev",
    color: "var(--accent-purple)",
  },
];

export default function GitIntegration() {
  return (
    <section className="section" style={{ background: "var(--bg-secondary)" }}>
      <div className="container">
        <p className="section-label">Git Integration</p>
        <h2 className="section-title">A workflow that fits Git</h2>
        <p className="section-subtitle" style={{ marginBottom: 56 }}>
          envage slots into your existing Git workflow. Encrypted files are committed;
          plaintext files never leave the machine they were decrypted on.
        </p>

        {/* Workflow steps */}
        <div style={{ position: "relative", marginBottom: 64 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={step.title} style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "24px 20px",
                position: "relative",
              }}>
                <div style={{
                  width: 32, height: 32,
                  background: `color-mix(in srgb, ${step.color} 15%, transparent)`,
                  border: `1px solid ${step.color}`,
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 700, color: step.color,
                  marginBottom: 16,
                }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: "1.3rem", marginBottom: 10 }}>{step.icon}</div>
                <h3 style={{ fontSize: "0.95rem", marginBottom: 8, color: "var(--text-primary)" }}>{step.title}</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
                  {step.desc}
                </p>
                <code style={{
                  display: "block",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "6px 10px",
                  fontSize: "0.72rem",
                  color: step.color,
                  wordBreak: "break-all",
                }}>
                  {step.code}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Code snippets side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
          <CodeSnippet
            title=".gitignore (auto-added)"
            lang="gitignore"
            code={`# --- envage managed ---
# Decrypted env files — never commit
.env*
!.env*.age
!.env.example
!.env.template
# Age private key
.age/key.txt
# --- end envage ---`}
          />
          <CodeSnippet
            title=".git/hooks/pre-commit (optional)"
            lang="bash"
            code={`#!/usr/bin/env bash
# Prevent committing decrypted env files
STAGED=$(git diff --cached --name-only)

for f in $STAGED; do
  base=$(basename "$f")
  if [[ "$base" == .env* && "$base" != *.age ]]; then
    echo "❌ Staged decrypted env file: $f"
    echo "   Run: npx envage encrypt --all"
    exit 1
  fi
done

exit 0`}
          />
        </div>

        {/* CI/CD tip */}
        <div style={{
          padding: "24px 28px",
          background: "color-mix(in srgb, var(--accent-blue) 6%, transparent)",
          border: "1px solid color-mix(in srgb, var(--accent-blue) 25%, transparent)",
          borderRadius: "var(--radius-md)",
          display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "start",
        }}>
          <span style={{ fontSize: "1.5rem" }}>🚀</span>
          <div>
            <strong style={{ color: "var(--accent-blue)", display: "block", marginBottom: 8 }}>
              CI/CD — decrypt in your pipeline
            </strong>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>
              In CI, inject the private key via a secret environment variable, write it to a temp file, then decrypt:
            </p>
            <pre style={{
              background: "var(--terminal-bg)",
              border: "1px solid var(--terminal-border)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 16px",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.78rem",
              lineHeight: 1.75,
              margin: 0,
              overflowX: "auto",
            }}>
{`# GitHub Actions example
- name: Decrypt env files
  run: |
    mkdir -p .age
    echo "$AGE_PRIVATE_KEY" > .age/key.txt
    npx envage decrypt --all --env prod
  env:
    AGE_PRIVATE_KEY: \${{ secrets.AGE_PRIVATE_KEY }}`}
            </pre>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          #git-snippets { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
