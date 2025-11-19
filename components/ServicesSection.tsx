"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getGarageSiteContent } from "@/lib/db";
import type { Service } from "@/types/db";

// Individual service card component
function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="flex flex-col">
      {/* Tick Icon */}
      <div className="mb-2">
        <Image
          src="/images/Tick.svg"
          alt=""
          width={26}
          height={26}
          className="w-[26px] h-[26px]"
        />
      </div>
      {/* Service Name - matches review name styling */}
      <h3 className="text-gray-800 font-bold text-lg mb-2">
        {service.service_name}
      </h3>
      {/* Service Description - matches review text styling */}
      <p className="text-gray-700 text-sm leading-relaxed">
        {service.description}
      </p>
    </div>
  );
}

export default function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function loadServices() {
      try {
        const content = await getGarageSiteContent();
        if (content) {
          // Filter out empty services
          const validServices = (content.services || []).filter(
            (s) => s.service_name?.trim() && s.description?.trim()
          );
          setServices(validServices);
        }
      } catch (error) {
        console.error("Error loading services:", error);
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, []);

  // Don't render if loading or no services
  if (loading || services.length === 0) {
    return null;
  }

  // Determine which services to display
  const displayedServices = isExpanded ? services : services.slice(0, 3);
  const hasMoreThanThree = services.length > 3;

  return (
    <section className="w-full py-12 md:py-16 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <h2 className="text-gray-800 font-bold text-2xl md:text-3xl mb-8 md:mb-12">
          Our Services
        </h2>

        {/* Services Grid - Responsive with auto-fit */}
        <div
          className="grid gap-6 md:gap-8"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          }}
        >
          {displayedServices.map((service, index) => (
            <ServiceCard key={index} service={service} />
          ))}
        </div>

        {/* Show More/Less Button */}
        {hasMoreThanThree && (
          <div className="mt-8 md:mt-12 flex justify-start">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-6 py-2 bg-white border border-black text-gray-700 font-normal text-sm md:text-base rounded-md hover:bg-gray-50 transition-colors"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

