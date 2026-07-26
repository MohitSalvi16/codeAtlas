import { AnimatedBackground } from "@/components/landing/animated-background";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen">
      <AnimatedBackground />
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </main>
  );
}
