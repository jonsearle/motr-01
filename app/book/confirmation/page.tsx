"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useGarageName } from "@/lib/use-garage-name";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const garageName = useGarageName();

  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");

  const readableDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? new Date(`${dateParam}T00:00:00`).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  const readableTime = timeParam ? timeParam.slice(0, 5) : null;

  return (
    <main className="min-h-screen bg-gray-800 px-6 pb-24 pt-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <Link href="/book" className="mb-6 inline-flex items-center gap-2 opacity-90">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white">
            <path
              d="M5 11L6.5 6.5H17.5L19 11M5 11H3V18H5V11ZM19 11H21V18H19V11ZM5 11V18H19V11M7.5 14H9.5M14.5 14H16.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-base font-bold">{garageName}</span>
        </Link>

        <div className="mb-6 mt-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-white">
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Thanks for booking.</h1>
        {readableDate && readableTime ? (
          <p className="mt-4 text-base text-gray-100">
            We&apos;ll see you on {readableDate} at {readableTime}.
          </p>
        ) : (
          <p className="mt-4 text-base text-gray-100">Your booking is confirmed.</p>
        )}
      </div>
    </main>
  );
}
