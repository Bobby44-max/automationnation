import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] pt-16 pb-8 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-xl font-bold tracking-tight">
                <span className="gradient-text">Automation</span>
                <span className="text-white">Nation</span>
              </span>
            </Link>
            <p className="text-[13px] text-[#5A6370] leading-relaxed max-w-xs">
              We build deterministic AI systems that run your business.
              Elite stack. Zero hallucinations.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[#5A6370] mb-4">
              Services
            </h4>
            <ul className="space-y-2.5">
              {[
                'AI Workflow Automation',
                'Custom SaaS Development',
                'Integration Engineering',
                'AI Consulting & Strategy',
              ].map((s) => (
                <li key={s}>
                  <a href="#services" className="text-[13px] text-[#8B939E] hover:text-white transition-colors">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[#5A6370] mb-4">
              Products
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/products/rain-check" className="text-[13px] text-[#8B939E] hover:text-white transition-colors">
                  Rain Check
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-[13px] text-[#8B939E] hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[#5A6370] mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Contact', href: '#contact' },
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-[13px] text-[#8B939E] hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/[0.04] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-[#3A424D]">
            &copy; {new Date().getFullYear()} AutomationNation. All rights reserved.
          </div>
          <div className="text-[11px] text-[#3A424D]">
            Built with the Elite Stack &mdash; Next.js + Convex + Claude Code
          </div>
        </div>
      </div>
    </footer>
  );
}
