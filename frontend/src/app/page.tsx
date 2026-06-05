import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/marketing/HeroSection'
import { HowItWorksSection } from '@/components/marketing/HowItWorksSection'
import { FeaturesSection } from '@/components/marketing/FeaturesSection'
import { TrustSection } from '@/components/marketing/TrustSection'
import { PricingSection } from '@/components/marketing/PricingSection'
import { CTASection } from '@/components/marketing/CTASection'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <TrustSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
