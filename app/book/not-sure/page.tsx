"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getGarageSiteContent } from "@/lib/db";
import type { GarageSiteContent } from "@/types/db";

const PROBLEM_OPTIONS = [
  "Car won't start",
  "Warning light came on",
  "I hear a strange noise",
  "Something smells odd",
  "I see smoke",
  "I see a leak",
  "Something else",
];

export default function NotSurePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<GarageSiteContent | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadGarageName() {
      try {
        setError(null);
        console.log("Loading garage content...");

        const contentData = await getGarageSiteContent();

        if (!isMounted) return;

        setContent(contentData);
      } catch (error) {
        if (!isMounted) return;
        const errorMessage = error instanceof Error ? error.message : "Failed to load garage information";
        setError(errorMessage);
        console.error("Error loading garage content:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadGarageName();
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
        </div>
      </div>
    );
  }

  const businessName = content?.business_name || "Garage";

  const handleProblemClick = (problem: string) => {
    if (problem === "Something else") {
      return `/book/custom-job`;
    }
    return `/book/date-time?problem=${encodeURIComponent(problem)}`;
  };

  return (
    <div className="min-h-screen bg-gray-800 flex items-start justify-center pt-8 px-6 pb-20 md:pb-24">
      <div className="w-full max-w-md">
        {/* Header with garage name */}
        <Link 
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
        >
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
          <span className="text-white font-bold text-base">{businessName}</span>
        </Link>

        {/* Title */}
        <h1 className="text-white text-2xl font-bold mb-2">Book an appointment</h1>

        {/* Subtitle */}
        <p className="text-white text-base mb-6">What&apos;s the problem?</p>

        {/* Problem option buttons */}
        <div className="space-y-4 mb-12">
          {PROBLEM_OPTIONS.map((problem) => (
            <Link
              key={problem}
              href={handleProblemClick(problem)}
              className="block w-full text-left border border-white rounded-lg p-4 hover:bg-gray-700 active:bg-gray-600 transition-colors cursor-pointer touch-manipulation"
            >
              <div className="text-white font-bold text-base">{problem}</div>
            </Link>
          ))}
        </div>

        {/* Powered by Spannr footer */}
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6">
          <a
            href="https://bbc.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white text-xs hover:text-gray-300 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Powered by Spannr</span>
          </a>
        </div>
      </div>
    </div>
  );
}

