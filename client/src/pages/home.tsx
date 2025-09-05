import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import ProblemSolution from "@/components/problem-solution";
import HowItWorks from "@/components/how-it-works";
import DashboardShowcase from "@/components/dashboard-showcase";
import DisputeResolution from "@/components/dispute-resolution";
import BenefitsSection from "@/components/benefits-section";
import CallToAction from "@/components/call-to-action";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <ProblemSolution />
      <HowItWorks />
      <DashboardShowcase />
      <DisputeResolution />
      <BenefitsSection />
      <CallToAction />
      <Footer />
    </div>
  );
}
