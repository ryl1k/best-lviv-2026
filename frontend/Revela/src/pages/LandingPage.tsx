import { LandingCapabilities } from '@/components/landing/LandingCapabilities';
import { LandingCTA } from '@/components/landing/LandingCTA';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';
import { LandingInterfacePreview } from '@/components/landing/LandingInterfacePreview';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingProof } from '@/components/landing/LandingProof';

export default function LandingPage() {
  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden bg-landing-paper text-landing-ink">
      <LandingNav />
      <LandingHero />
      <LandingHowItWorks />
      <LandingCapabilities />
      <LandingProof />
      <LandingInterfacePreview />
      <LandingCTA />
    </main>
  );
}
