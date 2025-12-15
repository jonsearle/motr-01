"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getGarageSiteContent } from "@/lib/db";
import type { GarageSiteContent } from "@/types/db";

function CustomJobPageContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<GarageSiteContent | null>(null);
  const [description, setDescription] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasDescription = description.trim().length > 0;
  const fromUnsure = searchParams.get("from_unsure") === "1";

  const handleContinue = () => {
    if (hasDescription) {
      const encodedDescription = encodeURIComponent(description.trim());
      const params = new URLSearchParams();
      params.set("description", encodedDescription);
      if (fromUnsure) {
        params.set("from_unsure", "1");
      }
      router.push(`/book/date-time?${params.toString()}`);
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

        {/* Powered by Spannr footer */}
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6">
          <a
            href="https://motex-home.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white text-xs hover:text-gray-300 transition-colors"
          >
            <Image
              src="/images/spannr-icon-white.png"
              alt="Spannr"
              width={32}
              height={32}
              className="object-contain"
            />
            <span>Powered by Motr</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CustomJobPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <CustomJobPageContent />
    </Suspense>
  );
}

