import { LandingNav } from '../components/landing/LandingNav';
import { LandingHero } from '../components/landing/LandingHero';
import { ProductShowcase } from '../components/landing/ProductShowcase';
import { FeatureBento } from '../components/landing/FeatureBento';
import { TelegramSection } from '../components/landing/TelegramSection';
import { ImportAnalyticsSection } from '../components/landing/ImportAnalyticsSection';
import { BudgetCurrencySection } from '../components/landing/BudgetCurrencySection';
import { DataControlSection } from '../components/landing/DataControlSection';
import { LandingCTA } from '../components/landing/LandingCTA';
import { LandingFooter } from '../components/landing/LandingFooter';
import { useScrollReveal } from '../components/landing/useScrollReveal';

export function LandingPage() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-canvas text-primary selection:bg-accent/20 selection:text-accent font-sans antialiased">
      {/* Top Sticky Navigation */}
      <LandingNav />

      {/* Main Landing Content Flow */}
      <main>
        {/* 1. Hero Section */}
        <LandingHero />

        {/* 2. Cockpit Live Product Showcase */}
        <ProductShowcase />

        {/* 3. Core Features Bento */}
        <FeatureBento />

        {/* 4. Telegram Bot Quick Entry */}
        <TelegramSection />

        {/* 5. Bank Statement Reconciler */}
        <ImportAnalyticsSection />

        {/* 6. Multi-Currency Wallets */}
        <BudgetCurrencySection />

        {/* 7. Data Privacy & Sovereignty */}
        <DataControlSection />

        {/* 8. Conversion Call to Action */}
        <LandingCTA />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
