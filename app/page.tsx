import ReactiveHeader from "@/components/ReactiveHeader";
import ReviewsSection from "@/components/ReviewsSection";
import ServicesSection from "@/components/ServicesSection";
import AboutUsSection from "@/components/AboutUsSection";
import ContactInfoSection from "@/components/ContactInfoSection";

export default function Home() {
  return (
    <main className="min-h-screen">
      <ReactiveHeader />
      <ReviewsSection />
      <ServicesSection />
      <AboutUsSection />
      <ContactInfoSection />
    </main>
  );
}

