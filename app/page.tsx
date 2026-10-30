import Navigation from "@/components/ui/Navigation";
import HeroSection from "@/components/landing/HeroSection";
import ChallengeSection from "@/components/landing/ChallengeSection";
import ApproachSection from "@/components/landing/ApproachSection";
import CapabilitiesSection from "@/components/landing/CapabilitiesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import GhostSimulationSection from "@/components/landing/GhostSimulationSection";
import AgentsSection from "@/components/landing/AgentsSection";
import TechSection from "@/components/landing/TechSection";
import Footer from "@/components/ui/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Navigation />
      <HeroSection />
      <ChallengeSection />
      <ApproachSection />
      <CapabilitiesSection />
      <HowItWorksSection />
      <GhostSimulationSection />
      <AgentsSection />
      <TechSection />
      <Footer />
    </main>
  );
}
