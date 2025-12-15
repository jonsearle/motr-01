"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
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
    <div className="min-h-screen bg-gray-800 flex flex-col md:flex-row">
      {/* Content Section */}
      {/* Mobile: Full width, top position | Desktop: 50% width, left position */}
      <div className="w-full md:w-1/2 bg-gray-800 px-6 py-8 md:px-12 md:py-16 flex flex-col justify-start">
        {/* Logo/Business Name - Always visible above text content */}
        <div className="flex items-center gap-2 mb-6">
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
          <span className="text-white font-bold text-base md:text-lg">{businessName}</span>
        </div>

        {/* Tagline */}
        {tagline && (
          <h1 className="text-white text-2xl md:text-4xl font-bold mb-4 md:mb-6 text-left">
            {tagline}
          </h1>
        )}

        {/* Location */}
        {location && (
          <div className="flex items-center gap-2 mb-6 md:mb-8 text-white">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
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
            <span className="text-sm md:text-base">{location}</span>
          </div>
        )}

        {/* Divider - Hidden on mobile, hidden on desktop when open (open state has its own dividers) */}
        <div className={`hidden md:block border-t border-gray-600 my-6 md:my-8 ${isOpen ? 'md:hidden' : ''}`}></div>

        {/* Status Message */}
        <div className="mb-6 md:mb-8">
          {isOpen ? (
            <>
              {/* Desktop Open: Two divider lines with text and phone number */}
              <div className="hidden md:block">
                {/* First Divider */}
                <div className="border-t border-gray-600 my-6"></div>
                {/* Text between dividers */}
                <p className="text-white text-base mb-4">
                  Call us now or book online anytime.
                </p>
                {/* Phone Number - Large text, no icon, not a button */}
                {phone && (
                  <div className="flex justify-start text-white mb-4">
                    <span className="text-xl font-bold">{phone}</span>
                  </div>
                )}
                {/* Second Divider */}
                <div className="border-t border-gray-600 mb-6"></div>
              </div>
            </>
          ) : (
            <>
              <p className="text-white text-lg md:text-xl font-semibold mb-2">
                Sorry, we&apos;re closed right now.
              </p>
              {nextOpening && (
                <p className="text-gray-300 text-sm md:text-base mb-4">
                  {nextOpening.day
                    ? `Call from ${nextOpening.time} on ${nextOpening.day} or book online anytime.`
                    : `Call from ${nextOpening.time} tomorrow or book online anytime.`}
                </p>
              )}
              {/* Phone Number - Between divider lines, left-aligned, vertically centered */}
              {phone && (
                <div className="flex justify-start text-white py-4">
                  <span className="text-base">{phone}</span>
                </div>
              )}
              {/* Second Divider - After phone number */}
              <div className="border-t border-gray-600 mb-6"></div>
            </>
          )}
        </div>

        {/* CTAs */}
        {isOpen ? (
          <>
            {/* Mobile: Call Us Button */}
            <a
              href={`tel:${phoneLink}`}
              className="flex md:hidden w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg mb-3 items-center justify-center transition-colors text-base"
              style={{ backgroundColor: '#FF6B35' }}
            >
              {phone}
            </a>
            {/* Book Online Button - Smaller on desktop */}
            <Link 
              href="/book"
              className="block w-full bg-gray-800 border border-white text-white font-bold py-4 md:py-3 px-6 rounded-lg transition-colors text-base hover:bg-gray-700 text-center"
            >
              Book online
            </Link>
          </>
        ) : (
          <>
            {/* Primary CTA: Book Online - Big button */}
            <Link 
              href="/book"
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 md:py-4 px-6 rounded-lg transition-colors text-base md:text-lg text-center"
              style={{ backgroundColor: '#FF6B35' }}
            >
              Book online
            </Link>
          </>
        )}
      </div>

      {/* Header Image Section */}
      {/* Mobile: Full width, below content | Desktop: 50% width, right position */}
      <div className="relative w-full md:w-1/2 h-[50vh] md:h-screen bg-gray-900">
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
      </div>
    </div>
  );
}

