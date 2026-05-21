type FileNode = {
  name: string;
  type: "dir" | "file";
  note?: string;
  color?: string;
  children?: FileNode[];
};

const TREE: FileNode[] = [
  {
    name: "my-monorepo/", type: "dir", children: [
      {
        name: ".age/", type: "dir", children: [
          { name: "key.txt", type: "file", note: "private key — gitignored 🔒", color: "var(--accent-red)" },
          { name: "key.pub", type: "file", note: "public key — commit this ✅", color: "var(--accent-green)" },
        ]
      },
      {
        name: "apps/", type: "dir", children: [
          {
            name: "web/", type: "dir", children: [
              { name: ".env.dev", type: "file", note: "decrypted — gitignored", color: "var(--accent-yellow)" },
              { name: ".env.dev.age", type: "file", note: "encrypted — commit this ✅", color: "var(--accent-green)" },
              { name: ".env.prod.age", type: "file", note: "encrypted — commit this ✅", color: "var(--accent-green)" },
            ]
          },
          {
            name: "admin/", type: "dir", children: [
              { name: ".env.dev.age", type: "file", color: "var(--accent-green)" },
              { name: ".env.prod.age", type: "file", color: "var(--accent-green)" },
            ]
          },
        ]
      },
      {
        name: "packages/", type: "dir", children: [
          {
            name: "api/", type: "dir", children: [
              { name: ".env.dev.age", type: "file", color: "var(--accent-green)" },
              { name: ".env.prod.age", type: "file", color: "var(--accent-green)" },
            ]
          },
        ]
      },
      { name: "envage.config.json", type: "file", note: "config — commit this ✅", color: "var(--accent-blue)" },
      { name: ".gitignore", type: "file", note: "auto-updated by envage", color: "var(--text-muted)" },
    ]
  }
];

function TreeNode({ node, depth = 0, last = true }: { node: FileNode; depth?: number; last?: boolean }) {
  const indent = depth * 20;
  const isDir = node.type === "dir";

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 8,
        paddingLeft: indent,
        padding: `3px 8px 3px ${indent + 8}px`,
        borderRadius: 4,
        transition: "background 0.15s",
        cursor: "default",
      }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.82rem" }}>
          {depth > 0 && (
            <span style={{ color: "var(--border)", marginRight: 4 }}>
              {last ? "└─ " : "├─ "}
            </span>
          )}
          <span style={{ color: isDir ? "var(--accent-blue)" : (node.color || "var(--text-primary)") }}>
            {isDir ? "📁 " : "📄 "}
            {node.name}
          </span>
        </span>
        {node.note && (
          <span style={{
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            fontStyle: "italic",
            marginLeft: 8,
          }}>
            {node.note}
          </span>
        )}
      </div>
      {node.children?.map((child, i) => (
        <TreeNode
          key={child.name}
          node={child}
          depth={depth + 1}
          last={i === (node.children?.length ?? 0) - 1}
        />
      ))}
    </div>
  );
}

const RULES = [
  { icon: "✅", text: "Encrypted .age files", sub: "Safe to commit — binary, unreadable without the key" },
  { icon: "🔒", text: "Private key (key.txt)", sub: "Never committed — auto-gitignored on init-key" },
  { icon: "✅", text: "Public key (key.pub)", sub: "Share with teammates for encrypting" },
  { icon: "🔒", text: "Plaintext .env files", sub: "Never committed — always gitignored" },
  { icon: "✅", text: "envage.config.json", sub: "Lists app folders and envs — safe to commit" },
];

export default function MonorepoStructure() {
  return (
    <section className="section" style={{ background: "var(--bg-secondary)" }}>
      <div className="container">
        <p className="section-label">Structure</p>
        <h2 className="section-title">How your monorepo looks</h2>
        <p className="section-subtitle" style={{ marginBottom: 56 }}>
          envage follows a predictable convention. Encrypted files live alongside
          your source code. Secrets never leave your machine unless you choose.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
          {/* File tree */}
          <div style={{
            background: "var(--terminal-bg)",
            border: "1px solid var(--terminal-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 16px",
              background: "var(--bg-tertiary)",
              borderBottom: "1px solid var(--border)",
            }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", display: "inline-block" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", display: "inline-block" }} />
              <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                Explorer
              </span>
            </div>
            <div style={{ padding: "12px 8px" }}>
              {TREE.map((node) => (
                <TreeNode key={node.name} node={node} depth={0} />
              ))}
            </div>
          </div>

          {/* Rules */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ marginBottom: 8, color: "var(--text-primary)" }}>What goes into Git?</h3>
            {RULES.map((rule) => (
              <div key={rule.text} style={{
                display: "flex", gap: 16, alignItems: "flex-start",
                padding: "16px 20px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
              }}>
                <span style={{ fontSize: "1.3rem", lineHeight: 1.2 }}>{rule.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 4 }}>{rule.text}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{rule.sub}</div>
                </div>
              </div>
            ))}

            {/* Gitignore snippet */}
            <div style={{
              background: "var(--terminal-bg)",
              border: "1px solid var(--terminal-border)",
              borderRadius: "var(--radius-md)",
              padding: "16px 20px",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.8rem",
              lineHeight: 1.8,
              marginTop: 8,
            }}>
              <div style={{ color: "var(--terminal-comment)", marginBottom: 8 }}>
                # Auto-added to .gitignore by envage:
              </div>
              <div><span style={{ color: "var(--accent-orange)" }}>.env*</span></div>
              <div><span style={{ color: "var(--accent-green)" }}>!.env*.age</span>
                <span style={{ color: "var(--terminal-comment)" }}> # keep encrypted</span>
              </div>
              <div><span style={{ color: "var(--accent-green)" }}>!.env.example</span></div>
              <div><span style={{ color: "var(--accent-orange)" }}>.age/key.txt</span>
                <span style={{ color: "var(--terminal-comment)" }}> # never commit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #structure-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
