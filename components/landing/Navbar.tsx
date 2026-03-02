'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Products', href: '#products' },
  { label: 'How We Work', href: '#process' },
  { label: 'Contact', href: '#contact' },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0A0D10]/80 backdrop-blur-xl border-b border-white/[0.04]'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2" aria-label="AutomationNation home">
          <span className="text-xl font-bold tracking-tight">
            <span className="gradient-text">Automation</span>
            <span className="text-white">Nation</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] text-[#5A6370] hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/products/rain-check"
            className="text-[13px] text-[#5A6370] hover:text-white transition-colors"
          >
            Rain Check
          </Link>
          <a
            href="#contact"
            className="gradient-btn text-white text-[13px] font-medium px-4 py-2 rounded flex items-center gap-1.5"
          >
            Get Started
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 -mr-2 text-[#5A6370] hover:text-white"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/[0.04] bg-[#0A0D10]/95 backdrop-blur-xl px-6 pb-6 pt-4">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 text-[#5A6370] hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/products/rain-check"
            onClick={() => setMenuOpen(false)}
            className="block py-2.5 text-[#5A6370] hover:text-white transition-colors"
          >
            Rain Check
          </Link>
          <div className="mt-4 pt-4 border-t border-white/[0.04]">
            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="block text-center gradient-btn text-white font-medium py-2.5 rounded"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
