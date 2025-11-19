import ReactiveHeader from "@/components/ReactiveHeader";
import ReviewsSection from "@/components/ReviewsSection";
import ServicesSection from "@/components/ServicesSection";

export default function Home() {
  return (
    <main className="min-h-screen">
      <ReactiveHeader />
      <ReviewsSection />
      <ServicesSection />
    </main>
  );
}

