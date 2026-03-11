"use client";

import { useEffect, useMemo, useState } from "react";

type ReviewInfo = {
  garage_name: string;
  google_review_url: string;
  short_code: string;
};

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden>
      <path
        d="m12 3.5 2.78 5.63 6.22.9-4.5 4.38 1.06 6.19L12 17.68 6.44 20.6l1.06-6.19L3 10.03l6.22-.9L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ReviewPage({ params }: { params: { code: string } }) {
  const [reviewInfo, setReviewInfo] = useState<ReviewInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetch(`/api/public-review/${params.code}`, { cache: "no-store" });
        if (!response.ok) throw new Error("load_failed");
        const data = (await response.json()) as ReviewInfo;
        if (!mounted) return;
        setReviewInfo(data);
      } catch {
        if (!mounted) return;
        setError("Could not load review page.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [params.code]);

  const canGoToGoogle = useMemo(() => Boolean(reviewInfo?.google_review_url?.trim()), [reviewInfo]);

  async function submitFeedback() {
    if (!rating || rating > 3) return;
    if (!feedback.trim()) {
      setError("Please add a quick note before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/review-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          short_code: params.code,
          rating,
          message: feedback.trim(),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Could not submit feedback");
      }

      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] text-[#1F252E]">
      <div className="mx-auto w-full max-w-md px-6 pb-12 pt-10">
        {loading ? (
          <p className="text-sm text-[#697383]">Loading...</p>
        ) : error && !reviewInfo ? (
          <p className="text-sm text-[#8E2E2E]">{error}</p>
        ) : (
          <div>
            <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Share Your Feedback</h1>
            <p className="mt-2 text-sm text-[#606875]">
              How was your experience with {reviewInfo?.garage_name || "our garage"}?
            </p>

            <div className="mt-6 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setRating(value);
                    setError(null);
                  }}
                  className={`rounded-lg p-2 ${rating !== null && value <= rating ? "text-[#F59E0B]" : "text-[#A8AFBB]"}`}
                  aria-label={`${value} star${value > 1 ? "s" : ""}`}
                >
                  <Star filled={Boolean(rating && value <= rating)} />
                </button>
              ))}
            </div>

            {rating !== null && rating >= 4 && (
              <div className="mt-8 space-y-3">
                <p className="text-sm text-[#303745]">
                  Great to hear. If you have a moment, please leave us a Google review. It really helps other local drivers choose us.
                </p>
                <a
                  href={canGoToGoogle ? reviewInfo?.google_review_url : "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full rounded-xl bg-[#1F252E] px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Leave Google Review
                </a>
              </div>
            )}

            {rating !== null && rating <= 3 && (
              <div className="mt-8 space-y-3">
                <p className="text-sm text-[#303745]">Thanks for your honesty. Tell us what went wrong so we can improve.</p>
                {submitted ? (
                  <p className="rounded-lg border border-[#D4ECD9] bg-[#F3FFF5] px-3 py-2 text-sm text-[#2A6A35]">
                    Feedback sent privately. Thank you.
                  </p>
                ) : (
                  <>
                    <textarea
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-[#D7DDE6] px-3 py-2 text-sm"
                      placeholder="Write your feedback..."
                    />
                    <button
                      type="button"
                      onClick={submitFeedback}
                      disabled={submitting}
                      className="w-full rounded-xl bg-[#1F252E] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {submitting ? "Sending..." : "Send Private Feedback"}
                    </button>
                  </>
                )}

              </div>
            )}

            {error && <p className="mt-4 text-sm text-[#8E2E2E]">{error}</p>}
          </div>
        )}
      </div>
    </main>
  );
}
