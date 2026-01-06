"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBookingSettings, upsertBookingSettings, getBookingsByDateRange } from "@/lib/db";
import { getNextAvailableOnlineBookingDate } from "@/lib/business-hours";
import type { BookingSettings } from "@/types/db";
import toast from "react-hot-toast";

// Stepper component for number inputs
function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
}: {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
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
        className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease"
      >
        <span className="text-lg font-normal text-gray-700">−</span>
      </button>
      <span className="text-base font-semibold text-gray-900 min-w-[3rem] text-center">
        {value}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Increase"
      >
        <span className="text-lg font-normal text-gray-700">+</span>
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
      setNextAvailableDate(nextDate);
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
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-gray-900 mb-2">
            Edit online booking rules
          </h1>
          <p className="text-sm font-normal leading-5 text-gray-600">
            These rules control when customers can book online.
            <br />
            You can always add bookings manually.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 mb-12">
          {/* Rule 1 - Minimum booking notice */}
          <div className="space-y-3">
            <label className="block text-base font-semibold text-gray-900">
              Minimum booking notice
            </label>
            <p className="text-sm font-normal leading-5 text-gray-600">
              Customers must book at least this far in advance.
            </p>
            <div className="flex items-center gap-3">
              <Stepper
                value={leadTimeDays}
                onChange={setLeadTimeDays}
                min={1}
                max={365}
              />
              <span className="text-base font-semibold text-gray-900">
                {leadTimeDays === 1 ? "day" : "days"}
              </span>
            </div>
          </div>

          {/* Rule 2 - Daily booking limit */}
          <div className="space-y-3">
            <label className="block text-base font-semibold text-gray-900">
              Daily booking limit
            </label>
            <p className="text-sm font-normal leading-5 text-gray-600">
              Online bookings pause once this number is reached for the day.
            </p>
            <div className="flex items-center gap-3">
              <Stepper
                value={dailyBookingLimit}
                onChange={setDailyBookingLimit}
                min={1}
                max={999}
              />
              <span className="text-base font-semibold text-gray-900">
                {dailyBookingLimit === 1 ? "booking per day" : "bookings per day"}
              </span>
            </div>
          </div>

          {/* Derived information - Next bookable date */}
          <div className="pt-6 border-t border-gray-200 space-y-2">
            <div className="text-sm font-normal text-gray-600">
              Next bookable date
            </div>
            <div className="text-base font-semibold text-gray-900">
              {nextAvailableDate || "Calculating..."}
            </div>
            <p className="text-[13px] font-normal text-gray-500">
              Updates automatically based on your rules and availability.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
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

