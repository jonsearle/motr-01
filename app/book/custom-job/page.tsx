"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getGarageSiteContent } from "@/lib/db";
import type { GarageSiteContent } from "@/types/db";

export default function CustomJobPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<GarageSiteContent | null>(null);
  const [description, setDescription] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const hasDescription = description.trim().length > 0;

  const handleContinue = () => {
    if (hasDescription) {
      const encodedDescription = encodeURIComponent(description.trim());
      router.push(`/book/date-time?description=${encodedDescription}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On mobile, when user presses the "Done" button (Cmd+Enter or Enter on mobile keyboards with enterkeyhint),
    // or if they press Cmd+Enter / Ctrl+Enter, trigger continue
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (hasDescription) {
        handleContinue();
      }
    }
  };

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

  // Auto-focus textarea on mount
  useEffect(() => {
    if (textareaRef.current && !loading) {
      textareaRef.current.focus();
    }
  }, [loading]);

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

  return (
    <div className="min-h-screen bg-gray-800 flex items-start justify-center pt-8 px-6 pb-24 md:pb-32">
      <div className="w-full max-w-md relative min-h-[calc(100vh-4rem)]">
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
        <h1 className="text-white text-[28px] font-semibold tracking-[-0.02em] mb-2">Book an appointment</h1>

        {/* Subtitle */}
        <p className="text-white text-base mb-6">Describe the issue.</p>

        {/* Textarea */}
        <div className="mb-6">
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Give us a brief description as best you can..."
            className="w-full min-h-[200px] bg-gray-800 border border-white rounded-lg p-4 text-white placeholder:text-gray-400 focus:outline-none resize-none"
            rows={6}
            enterKeyHint="done"
          />
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!hasDescription}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#FF6B35' }}
          type="button"
        >
          Continue
        </button>

        {/* Powered by Motr footer */}
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-10">
          <a
            href="https://motex-home.netlify.app/"
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
            <span>Powered by Motr</span>
          </a>
        </div>
      </div>
    </div>
  );
}

