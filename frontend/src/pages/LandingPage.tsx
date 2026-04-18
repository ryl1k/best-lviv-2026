import { LandingHero } from '@/components/landing/LandingHero';
import { LandingStats } from '@/components/landing/LandingStats';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function LandingPage() {
  return (
    <main className="landing-page relative min-h-screen flex flex-col overflow-x-hidden bg-landing-paper text-landing-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-landing-ink focus:px-4 focus:py-2 focus:text-sm focus:text-landing-paper"
      >
        Skip to content
      </a>
      <Navbar />
      <div id="main-content" />
      <LandingHero />
      <LandingStats />
      <div className="flex-1" />
      <Footer />
    </main>
  );
}
