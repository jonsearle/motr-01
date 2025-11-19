"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getGarageSiteContent } from "@/lib/db";

export default function AboutUsSection() {
  const [aboutText, setAboutText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAboutText() {
      try {
        const content = await getGarageSiteContent();
        if (content?.about_text) {
          setAboutText(content.about_text);
        }
      } catch (error) {
        console.error("Error loading about text:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAboutText();
  }, []);

  // Don't render if loading or no about text
  if (loading || !aboutText) {
    return null;
  }

  return (
    <section className="w-full">
      {/* Mobile Layout: Image on top, then title and text */}
      <div className="flex flex-col md:hidden">
        {/* Image */}
        <div className="w-full">
          <Image
            src="/images/about-us.png"
            alt="About us"
            width={800}
            height={600}
            className="w-full h-auto object-cover"
          />
        </div>
        
        {/* Text section with grey background */}
        <div 
          className="w-full py-12 px-6"
          style={{ backgroundColor: '#2F3437' }}
        >
          <div className="max-w-7xl mx-auto">
            {/* Title */}
            <h2 className="text-white font-bold text-2xl mb-6">
              About us
            </h2>
            
            {/* Text */}
            <p className="text-white text-sm leading-relaxed whitespace-pre-line">
              {aboutText}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Layout: Text on left with grey background, image on right as full-height panel */}
      <div className="hidden md:flex md:flex-row md:items-stretch">
        {/* Left side: Title and Text with grey background */}
        <div 
          className="flex-1 py-12 md:py-16 px-6 md:px-12"
          style={{ backgroundColor: '#2F3437' }}
        >
          <div className="max-w-7xl mx-auto w-full">
            <h2 className="text-white font-bold text-2xl md:text-3xl mb-8 md:mb-12">
              About us
            </h2>
            <p className="text-white text-sm leading-relaxed whitespace-pre-line">
              {aboutText}
            </p>
          </div>
        </div>
        
        {/* Right side: Image as full-height panel */}
        <div className="flex-1 relative">
          <Image
            src="/images/about-us.png"
            alt="About us"
            fill
            className="object-cover"
            style={{ objectPosition: 'center' }}
          />
        </div>
      </div>
    </section>
  );
}

