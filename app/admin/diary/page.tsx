"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBookingsByMonth, getBookingSettings } from "@/lib/db";
import { isDayClosed, formatDateForDisplay } from "@/lib/business-hours";
import type { Booking, BookingSettings } from "@/types/db";
import DiaryDayPanel from "@/components/DiaryDayPanel";

export default function DiaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Initialize from URL params or use current month
    const monthParam = searchParams.get("month");
    if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number);
      return new Date(year, month - 1, 1);
    }
    return new Date();
  });
  const [today] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  // Initialize selected date from URL if present
  useEffect(() => {
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
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your Diary</h1>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleCreateBooking}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create booking
          </button>
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
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
      <div className="w-full mb-4" style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
        <div 
          className="grid grid-cols-7 gap-1 sm:gap-2 h-full"
          style={{ 
            gridTemplateRows: `auto repeat(${numberOfRows}, 1fr)`,
            height: '100%'
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
                  <div className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded whitespace-nowrap mt-1 ${
                    dayIsClosed || dayIsPast
                      ? "bg-gray-300 text-gray-600"
                      : "bg-gray-700 text-white"
                  }`}>
                    {count === 1 ? "1 Booking" : `${count} Bookings`}
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
