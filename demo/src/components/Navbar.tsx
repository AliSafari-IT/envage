import { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext.tsx";

declare const __APP_VERSION__: string;

const NAV_LINKS = [
  { label: "Get Started", href: "#getting-started" },
  { label: "CLI", href: "#cli-demo" },
  { label: "API", href: "#api-demo" },
  { label: "Security", href: "#security" },
  { label: "GitHub", href: "https://github.com/asafarim/envage", external: true },
];

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: "var(--nav-height)",
      background: scrolled
        ? "color-mix(in srgb, var(--bg-primary) 90%, transparent)"
        : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid var(--border-subtle)" : "none",
      transition: "all 0.3s ease",
    }}>
      <div className="container" style={{
        height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <span style={{ fontSize: "1.5rem" }}>🔐</span>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            env<span style={{ color: "var(--accent-green)" }}>age</span>
          </span>
          <span className="badge badge-green" style={{ fontSize: "0.65rem" }}>v{__APP_VERSION__}</span>
        </a>

        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="desktop-nav">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: "all var(--transition)",
                textDecoration: "none",
                display: "flex", alignItems: "center", gap: 4,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {link.label}
              {link.external && <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>↗</span>}
            </a>
          ))}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            style={{
              width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg-tertiary)",
              cursor: "pointer",
              fontSize: "1rem",
              transition: "all var(--transition)",
              marginLeft: 4,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-green)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-tertiary)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="mobile-menu-btn"
          style={{
            display: "none",
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 10px",
            cursor: "pointer",
            color: "var(--text-primary)",
            fontSize: "1rem",
          }}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: "absolute", top: "var(--nav-height)", left: 0, right: 0,
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          padding: "16px 24px",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{ padding: "10px 0", color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)" }}
            >
              {link.label}
            </a>
          ))}
          <button onClick={toggle} style={{
            marginTop: 8, padding: "10px 0", background: "none", border: "none",
            color: "var(--text-secondary)", cursor: "pointer", textAlign: "left",
          }}>
            {theme === "dark" ? "☀️ Switch to Light" : "🌙 Switch to Dark"}
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
