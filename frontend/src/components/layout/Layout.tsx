import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="landing-page relative min-h-screen flex flex-col overflow-x-hidden bg-landing-paper text-landing-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-landing-ink focus:px-4 focus:py-2 focus:text-sm focus:text-landing-paper"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1 w-full pt-16">{children}</main>
      <Footer />
    </div>
  );
}
