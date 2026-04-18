import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';

import { landingHero, landingNavLinks } from '@/data/landing';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'border-b border-landing-border backdrop-blur-xl' : 'border-b border-transparent'
      }`}
      style={{
        backgroundColor: scrolled ? 'oklch(0.985 0.005 80 / 80%)' : 'transparent',
      }}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:px-10">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="landing-signal-dot" />
          <span className="font-landing-display text-2xl leading-none text-landing-ink">{landingHero.brand}</span>
          <span className="ml-1 hidden font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted sm:inline">
            {landingHero.subtitle}
          </span>
        </a>

        <nav className="hidden items-center gap-9 md:flex">
          {landingNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="landing-link-underline text-sm font-medium text-landing-ink-soft transition-colors hover:text-landing-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link
          to="/login"
          className="group inline-flex items-center gap-2 rounded-full bg-landing-ink px-4 py-2 text-sm font-medium text-landing-paper transition-all hover:opacity-90"
        >
          Request access
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </motion.header>
  );
}
