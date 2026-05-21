import { useState, useEffect, useRef } from "react";

type Line =
  | { type: "cmd";  text: string }
  | { type: "out";  text: string }
  | { type: "ok";   text: string }
  | { type: "warn"; text: string }
  | { type: "err";  text: string }
  | { type: "blank" };

type Demo = { label: string; icon: string; lines: Line[] };

const DEMOS: Demo[] = [
  {
    label: "init-key",
    icon: "🔑",
    lines: [
      { type: "cmd",  text: "npx envage init-key" },
      { type: "blank" },
      { type: "out",  text: "ℹ Generating age X25519 keypair in .age/" },
      { type: "ok",   text: "✔ Private key written to: .age/key.txt" },
      { type: "ok",   text: "✔ Public key written to:  .age/key.pub" },
      { type: "ok",   text: "✔ .gitignore updated." },
      { type: "blank" },
      { type: "warn", text: "⚠ IMPORTANT: Never commit your private key (.age/key.txt)." },
      { type: "warn", text: "⚠ Share .age/key.pub with teammates who need to encrypt files." },
      { type: "blank" },
      { type: "out",  text: "  To encrypt:  envage encrypt apps/web --env dev" },
      { type: "out",  text: "  To decrypt:  envage decrypt apps/web --env dev" },
    ],
  },
  {
    label: "encrypt",
    icon: "🔐",
    lines: [
      { type: "cmd",  text: "npx envage encrypt apps/web --env dev" },
      { type: "blank" },
      { type: "out",  text: "🔐 Encrypting apps/web/.env.dev → .env.dev.age" },
      { type: "ok",   text: "✔ Done" },
      { type: "blank" },
      { type: "cmd",  text: "npx envage encrypt --all --env prod" },
      { type: "blank" },
      { type: "out",  text: "🔐 Encrypting apps/web/.env.prod → .env.prod.age" },
      { type: "ok",   text: "✔ Done" },
      { type: "out",  text: "🔐 Encrypting apps/admin/.env.prod → .env.prod.age" },
      { type: "ok",   text: "✔ Done" },
      { type: "out",  text: "🔐 Encrypting packages/api/.env.prod → .env.prod.age" },
      { type: "ok",   text: "✔ Done" },
    ],
  },
  {
    label: "decrypt",
    icon: "🔓",
    lines: [
      { type: "cmd",  text: "npx envage decrypt apps/web --env dev" },
      { type: "blank" },
      { type: "out",  text: "🔓 Decrypting apps/web/.env.dev.age → .env.dev" },
      { type: "ok",   text: "✔ Done" },
      { type: "blank" },
      { type: "cmd",  text: "npx envage decrypt apps/web --env prod" },
      { type: "blank" },
      { type: "warn", text: "⚠ You are about to decrypt PRODUCTION environment files." },
      { type: "out",  text: "Are you sure you want to continue? [y/N] y" },
      { type: "blank" },
      { type: "out",  text: "🔓 Decrypting apps/web/.env.prod.age → .env.prod" },
      { type: "ok",   text: "✔ Done" },
    ],
  },
  {
    label: "root env",
    icon: "🌱",
    lines: [
      { type: "cmd",  text: "# Use \"root\" env to encrypt a plain .env file" },
      { type: "cmd",  text: "npx envage encrypt apps/portal --env root" },
      { type: "blank" },
      { type: "out",  text: "🔐 Encrypting apps/portal/.env → .env.age" },
      { type: "ok",   text: "✔ Done" },
      { type: "blank" },
      { type: "cmd",  text: "npx envage decrypt apps/portal --env root" },
      { type: "blank" },
      { type: "out",  text: "🔓 Decrypting apps/portal/.env.age → .env" },
      { type: "ok",   text: "✔ Done" },
      { type: "blank" },
      { type: "out",  text: "# envage.config.json:" },
      { type: "out",  text: "  \"envs\": [\"root\", \"staging\", \"prod\"]" },
    ],
  },
  {
    label: "status",
    icon: "📊",
    lines: [
      { type: "cmd",  text: "npx envage status" },
      { type: "blank" },
      { type: "out",  text: "apps/web" },
      { type: "ok",   text: "  dev        🔒 encrypted" },
      { type: "ok",   text: "  staging    🔒 encrypted" },
      { type: "ok",   text: "  prod       🔒 encrypted" },
      { type: "blank" },
      { type: "out",  text: "apps/admin" },
      { type: "ok",   text: "  dev        🔒 encrypted" },
      { type: "warn", text: "  prod       🔓 decrypted (not yet encrypted)" },
      { type: "blank" },
      { type: "out",  text: "packages/api" },
      { type: "ok",   text: "  dev        🔒 encrypted" },
      { type: "ok",   text: "  prod       🔒 encrypted" },
      { type: "blank" },
      { type: "out",  text: "9 entries — 8 encrypted  1 decrypted" },
    ],
  },
];

