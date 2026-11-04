import { useEffect, useState } from "react";
import Roadmap from "./components/Roadmap.tsx";
import { ThemeProvider } from "./components/ThemeContext.tsx";
import Navbar from "./components/Navbar.tsx";
import Hero from "./components/Hero.tsx";
import GettingStarted from "./components/GettingStarted.tsx";
import MonorepoStructure from "./components/MonorepoStructure.tsx";
import TerminalDemo from "./components/TerminalDemo.tsx";
import ApiDemo from "./components/ApiDemo.tsx";
import SecuritySection from "./components/SecuritySection.tsx";
import GitIntegration from "./components/GitIntegration.tsx";
import Footer from "./components/Footer.tsx";

export default function App() {
  const [roadmap, setRoadmap] = useState(window.location.hash === "#roadmap");
  useEffect(() => {
    const update = () => {
      const active = window.location.hash === "#roadmap";
      setRoadmap(active);
      if (!active) requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView());
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    if (roadmap) window.scrollTo({ top: 0, behavior: "instant" });
  }, [roadmap]);
  return (
    <ThemeProvider>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          {roadmap ? <Roadmap /> : <>
          <Hero />
          <div className="divider" />
          <GettingStarted />
          <div className="divider" />
          <TerminalDemo />
          <div className="divider" />
          <MonorepoStructure />
          <div className="divider" />
          <ApiDemo />
          <div className="divider" />
          <SecuritySection />
          <div className="divider" />
          <GitIntegration />
          </>}
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
