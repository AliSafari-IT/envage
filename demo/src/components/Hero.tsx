import { useState } from "react";

const FEATURES = [
  { icon: "🔐", text: "age encryption" },
  { icon: "🌍", text: "Multi-environment" },
  { icon: "📁", text: "Monorepo-native" },
  { icon: "🛡️", text: "Git-safe" },
  { icon: "⚡", text: "Zero native deps" },
];

export default function Hero() {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "calc(var(--nav-height) + 60px) 24px 80px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background gradient blobs */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(63,185,80,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(88,166,255,0.05) 0%, transparent 50%)",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto" }}>
        {/* Top badges */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 32 }}>
          <span className="badge badge-green">🔐 age encryption</span>
          <span className="badge badge-blue">📦 pnpm monorepo</span>
          <span className="badge badge-purple">🔷 TypeScript</span>
          <span className="badge badge-orange">⚡ Zero native deps</span>
        </div>

        {/* Headline */}
        <h1 style={{ marginBottom: 24, lineHeight: 1.1 }}>
          Commit encrypted{" "}
          <span style={{
            background: "linear-gradient(135deg, var(--accent-green), var(--accent-blue))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            .env files
          </span>
          <br />with confidence
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: "1.2rem",
          color: "var(--text-secondary)",
          marginBottom: 40,
          maxWidth: 560,
          margin: "0 auto 40px",
          lineHeight: 1.7,
        }}>
          <strong style={{ color: "var(--text-primary)" }}>envage</strong> encrypts your{" "}
          <code style={{ background: "var(--bg-tertiary)", padding: "2px 6px", borderRadius: 4, color: "var(--accent-orange)" }}>.env</code>{" "}
          files using the battle-tested{" "}
          <a href="https://age-encryption.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>age</a>{" "}
          format — safe to commit, simple to decrypt, perfect for monorepos.
        </p>

        {/* CTA buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 48 }}>
          <a href="#getting-started" className="btn btn-primary" style={{ fontSize: "1rem", padding: "12px 24px" }}>
            Get Started →
          </a>
          <a href="#cli-demo" className="btn btn-secondary" style={{ fontSize: "1rem", padding: "12px 24px" }}>
            See it in action
          </a>
        </div>

        {/* Install command */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 56 }}>
          <button
            onClick={() => copy("pnpm add -D @asafarim/envage")}
            className="code-pill"
            title="Click to copy"
            style={{ fontSize: "0.95rem", padding: "10px 18px", gap: 10 }}
          >
            <span style={{ color: "var(--accent-purple)" }}>$</span>
            <span>pnpm add -D @asafarim/envage</span>
            <span style={{ marginLeft: 4, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {copied ? "✔ copied!" : "⎘"}
            </span>
          </button>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          {FEATURES.map((f) => (
            <div key={f.text} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 100,
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
            }}>
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        color: "var(--text-muted)", fontSize: "0.75rem",
        animation: "fadeIn 1s ease 1s both",
      }}>
        <span>scroll</span>
        <span style={{ animation: "blink 2s infinite" }}>↓</span>
      </div>
    </section>
  );
}
