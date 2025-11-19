import ReactiveHeader from "@/components/ReactiveHeader";
import ReviewsSection from "@/components/ReviewsSection";
import ServicesSection from "@/components/ServicesSection";
import AboutUsSection from "@/components/AboutUsSection";

export default function Home() {
  return (
    <main className="min-h-screen">
      <ReactiveHeader />
      <ReviewsSection />
      <ServicesSection />
      <AboutUsSection />
    </main>
  );
}

