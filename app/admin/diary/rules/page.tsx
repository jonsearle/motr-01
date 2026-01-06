"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBookingSettings, upsertBookingSettings, getBookingsByDateRange } from "@/lib/db";
import { getNextAvailableOnlineBookingDate, getNextAvailableOnlineBookingDateObject, formatDateForDisplayFull } from "@/lib/business-hours";
import type { BookingSettings } from "@/types/db";
import toast from "react-hot-toast";

// Stepper component for number inputs
function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
}: {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-10 h-10 flex items-center justify-center border border-[#0278BD] rounded bg-transparent hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease"
      >
        <span className="text-base font-semibold text-[#0278BD]">−</span>
      </button>
      <span className="text-base font-semibold text-gray-900 min-w-[5rem] text-center">
        {value}{label ? ` ${label}` : ''}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center border border-[#0278BD] rounded bg-transparent hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Increase"
      >
        <span className="text-base font-semibold text-[#0278BD]">+</span>
      </button>
    </div>
  );
}

export default function EditRulesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [leadTimeDays, setLeadTimeDays] = useState(0);
  const [dailyBookingLimit, setDailyBookingLimit] = useState(0);
  const [nextAvailableDate, setNextAvailableDate] = useState<string | null>(null);
  const [nextAvailableDateObject, setNextAvailableDateObject] = useState<Date | null>(null);
  const [futureBookings, setFutureBookings] = useState<any[]>([]);

  // Load settings and calculate next available date
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const settingsData = await getBookingSettings();
        
        if (!settingsData) {
          toast.error("Booking settings not found");
          router.back();
          return;
        }

        setSettings(settingsData);
        // Ensure minimum booking notice is at least 1 day
        setLeadTimeDays(Math.max(1, settingsData.lead_time_days));
        // Ensure daily booking limit is at least 1
        setDailyBookingLimit(Math.max(1, settingsData.daily_booking_limit));

        // Load future bookings for next available date calculation
        const today = new Date();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6);
        const startDateStr = today.toISOString().split('T')[0];
        const endDateStr = futureDate.toISOString().split('T')[0];
        
        const bookingsData = await getBookingsByDateRange(startDateStr, endDateStr);
        setFutureBookings(bookingsData);
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load booking settings");
        router.back();
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Recalculate next available date when values change
  useEffect(() => {
    if (settings && futureBookings.length >= 0) {
      const updatedSettings: BookingSettings = {
        ...settings,
        lead_time_days: leadTimeDays,
        daily_booking_limit: dailyBookingLimit,
      };
      const nextDate = getNextAvailableOnlineBookingDate(updatedSettings, futureBookings);
      const nextDateObject = getNextAvailableOnlineBookingDateObject(updatedSettings, futureBookings);
      setNextAvailableDate(nextDate);
      setNextAvailableDateObject(nextDateObject);
    }
  }, [leadTimeDays, dailyBookingLimit, settings, futureBookings]);

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const updatedSettings: BookingSettings = {
        ...settings,
        lead_time_days: leadTimeDays,
        daily_booking_limit: dailyBookingLimit,
      };
      
      await upsertBookingSettings(updatedSettings);
      toast.success("Booking rules updated successfully");
      router.back();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save booking rules");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-gray-900 mb-2">
            Edit online booking rules
          </h1>
          <p className="text-sm font-normal leading-5 text-gray-600">
            These rules control when customers can book online.
            <br />
            You can still add bookings manually at any time.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 mb-12">
          {/* Rule 1 - Minimum booking notice */}
          <div>
            <label className="block text-base font-semibold text-gray-900">
              Minimum booking notice
            </label>
            <p className="text-sm font-normal leading-5 text-gray-600 mt-1">
              Customers must book this many days in advance.
            </p>
            <div className="mt-3">
              <Stepper
                value={leadTimeDays}
                onChange={setLeadTimeDays}
                min={1}
                max={365}
                label={leadTimeDays === 1 ? "day" : "days"}
              />
            </div>
          </div>

          {/* Rule 2 - Daily booking limit */}
          <div className="pb-4">
            <label className="block text-base font-semibold text-gray-900">
              Daily booking limit
            </label>
            <p className="text-sm font-normal leading-5 text-gray-600 mt-1">
              Once a day reaches this number of bookings, it will no longer be available for online booking.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Stepper
                value={dailyBookingLimit}
                onChange={setDailyBookingLimit}
                min={1}
                max={999}
              />
            </div>
          </div>

          {/* Derived information - Customers can book online from */}
          <div className="border-t border-gray-200">
            <div className="py-4 flex flex-col items-start">
              <div className="text-sm font-normal text-gray-600 -mb-0.5">
                Customers can book online from
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {nextAvailableDate && settings
                  ? (nextAvailableDate === 'Tomorrow' 
                      ? 'Tomorrow' 
                      : nextAvailableDateObject 
                        ? formatDateForDisplayFull(nextAvailableDateObject, settings.timezone)
                        : nextAvailableDate)
                  : "Calculating..."}
              </div>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <p className="text-xs font-normal italic text-gray-500">
                This date updates automatically using your rules and bookings.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

