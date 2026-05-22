export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      background: "var(--bg-secondary)",
      padding: "48px 0 32px",
    }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40, marginBottom: 40 }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: "1.3rem" }}>🔐</span>
              <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                env<span style={{ color: "var(--accent-green)" }}>age</span>
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 240 }}>
              Secure, age-based .env encryption for monorepos. Simple CLI + programmatic API.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <span className="badge badge-green">MIT</span>
              <span className="badge badge-blue">v0.1.0</span>
              <span className="badge badge-purple">TypeScript</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 16 }}>
              Resources
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "GitHub Repository", href: "https://github.com/AliSafari-IT/envage" },
                { label: "npm Package", href: "https://www.npmjs.com/package/@asafarim/envage" },
                { label: "age Encryption Spec", href: "https://age-encryption.org" },
                { label: "age-encryption (npm)", href: "https://www.npmjs.com/package/age-encryption" },
              ].map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}
                >
                  {l.label} <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>↗</span>
                </a>
              ))}
            </div>
          </div>

          {/* Comparison */}
          <div>
            <h4 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 16 }}>
              vs. alternatives
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "vs dotenv-vault", note: "No cloud account needed" },
                { label: "vs git-crypt", note: "Easier key distribution" },
                { label: "vs SOPS", note: "Simpler setup, TypeScript-first" },
                { label: "vs Vault/SSM", note: "Works offline & in local dev" },
              ].map((c) => (
                <div key={c.label} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", minWidth: 120 }}>{c.label}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-green)" }}>› {c.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: 24,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 16,
        }}>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            © {year} <a href="https://github.com/asafarim" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>Ali Safarim</a>.
            {" "}MIT License. Built with ❤️ for the open-source community.
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Powered by{" "}
              <a href="https://age-encryption.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)" }}>
                age
              </a>
              {" "}+{" "}
              <a href="https://www.npmjs.com/package/commander" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)" }}>
                commander
              </a>
              {" "}+{" "}
              <a href="https://chalk.js.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)" }}>
                chalk
              </a>
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          footer .container > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