function lineColor(type: Line["type"]): string {
  switch (type) {
    case "cmd":  return "var(--terminal-text)";
    case "ok":   return "var(--accent-green)";
    case "warn": return "var(--accent-yellow)";
    case "err":  return "var(--accent-red)";
    case "out":  return "var(--text-secondary)";
    default:     return "transparent";
  }
}

function TerminalWindow({ demo, active }: { demo: Demo; active: boolean }) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) { setVisibleLines(0); return; }
    setVisibleLines(0);
    let i = 0;
    const step = () => {
      i++;
      setVisibleLines(i);
      if (i < demo.lines.length) {
        const delay = demo.lines[i]?.type === "blank" ? 100 : demo.lines[i]?.type === "cmd" ? 500 : 180;
        timerRef.current = setTimeout(step, delay);
      }
    };
    timerRef.current = setTimeout(step, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active, demo]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  return (
    <div style={{
      background: "var(--terminal-bg)",
      border: "1px solid var(--terminal-border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      boxShadow: "var(--shadow-lg)",
    }}>
      {/* Title bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
        background: "var(--bg-tertiary)",
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
          envage — {demo.label}
        </span>
      </div>

      {/* Terminal content */}
      <div ref={containerRef} style={{
        padding: "20px 24px",
        minHeight: 280,
        maxHeight: 320,
        overflowY: "auto",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "0.82rem",
        lineHeight: 1.75,
      }}>
        {demo.lines.slice(0, visibleLines).map((line, i) => (
          <div key={i} style={{ color: lineColor(line.type), minHeight: "1.75em" }}>
            {line.type === "blank" ? " " : (
              <>
                {line.type === "cmd" && (
                  <span style={{ color: "var(--terminal-prompt)", marginRight: 8 }}>$</span>
                )}
                {line.text}
                {/* Cursor on last line */}
                {i === visibleLines - 1 && visibleLines < demo.lines.length && (
                  <span style={{ animation: "blink 1s infinite", marginLeft: 2 }}>▊</span>
                )}
              </>
            )}
          </div>
        ))}
        {visibleLines >= demo.lines.length && (
          <div style={{ color: "var(--terminal-prompt)", marginTop: 4 }}>
            $ <span style={{ animation: "blink 1s infinite" }}>▊</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CliDemo() {
  const [activeDemo, setActiveDemo] = useState(0);

  return (
    <section id="cli-demo" className="section">
      <div className="container">
        <p className="section-label">CLI</p>
        <h2 className="section-title">See every command in action</h2>
        <p className="section-subtitle" style={{ marginBottom: 48 }}>
          Four commands cover the complete workflow — from key generation to
          day-to-day encrypt/decrypt operations.
        </p>

        {/* Tab bar */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24,
          borderBottom: "1px solid var(--border)", paddingBottom: 16,
        }}>
          {DEMOS.map((d, i) => (
            <button key={d.label} onClick={() => setActiveDemo(i)} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 18px",
              background: activeDemo === i ? "var(--bg-tertiary)" : "transparent",
              border: "1px solid",
              borderColor: activeDemo === i ? "var(--accent-green)" : "var(--border)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              color: activeDemo === i ? "var(--text-primary)" : "var(--text-secondary)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.85rem",
              fontWeight: activeDemo === i ? 600 : 400,
              transition: "all var(--transition)",
            }}>
              <span>{d.icon}</span>
              <span>envage {d.label}</span>
            </button>
          ))}
        </div>

        <TerminalWindow demo={DEMOS[activeDemo]} active={true} key={activeDemo} />

        {/* Quick ref below terminal */}
        <div style={{
          marginTop: 32,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "20px 24px",
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Quick flags
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {[
              { flag: "--env <name>",   desc: "Environment (dev, prod, …). Use \"root\" for plain .env" },
              { flag: "--key <path>",   desc: "Age key file path" },
              { flag: "--passphrase",   desc: "Use passphrase instead of key" },
              { flag: "--all",          desc: "Run on all apps in config" },
              { flag: "--output <dir>", desc: "Key output folder (init-key)" },
            ].map((f) => (
              <div key={f.flag} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <code style={{
                  background: "var(--bg-tertiary)", border: "1px solid var(--border)",
                  padding: "2px 8px", borderRadius: 4, fontSize: "0.78rem",
                  color: "var(--accent-orange)", whiteSpace: "nowrap",
                }}>
                  {f.flag}
                </code>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
