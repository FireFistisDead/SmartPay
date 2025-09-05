import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import WhySmartPay from "@/components/why-smartpay";
import HowItWorksFlow from "@/components/how-it-works-flow";
import TechnologyStack from "@/components/technology-stack";
import HackathonContext from "@/components/hackathon-context";
import FeaturesSection from "@/components/features-section";
import FutureVision from "@/components/future-vision";
import CallToAction from "@/components/call-to-action";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <WhySmartPay />
      <HowItWorksFlow />
      <TechnologyStack />
      <HackathonContext />
      <FeaturesSection />
      <FutureVision />
      <CallToAction />
      <Footer />
    </div>
  );
}
