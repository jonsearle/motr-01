"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getGarageSiteContent } from "@/lib/db";
import type { GarageSiteContent } from "@/types/db";

// Map problem options to shortened display text
const PROBLEM_DISPLAY_MAP: Record<string, string> = {
  "Car won't start": "Car won't start",
  "Warning light came on": "Warning light came on",
  "I hear a strange noise": "Strange noise",
  "Something smells odd": "Odd smell",
  "I see smoke": "Smoke",
  "I see a leak": "Leak",
  "Something else": "Your description",
};

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function DateTimePageContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<GarageSiteContent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const searchParams = useSearchParams();

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

  // Get previous choice from URL parameters
  const getPreviousChoice = (): string | null => {
    const appointmentType = searchParams.get("appointment_type");
    const problem = searchParams.get("problem");
    const description = searchParams.get("description");

    if (appointmentType) {
      return appointmentType;
    }

    if (problem) {
      return PROBLEM_DISPLAY_MAP[problem] || problem;
    }

    if (description) {
      return "Your description";
    }

    return null;
  };

  const previousChoice = getPreviousChoice();

  // Calendar helpers
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 7, then shift Monday to 0
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    setSelectedDate(date);
  };

  // Generate calendar days
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayIndex = getFirstDayOfMonth(currentMonth, currentYear);
  const calendarDays: (number | null)[] = [];

  // Add empty cells before first day
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Fill remaining cells to complete weeks (showing blank cells for next month)
  const totalCells = Math.ceil(calendarDays.length / 7) * 7;
  while (calendarDays.length < totalCells) {
    calendarDays.push(null);
  }

  // Format selected date
  const formatSelectedDate = (date: Date): string => {
    const dayName = DAYS_OF_WEEK[date.getDay() === 0 ? 6 : date.getDay() - 1] || "";
    const day = date.getDate();
    const monthName = MONTH_NAMES[date.getMonth()];
    return `${dayName} ${day} ${monthName}`;
  };

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
        <p className="text-white text-base mb-6">When would you like to come in?</p>

        {/* Previous choice lozenge */}
        {previousChoice && (
          <div className="mb-6 flex items-center justify-start">
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2">
              <span className="text-gray-800 text-sm font-medium">{previousChoice}</span>
              <Link
                href="/book"
                className="text-gray-800 hover:text-gray-600 transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="mb-6">
          {/* Month navigation */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <button
              onClick={handlePrevMonth}
              className="text-white hover:text-gray-300 transition-colors"
              type="button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="text-white font-semibold text-base">
              {MONTH_NAMES[currentMonth]}
            </span>
            <button
              onClick={handleNextMonth}
              className="text-white hover:text-gray-300 transition-colors"
              type="button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="text-white text-xs text-center py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="aspect-square"
                  />
                );
              }

              const isSelected =
                selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getFullYear() === currentYear;

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square rounded flex items-center justify-center text-sm transition-colors border border-white ${
                    isSelected
                      ? "bg-white text-gray-800 font-semibold"
                      : "text-white hover:bg-gray-700"
                  }`}
                  type="button"
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected date display */}
        {selectedDate && (
          <div className="mb-6">
            <p className="text-white font-bold text-base">
              {formatSelectedDate(selectedDate)}
            </p>
          </div>
        )}

        {/* Continue button */}
        <button
          disabled
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#FF6B35' }}
          type="button"
        >
          Continue
        </button>

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

export default function DateTimePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <DateTimePageContent />
    </Suspense>
  );
}

