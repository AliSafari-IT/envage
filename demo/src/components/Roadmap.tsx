const items = [
  { issue: 3, title: "Multi-recipient encryption", status: "Released", description: "Independent team identities, public recipient configuration, and safe re-encryption when membership changes.", commands: ["envage recipient add <public-key>", "envage recipient list", "envage recipient remove <public-key>"] },
  { issue: 4, title: "Key rotation & recovery", status: "Planned", description: "Verify identities, preview rotation, and recover safely from compromised encryption keys.", commands: ["Rotation dry-run", "Identity verification", "Recovery guidance"] },
  { issue: 5, title: "Secret auditing", status: "Planned", description: "Find staged plaintext, exposed private keys, and unsafe configuration with redacted findings.", commands: ["Staged-file checks", "Machine-readable reports", "CI exit codes"] },
  { issue: 6, title: "Secure CI & exec", status: "Planned", description: "Explicitly authorized automation and child-process secret injection with local safeguards preserved.", commands: ["Noninteractive decryption", "Secret injection", "GitHub Actions examples"] },
  { issue: 7, title: "Validation & drift detection", status: "Planned", description: "Check required variables and compare environment structure without revealing secret values.", commands: ["Environment schemas", "Key-presence comparison", "Monorepo validation"] },
];

export default function Roadmap() {
  return <section className="section" id="roadmap" aria-labelledby="roadmap-title">
    <div className="container">
      <span className="section-label">What’s next</span>
      <h1 className="section-title" id="roadmap-title">Envage Roadmap</h1>
      <p className="section-subtitle">v0.5.0 — Secure Secrets Lifecycle. Team collaboration, recovery, auditing, automation, and validation, delivered incrementally.</p>
      <p style={{ marginBottom: 32 }}><a href="https://github.com/AliSafari-IT/envage/milestone/1" target="_blank" rel="noopener noreferrer">Follow the milestone on GitHub ↗</a></p>
      <div className="roadmap-grid">
        {items.map(item => <article className="card" key={item.issue} style={{ padding: 28 }}>
          <span className={`badge ${item.status === "Released" ? "badge-green" : "badge-blue"}`}>{item.status}</span>
          <h2 style={{ fontSize: "1.25rem", margin: "18px 0 12px" }}>{item.title}</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>{item.description}</p>
          <ul style={{ paddingLeft: 20, color: "var(--text-secondary)", marginBottom: 24 }}>{item.commands.map(command => <li key={command}>{command}</li>)}</ul>
          <a href={`https://github.com/AliSafari-IT/envage/issues/${item.issue}`} target="_blank" rel="noopener noreferrer">Issue #{item.issue} ↗</a>
        </article>)}
      </div>
      <p style={{ marginTop: 28, color: "var(--text-muted)" }}>Planned features are proposals; scope and timing may change. GitHub tracks the latest progress.</p>
    </div>
  </section>;
}
