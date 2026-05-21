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
  return (
    <ThemeProvider>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1 }}>
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
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
