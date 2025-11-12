"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getBookingSettings, getGarageSiteContent } from "@/lib/db";
import { isCurrentlyOpen, getNextOpeningTime } from "@/lib/business-hours";
import type { BookingSettings, GarageSiteContent } from "@/types/db";

export default function ReactiveHeader() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [content, setContent] = useState<GarageSiteContent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [nextOpening, setNextOpening] = useState<{ time: string; day: string | null } | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      try {
        setError(null);
        console.log("Loading booking settings and garage content...");
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Request timeout after 10 seconds")), 10000)
        );
        
        const [settingsData, contentData] = await Promise.race([
          Promise.all([
            getBookingSettings(),
            getGarageSiteContent(),
          ]),
          timeoutPromise,
        ]) as [BookingSettings | null, GarageSiteContent | null];

        if (!isMounted) return;

        console.log("Settings:", settingsData);
        console.log("Content:", contentData);

        setSettings(settingsData);
        setContent(contentData);

        if (settingsData) {
          const timezone = settingsData.timezone || "Europe/London";
          const open = isCurrentlyOpen(settingsData, timezone);
          setIsOpen(open);
          setNextOpening(getNextOpeningTime(settingsData, timezone));
        }
      } catch (error) {
        if (!isMounted) return;
        const errorMessage = error instanceof Error ? error.message : "Failed to load data";
        console.error("Error loading data:", error);
        setError(errorMessage);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center p-6">
        <div className="text-white text-center">
          <p className="text-lg font-semibold mb-2">Error loading garage information</p>
          <p className="text-sm text-gray-400">{error}</p>
          <p className="text-xs text-gray-500 mt-4">Check the browser console for more details.</p>
        </div>
      </div>
    );
  }

  if (!settings || !content) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center p-6">
        <div className="text-white text-center">
          <p className="text-lg font-semibold mb-2">Unable to load garage information</p>
          <p className="text-sm text-gray-400">
            Please make sure you have configured booking settings and garage content in the admin panel.
          </p>
        </div>
      </div>
    );
  }

  const businessName = content.business_name || "Garage";
  const tagline = content.tagline || "";
  const city = content.city || "";
  const postcode = content.postcode || "";
  const location = city && postcode ? `${city}, ${postcode}` : city || postcode || "";
  const phone = content.phone || "";

  // Format phone number for tel: link (remove spaces and special chars)
  const phoneLink = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "");

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header Image Section - Top ~40% */}
      <div className="relative h-[40vh] w-full bg-gray-900">
        {!imageError && (
          <Image
            src="/images/header-image.png"
            alt={`${businessName} garage`}
            fill
            className="object-cover"
            priority
            onError={() => setImageError(true)}
          />
        )}
        {/* Logo Overlay */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <path
              d="M5 11L6.5 6.5H17.5L19 11M5 11H3V18H5V11ZM19 11H21V18H19V11ZM5 11V18H19V11M7.5 14H9.5M14.5 14H16.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-white font-bold text-xl">{businessName}</span>
        </div>
      </div>

      {/* Content Section - Bottom ~60% */}
      <div className="bg-gray-800 px-6 py-8">
        {/* Tagline */}
        {tagline && (
          <h1 className="text-white text-2xl font-bold mb-4 text-center">
            {tagline}
          </h1>
        )}

        {/* Location */}
        {location && (
          <div className="flex items-center gap-2 mb-6 text-white">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="text-sm">{location}</span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-600 my-6"></div>

        {/* Status Message */}
        <div className="mb-6">
          {isOpen ? (
            <>
              <p className="text-white text-lg font-semibold mb-2">
                We&apos;re open now.
              </p>
            </>
          ) : (
            <>
              <p className="text-white text-lg font-semibold mb-2">
                Sorry, we&apos;re closed right now.
              </p>
              {nextOpening && (
                <p className="text-gray-300 text-sm mb-4">
                  {nextOpening.day
                    ? `Call from ${nextOpening.time} on ${nextOpening.day} or book online anytime.`
                    : `Call from ${nextOpening.time} tomorrow or book online anytime.`}
                </p>
              )}
            </>
          )}
        </div>

        {/* CTAs */}
        {isOpen ? (
          <>
            {/* Primary CTA: Call Us */}
            <a
              href={`tel:${phoneLink}`}
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg mb-3 flex items-center justify-center gap-2 transition-colors"
              style={{ backgroundColor: '#FF6B35' }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {phone}
            </a>
            {/* Secondary CTA: Book Online */}
            <button className="block w-full bg-gray-700 border-2 border-white text-white font-bold py-4 px-6 rounded-lg hover:bg-gray-600 transition-colors">
              Book online
            </button>
          </>
        ) : (
          <>
            {/* Primary CTA: Book Online */}
            <button 
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg mb-3 transition-colors"
              style={{ backgroundColor: '#FF6B35' }}
            >
              Book online
            </button>
            {/* Phone Number (not in button) */}
            {phone && (
              <div className="flex items-center justify-center gap-2 text-white">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <a href={`tel:${phoneLink}`} className="text-sm hover:underline">
                  {phone}
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

