"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getGarageSiteContent, getBookingSettings, getBookingsByDateRange } from "@/lib/db";
import type { GarageSiteContent, BookingSettings, OpeningDay, Booking } from "@/types/db";

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
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setError(null);
        console.log("Loading garage content and booking settings...");

        const [contentData, settingsData] = await Promise.all([
          getGarageSiteContent(),
          getBookingSettings(),
        ]);

        if (!isMounted) return;

        setContent(contentData);
        setBookingSettings(settingsData);
      } catch (error) {
        if (!isMounted) return;
        const errorMessage = error instanceof Error ? error.message : "Failed to load garage information";
        setError(errorMessage);
        console.error("Error loading garage data:", error);
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

  // Load bookings for the current visible month
  useEffect(() => {
    let isMounted = true;

    async function loadBookings() {
      if (!bookingSettings) return;

      try {
        // Calculate first and last day of the visible month
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);

        // Format dates as YYYY-MM-DD strings
        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];

        const bookingsData = await getBookingsByDateRange(startDate, endDate);

        if (!isMounted) return;

        setBookings(bookingsData);
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading bookings:", error);
        // Don't set error state for bookings - just log it
      }
    }

    loadBookings();
    return () => {
      isMounted = false;
    };
  }, [currentMonth, currentYear, bookingSettings]);

  // Auto-select next available date when page loads
  useEffect(() => {
    let isMounted = true;

    async function autoSelectNextAvailable() {
      // Only run once, and only if we have settings loaded and not currently loading
      if (hasAutoSelected || !bookingSettings || loading) {
        return;
      }

      try {
        const today = getCurrentDateInTimezone(bookingSettings.timezone);
        const currentMonthStart = new Date(currentYear, currentMonth, 1);
        
        // Start searching from today (will start from tomorrow in the function)
        const startDate = today < currentMonthStart ? currentMonthStart : today;
        
        // Use current bookings (may be empty, that's fine - function will load more if needed)
        const result = await findNextAvailableDate(startDate, bookingSettings, bookings);
        
        if (!isMounted) return;
        
        if (result) {
          // Navigate to the correct month if needed
          if (result.month !== currentMonth || result.year !== currentYear) {
            setCurrentMonth(result.month);
            setCurrentYear(result.year);
          }
          
          // Select the date
          setSelectedDate(result.date);
          setHasAutoSelected(true);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error auto-selecting next available date:", error);
      }
    }

    // Run auto-selection after a short delay to ensure bookings have loaded
    const timer = setTimeout(() => {
      autoSelectNextAvailable();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [bookingSettings, bookings, currentMonth, currentYear, loading, hasAutoSelected]);

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

  // Get current date in garage timezone
  const getCurrentDateInTimezone = (timezone: string = 'Europe/London'): Date => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')!.value);
    const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1; // 0-indexed
    const day = parseInt(parts.find(p => p.type === 'day')!.value);
    return new Date(year, month, day);
  };

  // Get day of week name from a date in garage timezone
  const getDayOfWeekName = (date: Date, timezone: string = 'Europe/London'): OpeningDay['day_of_week'] => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
    });
    const dayName = formatter.format(date).toLowerCase();
    return dayName as OpeningDay['day_of_week'];
  };

  // Check if a date is in the past (in garage timezone)
  const isDateInPast = (date: Date, timezone: string = 'Europe/London'): boolean => {
    const today = getCurrentDateInTimezone(timezone);
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return compareDate < compareToday;
  };

  // Check if garage is closed on a specific date
  const isGarageClosed = (date: Date, settings: BookingSettings | null): boolean => {
    if (!settings) return false;
    const dayOfWeek = getDayOfWeekName(date, settings.timezone);
    const openingDay = settings.opening_days.find(day => day.day_of_week === dayOfWeek);
    return !openingDay || !openingDay.is_open;
  };

  // Count working days from today to a given date (in garage timezone)
  // Today counts as day 0, tomorrow is day 1, etc.
  // Only counts days when the garage is open
  const countWorkingDaysToDate = (date: Date, settings: BookingSettings | null): number => {
    if (!settings) return 0;
    
    const today = getCurrentDateInTimezone(settings.timezone);
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // If target is today or in the past, return 0
    if (targetDate <= startDate) return 0;
    
    let workingDays = 0;
    let currentDate = new Date(startDate);
    
    // Start from tomorrow (day 1) and count up to and including the target date
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Count working days until we reach and include the target date
    while (currentDate <= targetDate) {
      if (!isGarageClosed(currentDate, settings)) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  };

  // Check if a date is within the lead time window (too soon to book)
  const isWithinLeadTime = (date: Date, settings: BookingSettings | null): boolean => {
    if (!settings || settings.lead_time_days === 0) return false;
    
    const workingDays = countWorkingDaysToDate(date, settings);
    return workingDays < settings.lead_time_days;
  };

  // Check if a date has reached its daily booking limit
  const isFullyBooked = (date: Date, settings: BookingSettings | null): boolean => {
    if (!settings || settings.daily_booking_limit === 0) return false;
    
    // Format date as YYYY-MM-DD string
    const dateStr = date.toISOString().split('T')[0];
    
    // Count bookings for this date
    const bookingsForDate = bookings.filter(booking => booking.date === dateStr);
    
    return bookingsForDate.length >= settings.daily_booking_limit;
  };

  // Determine day state for calendar display
  type DayState = 'past-open' | 'past-closed' | 'leadtime-open' | 'leadtime-closed' | 'fullybooked-open' | 'fullybooked-closed' | 'future-closed' | 'open' | 'selected';
  const getDayState = (day: number, month: number, year: number): DayState => {
    if (!bookingSettings) return 'open';
    
    const date = new Date(year, month, day);
    const isPast = isDateInPast(date, bookingSettings.timezone);
    const isClosed = isGarageClosed(date, bookingSettings);
    const isWithinLeadTimeWindow = isWithinLeadTime(date, bookingSettings);
    const isFullyBookedDate = isFullyBooked(date, bookingSettings);
    const isSelected =
      selectedDate &&
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year;

    // Selected state takes priority (only if selectable)
    if (isSelected && !isPast && !isClosed && !isWithinLeadTimeWindow && !isFullyBookedDate) {
      return 'selected';
    }
    
    // Past days
    if (isPast && isClosed) {
      return 'past-closed';
    }
    if (isPast && !isClosed) {
      return 'past-open';
    }
    
    // Future days within lead time window
    if (!isPast && isWithinLeadTimeWindow && !isClosed) {
      return 'leadtime-open';
    }
    if (!isPast && isWithinLeadTimeWindow && isClosed) {
      return 'leadtime-closed';
    }
    
    // Future days that are fully booked
    if (!isPast && !isWithinLeadTimeWindow && isFullyBookedDate && !isClosed) {
      return 'fullybooked-open';
    }
    if (!isPast && !isWithinLeadTimeWindow && isFullyBookedDate && isClosed) {
      return 'fullybooked-closed';
    }
    
    // Future days past lead time and not fully booked
    if (!isPast && !isWithinLeadTimeWindow && !isFullyBookedDate && isClosed) {
      return 'future-closed';
    }
    if (!isPast && !isWithinLeadTimeWindow && !isFullyBookedDate && !isClosed) {
      return 'open';
    }
    
    return 'open';
  };

  // Check if date is selectable
  const isDateSelectable = (day: number, month: number, year: number): boolean => {
    if (!bookingSettings) return false;
    const date = new Date(year, month, day);
    const isPast = isDateInPast(date, bookingSettings.timezone);
    const isClosed = isGarageClosed(date, bookingSettings);
    const isWithinLeadTimeWindow = isWithinLeadTime(date, bookingSettings);
    const isFullyBookedDate = isFullyBooked(date, bookingSettings);
    return !isPast && !isClosed && !isWithinLeadTimeWindow && !isFullyBookedDate;
  };

  // Check if a date is available (selectable) - used for finding next available date
  const isDateAvailable = (date: Date, settings: BookingSettings | null, bookingsList: Booking[]): boolean => {
    if (!settings) return false;
    
    const isPast = isDateInPast(date, settings.timezone);
    const isClosed = isGarageClosed(date, settings);
    const isWithinLeadTimeWindow = isWithinLeadTime(date, settings);
    
    // Check if fully booked using the provided bookings list
    const dateStr = date.toISOString().split('T')[0];
    const bookingsForDate = bookingsList.filter(booking => booking.date === dateStr);
    const isFullyBookedDate = bookingsForDate.length >= settings.daily_booking_limit;
    
    return !isPast && !isClosed && !isWithinLeadTimeWindow && !isFullyBookedDate;
  };

  // Find the next available date starting from a given date
  const findNextAvailableDate = async (
    startDate: Date,
    settings: BookingSettings | null,
    currentBookings: Booking[]
  ): Promise<{ date: Date; month: number; year: number } | null> => {
    if (!settings) return null;

    const today = getCurrentDateInTimezone(settings.timezone);
    let searchDate = new Date(startDate);
    
    // Start from tomorrow (today is never selectable due to lead time)
    searchDate.setDate(searchDate.getDate() + 1);
    
    // Search up to 6 months ahead
    const maxMonthsToSearch = 6;
    let monthsSearched = 0;
    
    while (monthsSearched < maxMonthsToSearch) {
      const month = searchDate.getMonth();
      const year = searchDate.getFullYear();
      const daysInMonth = getDaysInMonth(month, year);
      
      // Load bookings for this month if we don't have them
      let monthBookings = currentBookings;
      if (month !== currentMonth || year !== currentYear) {
        try {
          const firstDay = new Date(year, month, 1);
          const lastDay = new Date(year, month + 1, 0);
          const startDateStr = firstDay.toISOString().split('T')[0];
          const endDateStr = lastDay.toISOString().split('T')[0];
          monthBookings = await getBookingsByDateRange(startDateStr, endDateStr);
        } catch (error) {
          console.error("Error loading bookings for month:", error);
          // Continue with current bookings if we can't load
        }
      }
      
      // Search through days in this month
      for (let day = searchDate.getDate(); day <= daysInMonth; day++) {
        const checkDate = new Date(year, month, day);
        
        if (isDateAvailable(checkDate, settings, monthBookings)) {
          return {
            date: checkDate,
            month: month,
            year: year,
          };
        }
      }
      
      // Move to first day of next month
      monthsSearched++;
      searchDate = new Date(year, month + 1, 1);
    }
    
    return null;
  };

  // Calendar helpers
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 7, then shift Monday to 0
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  // Check if current month is the current month (in garage timezone)
  const isCurrentMonth = (): boolean => {
    if (!bookingSettings) return false;
    const today = getCurrentDateInTimezone(bookingSettings.timezone);
    return currentMonth === today.getMonth() && currentYear === today.getFullYear();
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
    if (!isDateSelectable(day, currentMonth, currentYear)) {
      return;
    }
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

  // Get drop-off times for a selected date
  const getDropoffTimes = (date: Date): { from: string; to: string } | null => {
    if (!bookingSettings) return null;
    
    const dayOfWeek = getDayOfWeekName(date, bookingSettings.timezone);
    const openingDay = bookingSettings.opening_days.find(day => day.day_of_week === dayOfWeek);
    
    if (!openingDay || !openingDay.is_open) return null;
    if (!openingDay.dropoff_from_time || !openingDay.dropoff_to_time) return null;
    
    return {
      from: openingDay.dropoff_from_time,
      to: openingDay.dropoff_to_time,
    };
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
            {!isCurrentMonth() && (
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
            )}
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

              const dayState = getDayState(day, currentMonth, currentYear);
              const isSelectable = isDateSelectable(day, currentMonth, currentYear);

              // Determine styling based on day state
              let dayClasses = "aspect-square rounded flex items-center justify-center text-sm transition-colors border";
              let dayStyle: React.CSSProperties = {};

              switch (dayState) {
                case 'selected':
                  dayClasses += " bg-white text-gray-800 font-semibold border-white";
                  break;
                case 'open':
                  dayClasses += " text-white border-white hover:bg-gray-700";
                  break;
                case 'future-closed':
                  dayClasses += " text-gray-400 border-gray-600 cursor-not-allowed";
                  // Diagonal striped background
                  dayStyle = {
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(156, 163, 175, 0.3) 4px, rgba(156, 163, 175, 0.3) 8px)',
                    backgroundColor: 'rgb(75, 85, 99)', // gray-600
                  };
                  break;
                case 'leadtime-open':
                  dayClasses += " text-gray-600 border-gray-700 cursor-not-allowed";
                  // Very dark gray (same as past-open)
                  dayStyle = {
                    backgroundColor: 'rgb(31, 41, 55)', // gray-800 (same as background)
                  };
                  break;
                case 'leadtime-closed':
                  dayClasses += " text-gray-700 border-gray-800 cursor-not-allowed";
                  // Very dark gray with diagonal stripes (same as past-closed)
                  dayStyle = {
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(55, 65, 81, 0.4) 4px, rgba(55, 65, 81, 0.4) 8px)',
                    backgroundColor: 'rgb(31, 41, 55)', // gray-800 (same as background)
                  };
                  break;
                case 'fullybooked-open':
                  dayClasses += " text-gray-600 border-gray-700 cursor-not-allowed";
                  // Very dark gray (same as leadtime-open and past-open)
                  dayStyle = {
                    backgroundColor: 'rgb(31, 41, 55)', // gray-800 (same as background)
                  };
                  break;
                case 'fullybooked-closed':
                  dayClasses += " text-gray-700 border-gray-800 cursor-not-allowed";
                  // Very dark gray with diagonal stripes (same as leadtime-closed and past-closed)
                  dayStyle = {
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(55, 65, 81, 0.4) 4px, rgba(55, 65, 81, 0.4) 8px)',
                    backgroundColor: 'rgb(31, 41, 55)', // gray-800 (same as background)
                  };
                  break;
                case 'past-open':
                  dayClasses += " text-gray-600 border-gray-700 cursor-not-allowed";
                  dayStyle = {
                    backgroundColor: 'rgb(31, 41, 55)', // gray-800 (same as background)
                  };
                  break;
                case 'past-closed':
                  dayClasses += " text-gray-700 border-gray-800 cursor-not-allowed";
                  // Diagonal striped background with very dark base
                  dayStyle = {
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(55, 65, 81, 0.4) 4px, rgba(55, 65, 81, 0.4) 8px)',
                    backgroundColor: 'rgb(31, 41, 55)', // gray-800 (same as background)
                  };
                  break;
              }

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  disabled={!isSelectable}
                  className={dayClasses}
                  style={dayStyle}
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
            <p className="text-white font-bold text-base mb-2">
              {formatSelectedDate(selectedDate)}
            </p>
            {(() => {
              const dropoffTimes = getDropoffTimes(selectedDate);
              if (dropoffTimes) {
                return (
                  <p className="text-white text-base">
                    Drop your car off between {dropoffTimes.from} and {dropoffTimes.to}
                  </p>
                );
              }
              return null;
            })()}
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

