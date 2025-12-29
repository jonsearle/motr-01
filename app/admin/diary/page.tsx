"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBookingsByMonth, getBookingSettings, upsertBookingSettings, getBookingsByDateRange } from "@/lib/db";
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
  const [savingLeadTime, setSavingLeadTime] = useState(false);
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

  const handleCreateBooking = () => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    router.push(`/admin/diary/create?month=${year}-${month}`);
  };

  const handleBookingDeleted = () => {
    // Reload bookings
    loadData();
  };

  const handleLeadTimeChange = async (delta: number) => {
    if (!settings) return;
    
    const newLeadTimeDays = Math.max(1, settings.lead_time_days + delta);
    if (newLeadTimeDays === settings.lead_time_days) return;

    try {
      setSavingLeadTime(true);
      const updatedSettings: BookingSettings = {
        ...settings,
        lead_time_days: newLeadTimeDays,
      };
      const savedSettings = await upsertBookingSettings(updatedSettings);
      setSettings(savedSettings);
      
      // Recalculate next available date
      const nextDate = getNextAvailableOnlineBookingDate(savedSettings, futureBookings);
      setNextAvailableDate(nextDate);
    } catch (error) {
      console.error("Error updating lead time:", error);
    } finally {
      setSavingLeadTime(false);
    }
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
        {/* Desktop: Top row layout */}
        <div className="hidden lg:flex lg:items-start lg:justify-between lg:gap-4">
          {/* Left side: Title and Add booking button */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Your Diary</h1>
            <button
              onClick={handleCreateBooking}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span>
              <span>Add booking</span>
            </button>
          </div>
          
          {/* Right side: Combined Info Panel */}
          {settings && (
            <div className="flex items-start bg-gray-50 rounded border border-gray-200 divide-x divide-gray-300">
              {/* Online Booking Notice Control */}
              <div className="px-4 py-2">
                <div className="text-sm text-gray-600 mb-1">Advance booking</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLeadTimeChange(-1)}
                    disabled={savingLeadTime || settings.lead_time_days <= 1}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100 font-medium text-base leading-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    −
                  </button>
                  <span className="text-base font-medium min-w-[4rem] text-center">
                    {settings.lead_time_days === 1 ? '1 day' : `${settings.lead_time_days} days`}
                  </span>
                  <button
                    onClick={() => handleLeadTimeChange(1)}
                    disabled={savingLeadTime}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100 font-medium text-base leading-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Next Available Online Booking */}
              {nextAvailableDate && (
                <div className="px-4 py-2">
                  <div className="text-sm text-gray-600 mb-1">Next available</div>
                  <div className="text-base font-medium">{nextAvailableDate}</div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Desktop: Month Navigation (separate row) */}
        <div className="hidden lg:flex lg:items-center lg:justify-end gap-2">
          <button
            onClick={() => handleMonthChange("prev")}
            className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            ‹
          </button>
          <h2 className="text-lg font-medium">{monthName}</h2>
          <button
            onClick={() => handleMonthChange("next")}
            className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            ›
          </button>
        </div>

        {/* Tablet/Mobile: Two row layout */}
        <div className="lg:hidden space-y-3">
          {/* Row 1: Title and Create Booking Button */}
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">Your Diary</h1>
            <button
              onClick={handleCreateBooking}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xl leading-none"
              aria-label="Add booking"
            >
              +
            </button>
          </div>
          
          {/* Row 2: Online Booking Notice and Next Available */}
          {settings && (
            <div className="flex items-start gap-3">
              <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 flex-1">
                <div className="text-xs text-gray-600 mb-1">Advance booking</div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleLeadTimeChange(-1)}
                    disabled={savingLeadTime || settings.lead_time_days <= 1}
                    className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100 font-medium text-xs leading-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    −
                  </button>
                  <span className="text-sm font-medium min-w-[3.5rem] text-center">
                    {settings.lead_time_days === 1 ? '1 day' : `${settings.lead_time_days} days`}
                  </span>
                  <button
                    onClick={() => handleLeadTimeChange(1)}
                    disabled={savingLeadTime}
                    className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100 font-medium text-xs leading-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {nextAvailableDate && (
                <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 flex-1">
                  <div className="text-xs text-gray-600 mb-1">Next available</div>
                  <div className="text-sm font-medium">{nextAvailableDate}</div>
                </div>
              )}
            </div>
          )}
          
          {/* Month Navigation */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleMonthChange("prev")}
              className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              ‹
            </button>
            <h2 className="text-lg font-medium">{monthName}</h2>
            <button
              onClick={() => handleMonthChange("next")}
              className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              ›
            </button>
          </div>
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
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-600 py-1 sm:py-2 flex items-center justify-center">
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

            if (dayIsToday) {
              dayClasses += "border-2 border-gray-800 ";
            } else {
              dayClasses += "border-gray-200 ";
            }

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
