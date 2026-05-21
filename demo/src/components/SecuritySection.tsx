const PILLARS = [
  {
    icon: "🔒",
    title: "age encryption",
    color: "var(--accent-green)",
    points: [
      "X25519 + ChaCha20-Poly1305 AEAD",
      "Authenticated — tampering is detectable",
      "Binary output — not base64 / not text-readable",
      "Same format as the Go age CLI",
    ],
  },
  {
    icon: "🔑",
    title: "Key management",
    color: "var(--accent-blue)",
    points: [
      "Private key stored at mode 0600 (owner-only)",
      "Public key safe to share — used for encryption only",
      "Passphrase-based encryption also supported",
      "Keys never logged or written to stdout",
    ],
  },
  {
    icon: "🛡️",
    title: "Secret hygiene",
    color: "var(--accent-purple)",
    points: [
      "Decrypted values are never logged",
      "Plaintext .env files never written unless explicitly requested",
      "Production decryption requires manual confirmation",
      "Git-staged plaintext files trigger an error",
    ],
  },
  {
    icon: "📦",
    title: "Supply chain",
    color: "var(--accent-orange)",
    points: [
      "age-encryption: pure TypeScript, no native binaries",
      "Depends only on @noble/cryptography libraries",
      "Uses Web Crypto API when available (Node 20+)",
      "Zero C++ addons or platform-specific code",
    ],
  },
];

function AgeFlowDiagram() {
  return (
    <div style={{
      background: "var(--terminal-bg)",
      border: "1px solid var(--terminal-border)",
      borderRadius: "var(--radius-lg)",
      padding: "28px 32px",
      fontFamily: "JetBrains Mono, monospace",
      fontSize: "0.82rem",
    }}>
      <div style={{ color: "var(--text-muted)", marginBottom: 20, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        How age encryption works
      </div>

      {/* Encryption flow */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "var(--accent-green)", fontWeight: 600, marginBottom: 12 }}>📤 Encrypting</div>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          {[
            { label: ".env.dev", bg: "var(--accent-yellow)", color: "#000" },
            { label: "＋ key.pub (age1…)", bg: "transparent", color: "var(--text-secondary)", border: true },
            { label: "→", bg: "transparent", color: "var(--text-muted)", border: false },
            { label: "age Encrypter", bg: "var(--bg-hover)", color: "var(--text-primary)", border: true },
            { label: "→", bg: "transparent", color: "var(--text-muted)", border: false },
            { label: ".env.dev.age", bg: "var(--accent-green)", color: "#fff" },
          ].map((item, i) => (
            <span key={i} style={{
              padding: item.bg !== "transparent" ? "4px 10px" : "4px 2px",
              background: item.bg,
              color: item.color,
              borderRadius: 4,
              border: item.border ? "1px solid var(--border)" : "none",
              whiteSpace: "nowrap",
              fontSize: "0.78rem",
            }}>
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Decryption flow */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "var(--accent-blue)", fontWeight: 600, marginBottom: 12 }}>📥 Decrypting</div>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          {[
            { label: ".env.dev.age", bg: "var(--accent-green)", color: "#fff" },
            { label: "＋ key.txt (AGE-SECRET-KEY-1…)", bg: "transparent", color: "var(--text-secondary)", border: true },
            { label: "→", bg: "transparent", color: "var(--text-muted)", border: false },
            { label: "age Decrypter", bg: "var(--bg-hover)", color: "var(--text-primary)", border: true },
            { label: "→", bg: "transparent", color: "var(--text-muted)", border: false },
            { label: ".env.dev", bg: "var(--accent-yellow)", color: "#000" },
          ].map((item, i) => (
            <span key={i} style={{
              padding: item.bg !== "transparent" ? "4px 10px" : "4px 2px",
              background: item.bg,
              color: item.color,
              borderRadius: 4,
              border: item.border ? "1px solid var(--border)" : "none",
              whiteSpace: "nowrap",
              fontSize: "0.78rem",
            }}>
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Passphrase flow */}
      <div>
        <div style={{ color: "var(--accent-purple)", fontWeight: 600, marginBottom: 12 }}>🔤 Passphrase mode (scrypt KDF)</div>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.7 }}>
          When you use <code style={{ color: "var(--accent-orange)" }}>--passphrase</code>, the passphrase is run through{" "}
          <strong>scrypt</strong> (memory-hard KDF) to derive an ephemeral key. The work factor is{" "}
          configurable — higher work factor = slower brute force.
        </div>
      </div>
    </div>
  );
}

export default function SecuritySection() {
  return (
    <section id="security" className="section">
      <div className="container">
        <p className="section-label">Security</p>
        <h2 className="section-title">Built on proven cryptography</h2>
        <p className="section-subtitle" style={{ marginBottom: 56 }}>
          envage delegates all cryptography to{" "}
          <a href="https://age-encryption.org" target="_blank" rel="noopener noreferrer">age</a>{" "}
          — a modern file encryption format designed by{" "}
          <a href="https://filippo.io" target="_blank" rel="noopener noreferrer">Filippo Valsorda</a>{" "}
          (former Go security team lead). No custom crypto.
        </p>

        {/* Security pillars */}
        <div className="grid-2" style={{ marginBottom: 48 }}>
          {PILLARS.map((p) => (
            <div key={p.title} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{
                  width: 44, height: 44,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "var(--radius-sm)",
                  background: `color-mix(in srgb, ${p.color} 12%, transparent)`,
                  fontSize: "1.3rem",
                }}>
                  {p.icon}
                </span>
                <h3 style={{ color: p.color }}>{p.title}</h3>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {p.points.map((pt) => (
                  <li key={pt} style={{ display: "flex", gap: 8, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    <span style={{ color: p.color, marginTop: 2 }}>›</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <AgeFlowDiagram />

        {/* Warning box */}
        <div style={{
          marginTop: 32,
          padding: "20px 24px",
          background: "color-mix(in srgb, var(--accent-yellow) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--accent-yellow) 30%, transparent)",
          borderRadius: "var(--radius-md)",
          display: "flex", gap: 14, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: "1.2rem" }}>⚠️</span>
          <div>
            <strong style={{ color: "var(--accent-yellow)", display: "block", marginBottom: 6 }}>
              Security responsibility boundary
            </strong>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
              envage protects secrets <em>at rest</em> in your repository. The private key
              (<code>.age/key.txt</code>) must be distributed to developers out-of-band — via a
              password manager, secret vault (1Password, HashiCorp Vault, AWS SSM, etc.), or
              secure file share. Never commit or email the private key.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
