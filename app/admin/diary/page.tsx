"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBookingsByMonth, getBookingSettings, getBookingsByDateRange } from "@/lib/db";
import { isDayClosed, formatDateForDisplay, getNextAvailableOnlineBookingDate } from "@/lib/business-hours";
import type { Booking, BookingSettings } from "@/types/db";
import DiaryDayPanel from "@/components/DiaryDayPanel";

function DiaryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [nextAvailableDate, setNextAvailableDate] = useState<string | null>(null);
  const [futureBookings, setFutureBookings] = useState<Booking[]>([]);
  const [today] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  // Initialize current month and selected date from URL params
  useEffect(() => {
    const monthParam = searchParams.get("month");
    if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number);
      setCurrentMonth(new Date(year, month - 1, 1));
    }

    const selectedDateParam = searchParams.get("selectedDate");
    if (selectedDateParam) {
      const date = new Date(selectedDateParam);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
      }
    }
  }, [searchParams]);

  // Load bookings and settings
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const [bookingsData, settingsData] = await Promise.all([
        getBookingsByMonth(year, month),
        getBookingSettings(),
      ]);

      setBookings(bookingsData);
      setSettings(settingsData);

      // Load future bookings for next available date calculation
      if (settingsData) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6); // Load 6 months ahead
        const startDateStr = today.toISOString().split('T')[0];
        const endDateStr = futureDate.toISOString().split('T')[0];
        try {
          const futureBookingsData = await getBookingsByDateRange(startDateStr, endDateStr);
          setFutureBookings(futureBookingsData);
          
          // Calculate next available date
          const nextDate = getNextAvailableOnlineBookingDate(settingsData, futureBookingsData);
          setNextAvailableDate(nextDate);
        } catch (error) {
          console.error("Error loading future bookings:", error);
        }
      }
    } catch (error) {
      console.error("Error loading diary data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh when page becomes visible (handles returning from create/edit)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loadData]);

  const handleMonthChange = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
    setSelectedDate(null); // Close day panel when changing months
    // Update URL
    const year = newMonth.getFullYear();
    const month = String(newMonth.getMonth() + 1).padStart(2, "0");
    router.push(`/admin/diary?month=${year}-${month}`);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    router.push(`/admin/diary?month=${year}-${month}&selectedDate=${dateStr}`);
  };


  const handleBookingDeleted = () => {
    // Reload bookings
    loadData();
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date): Booking[] => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return bookings.filter((b) => b.date === dateStr);
  };

  // Get booking count for a date
  const getBookingCount = (date: Date): number => {
    return getBookingsForDate(date).length;
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // Check if date is in the past
  const isPast = (date: Date): boolean => {
    return date < today;
  };

  // Check if date is closed
  const isClosed = (date: Date): boolean => {
    if (!settings) return false;
    return isDayClosed(date, settings);
  };

  // Generate calendar days for current month
  const getCalendarDays = (): Date[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Get day of week for first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfWeek = (): number => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    // Convert to Monday = 0, Sunday = 6
    const day = firstDay.getDay();
    return day === 0 ? 6 : day - 1;
  };

  const calendarDays = getCalendarDays();
  const firstDayOfWeek = getFirstDayOfWeek();
  const monthName = currentMonth.toLocaleDateString("en-GB", { month: "long" });
  
  // Calculate number of rows needed for the calendar
  const totalCells = firstDayOfWeek + calendarDays.length;
  const numberOfRows = Math.ceil(totalCells / 7);

  // Get bookings for selected date
  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4 md:mb-6 space-y-3 flex-shrink-0">
        {/* Online Booking Rules Panel */}
        {settings && (
          <div className="bg-white rounded border border-gray-200">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <h3 className="text-base font-semibold leading-[22px]">Online booking rules</h3>
              <button
                onClick={() => router.push('/admin/diary/rules')}
                className="text-sm font-semibold text-[#02788D] no-underline"
              >
                Edit
              </button>
            </div>
            
            {/* Values Section - Mobile (single row, 3 columns) */}
            <div className="lg:hidden px-4 py-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-xs font-normal leading-[18px] text-gray-600 mb-1">
                    Minimum notice
                  </div>
                  <div className="text-sm font-semibold leading-[18px] text-gray-900">
                    {settings.lead_time_days === 1 ? '1 day' : `${settings.lead_time_days} days`}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-normal leading-[18px] text-gray-600 mb-1">
                    Daily limit
                  </div>
                  <div className="text-sm font-semibold leading-[18px] text-gray-900">
                    {settings.daily_booking_limit === 1 ? '1 per day' : `${settings.daily_booking_limit} per day`}
                  </div>
                </div>
                {nextAvailableDate && (
                  <div>
                    <div className="text-xs font-normal leading-[18px] text-gray-600 mb-1">
                      Next bookable
                    </div>
                    <div className="text-sm font-semibold leading-[18px] text-gray-900">
                      {nextAvailableDate}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Values Section - Desktop (1 row) */}
            <div className="hidden lg:flex lg:items-center lg:justify-between lg:px-4 lg:py-3 lg:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal leading-[18px] text-gray-600">Minimum notice</span>
                <span className="text-sm font-semibold leading-[18px] text-gray-900">
                  {settings.lead_time_days === 1 ? '1 day' : `${settings.lead_time_days} days`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal leading-[18px] text-gray-600">Daily limit</span>
                <span className="text-sm font-semibold leading-[18px] text-gray-900">
                  {settings.daily_booking_limit === 1 ? '1 per day' : `${settings.daily_booking_limit} per day`}
                </span>
              </div>
              {nextAvailableDate && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-normal leading-[18px] text-gray-600">Next bookable</span>
                  <span className="text-sm font-semibold leading-[18px] text-gray-900">
                    {nextAvailableDate}
                  </span>
                </div>
              )}
            </div>
            
            {/* Note at bottom */}
            <div className="px-4 pb-3">
              <p className="text-xs text-gray-500">These settings only apply to online bookings.</p>
            </div>
          </div>
        )}
        
        {/* Month Navigation */}
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleMonthChange("prev")}
            className="px-2 py-1 text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center"
          >
            ‹
          </button>
          <h2 className="text-xs sm:text-sm font-bold text-gray-600 flex items-center">{monthName}</h2>
          <button
            onClick={() => handleMonthChange("next")}
            className="px-2 py-1 text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center"
          >
            ›
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="w-full flex-1 min-h-0 flex flex-col">
        <div 
          className="grid grid-cols-7 gap-1 sm:gap-2 flex-1 min-h-0"
          style={{ 
            gridTemplateRows: `auto repeat(${numberOfRows}, 1fr)`,
          }}
        >
          {/* Day headers */}
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
            <div key={`${day}-${index}`} className="text-xs sm:text-sm font-bold text-gray-600 py-1 sm:py-2 pl-1 sm:pl-2 flex items-center">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Calendar days */}
          {calendarDays.map((date) => {
            const count = getBookingCount(date);
            const dayIsToday = isToday(date);
            const dayIsPast = isPast(date);
            const dayIsClosed = isClosed(date);
            const dayIsSelected = selectedDate && 
              date.getFullYear() === selectedDate.getFullYear() &&
              date.getMonth() === selectedDate.getMonth() &&
              date.getDate() === selectedDate.getDate();

            // Determine styling classes
            let dayClasses = "border rounded p-1 sm:p-2 cursor-pointer transition-colors flex flex-col justify-between overflow-hidden ";
            
            if (dayIsClosed) {
              dayClasses += "bg-gray-100 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.05)_10px,rgba(0,0,0,0.05)_20px)] ";
              if (dayIsPast) {
                dayClasses += "opacity-60 ";
              }
            } else {
              dayClasses += "bg-white ";
              if (dayIsPast) {
                dayClasses += "opacity-60 text-gray-400 ";
              }
            }

            dayClasses += "border-gray-200 ";

            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDayClick(date)}
                className={dayClasses}
              >
                <div className="flex items-center gap-1">
                  <div className="text-xs sm:text-sm font-medium">{date.getDate()}</div>
                  {dayIsToday && (
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-800 rounded-full flex-shrink-0" />
                  )}
                </div>
                {count > 0 && (
                  <div className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded whitespace-nowrap mt-1 w-fit ${
                    dayIsClosed || dayIsPast
                      ? "bg-gray-300 text-gray-600"
                      : "bg-gray-700 text-white"
                  }`}>
                    {count}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Panel Overlay */}
      {selectedDate && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-30"
            onClick={() => {
              setSelectedDate(null);
              const year = currentMonth.getFullYear();
              const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
              router.push(`/admin/diary?month=${year}-${month}`);
            }}
          />
          <DiaryDayPanel
            isOpen={!!selectedDate}
            date={selectedDate}
            bookings={selectedDateBookings}
            currentMonth={currentMonth}
            onClose={() => {
              setSelectedDate(null);
              const year = currentMonth.getFullYear();
              const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
              router.push(`/admin/diary?month=${year}-${month}`);
            }}
            onBookingDeleted={handleBookingDeleted}
          />
        </>
      )}
    </div>
  );
}

export default function DiaryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <DiaryPageContent />
    </Suspense>
  );
}
