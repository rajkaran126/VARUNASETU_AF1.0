"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Challenge", href: "#challenge" },
  { label: "Approach", href: "#approach" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Architecture", href: "#architecture" },
  { label: "Agents", href: "#agents" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-nav shadow-2xl py-3" : "bg-transparent py-4"
      }`}
    >
      <div className="container-max section-px">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/20 transition-all duration-300 group-hover:border-white/50 group-hover:bg-white/20 backdrop-blur-md overflow-hidden p-1 shadow-sm">
              <Image
                src="/icon.png"
                alt="VARUNASETU Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-md"
                priority
              />
            </div>
            <span className="font-display font-bold text-white text-lg tracking-tight">
              VARUNASETU
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 glass-pill px-5 py-2 rounded-full border border-white/15">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-body text-[11px] uppercase tracking-widest text-white/70 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Pure White Action Button */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link
              href="/workspace"
              className="btn-pure-white font-body text-xs uppercase tracking-widest px-5 py-2.5 rounded-full font-bold"
            >
              Enter Workspace
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white p-2 rounded-lg bg-white/5 border border-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="glass-nav border-t border-white/10 px-6 py-5 space-y-3 mt-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block font-body text-xs uppercase tracking-widest text-white/80 hover:text-white py-1"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-white/10">
            <Link
              href="/workspace"
              onClick={() => setMenuOpen(false)}
              className="btn-pure-white block w-full text-center font-body text-xs uppercase tracking-widest py-3 rounded-full font-bold"
            >
              Enter Workspace
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
