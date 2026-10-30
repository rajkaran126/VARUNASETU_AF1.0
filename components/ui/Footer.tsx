import Link from "next/link";

const footerLinks = {
  Platform: [
    { label: "Global Cable Explorer", href: "#capabilities" },
    { label: "Underwater Digital Twin", href: "#capabilities" },
    { label: "Network Simulation", href: "#capabilities" },
    { label: "Recovery War Room", href: "#capabilities" },
  ],
  Intelligence: [
    { label: "Chief Orchestrator", href: "#agents" },
    { label: "Network Analyst", href: "#agents" },
    { label: "Risk & Scenario Agent", href: "#agents" },
    { label: "Logistics Agent", href: "#agents" },
  ],
  Resources: [
    { label: "Architecture", href: "#architecture" },
    { label: "How It Works", href: "#approach" },
    { label: "Ghost Simulation", href: "#ghost-simulation" },
    { label: "Enter Workspace", href: "/workspace" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 mt-10 bg-black/40 backdrop-blur-2xl text-white">
      <div className="container-max section-px py-12 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/20">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M2 10 Q5 5, 10 7.5 Q15 10, 18 5"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M2 13 Q5 8, 10 10.5 Q15 13, 18 8"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.5"
                  />
                  <circle cx="10" cy="8.75" r="1.8" fill="#ffffff" />
                </svg>
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-white">
                VARUNASETU
              </span>
            </div>

            <p className="font-body text-white/60 text-xs leading-relaxed max-w-sm">
              An AI-powered digital twin for global submarine cable infrastructure.
              Simulate disruptions, analyze network resilience, and engineer
              intelligent recovery strategies.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="font-mono text-[10px] text-white/70 uppercase tracking-widest">
                SOVEREIGN SUBSEA RESILIENCE
              </span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-3">
              <h4 className="font-display font-semibold text-[11px] text-white/90 uppercase tracking-[0.2em]">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-body text-xs text-white/50 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-divider" />

      {/* Bottom Bar */}
      <div className="container-max section-px py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <p className="font-body text-white/40 text-center md:text-left text-[11px]">
            © 2026 VARUNASETU. AI-Powered Submarine Cable Digital Twin for
            Network Resilience, Failure Simulation &amp; Intelligent Recovery.
          </p>
          <span className="font-mono text-[10px] text-white/30 tracking-widest uppercase">
            VARUNASETU · v1.0.0
          </span>
        </div>
      </div>
    </footer>
  );
}
