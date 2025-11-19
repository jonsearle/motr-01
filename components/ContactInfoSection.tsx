"use client";

import { useState, useEffect } from "react";
import { getGarageSiteContent, getBookingSettings } from "@/lib/db";
import type { GarageSiteContent, BookingSettings, OpeningDay } from "@/types/db";

// Day name mapping for display
const DAY_NAMES: Record<OpeningDay['day_of_week'], string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

// Day order for display (Monday to Sunday)
const DAY_ORDER: OpeningDay['day_of_week'][] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export default function ContactInfoSection() {
  const [content, setContent] = useState<GarageSiteContent | null>(null);
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [contentData, settingsData] = await Promise.all([
          getGarageSiteContent(),
          getBookingSettings(),
        ]);
        setContent(contentData);
        setSettings(settingsData);
      } catch (error) {
        console.error("Error loading contact info:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Don't render if loading or no data
  if (loading || !content || !settings) {
    return null;
  }

  // Build full address as single line
  const addressParts = [
    content.address_line1,
    content.address_line2,
    content.city,
    content.postcode,
  ].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  // Build Google Maps directions URL
  const googleMapsUrl = fullAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`
    : '#';

  // Email link with subject
  const emailLink = content.email
    ? `mailto:${content.email}?subject=Enquiry`
    : '#';

  // Phone link for mobile
  const phoneLink = content.phone
    ? `tel:${content.phone.replace(/\s+/g, '').replace(/[^\d+]/g, '')}`
    : '#';

  return (
    <section
      className="w-full py-12 md:py-16 px-6 md:px-12"
      style={{ backgroundColor: '#3B6D8C' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* How to find us */}
        {fullAddress && (
          <div className="mb-12 md:mb-16">
            <h2 className="text-white font-bold text-2xl md:text-3xl mb-6 md:mb-8">
              How to find us
            </h2>
            <p className="text-white text-sm mb-6 md:mb-8">
              {fullAddress}
            </p>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors text-base"
              style={{ backgroundColor: '#FF6B35' }}
            >
              Get Directions
            </a>
          </div>
        )}

        {/* Contact Us */}
        {(content.email || content.phone) && (
          <div className="mb-12 md:mb-16">
            <h2 className="text-white font-bold text-2xl md:text-3xl mb-6 md:mb-8">
              Contact Us
            </h2>
            {content.email && (
              <a
                href={emailLink}
                className="flex items-center gap-3 mb-4 text-white text-sm hover:opacity-80 transition-opacity"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>{content.email}</span>
              </a>
            )}
            {content.phone && (
              <>
                {/* Mobile: Clickable link */}
                <a
                  href={phoneLink}
                  className="flex md:hidden items-center gap-3 text-white text-sm hover:opacity-80 transition-opacity"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>{content.phone}</span>
                </a>
                {/* Desktop: Plain text */}
                <div className="hidden md:flex items-center gap-3 text-white text-sm">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>{content.phone}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Opening Hours */}
        {settings.opening_days && settings.opening_days.length > 0 && (
          <div>
            <h2 className="text-white font-bold text-2xl md:text-3xl mb-6 md:mb-8">
              Opening Hours
            </h2>
            <div className="space-y-3">
              {DAY_ORDER.map((dayOfWeek) => {
                const dayConfig = settings.opening_days.find(
                  (d) => d.day_of_week === dayOfWeek
                );
                if (!dayConfig) return null;

                const dayName = DAY_NAMES[dayOfWeek];
                const timeDisplay = dayConfig.is_open
                  ? `${dayConfig.business_open_time} to ${dayConfig.business_close_time}`
                  : 'Closed';

                return (
                  <div
                    key={dayOfWeek}
                    className="flex items-center text-white text-sm"
                  >
                    <span className="w-12">{dayName}</span>
                    <span className="font-bold">{timeDisplay}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

