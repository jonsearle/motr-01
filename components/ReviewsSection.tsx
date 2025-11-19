"use client";

import { useState, useEffect } from "react";
import { getGarageSiteContent } from "@/lib/db";
import type { GarageSiteContent, Review } from "@/types/db";

// Star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={star <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          className="text-white"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// Individual review card component
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="flex-shrink-0 w-[calc(100vw-1.5rem-0.5rem)] md:w-auto md:flex-1">
      <div className="h-full">
        <h3 className="text-white font-bold text-lg mb-2">{review.customer_name}</h3>
        <div className="mb-3">
          <StarRating rating={review.stars} />
        </div>
        <p className="text-white/90 text-sm leading-relaxed">{review.review_text}</p>
      </div>
    </div>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [googleReviewsLink, setGoogleReviewsLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        const content = await getGarageSiteContent();
        if (content) {
          // Limit to maximum of 3 reviews
          const reviewsList = content.reviews?.slice(0, 3) || [];
          setReviews(reviewsList);
          setGoogleReviewsLink(content.google_reviews_link || null);
        }
      } catch (error) {
        console.error("Error loading reviews:", error);
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, []);

  // Don't render if no reviews
  if (loading || reviews.length === 0) {
    return null;
  }

  return (
    <section 
      className="w-full py-12 md:py-16 px-6 md:px-12"
      style={{ backgroundColor: '#3B6D8C' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <h2 className="text-white font-bold text-2xl md:text-3xl mb-8 md:mb-12">
          What our customers say
        </h2>

        {/* Reviews Container - Horizontal scroll on mobile, grid on desktop */}
        <div className="overflow-x-auto scroll-smooth -mx-6 md:mx-0 pb-4 md:pb-0 md:overflow-visible">
          <div className="flex md:grid md:grid-cols-3 gap-6 md:gap-8 pl-6 pr-2 md:px-0">
            {reviews.map((review, index) => (
              <ReviewCard key={index} review={review} />
            ))}
          </div>
        </div>

        {/* See more reviews link - Always shown as it's mandatory */}
        <div className="mt-8 md:mt-12">
          <a
            href={googleReviewsLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm md:text-base group"
          >
            <span>See more reviews</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="transition-transform group-hover:translate-x-1"
            >
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

