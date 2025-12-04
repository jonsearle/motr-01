"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase-client";
import type { BookingSettings, OpeningDay } from "@/types/db";

const DAYS_OF_WEEK: Array<{
  key: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  label: string;
  shortLabel: string;
}> = [
  { key: 'monday', label: 'Monday', shortLabel: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', shortLabel: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', shortLabel: 'Wed' },
  { key: 'thursday', label: 'Thursday', shortLabel: 'Thu' },
  { key: 'friday', label: 'Friday', shortLabel: 'Fri' },
  { key: 'saturday', label: 'Saturday', shortLabel: 'Sat' },
  { key: 'sunday', label: 'Sunday', shortLabel: 'Sun' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

// Helper to create default opening day
const createDefaultOpeningDay = (dayOfWeek: typeof DAYS_OF_WEEK[0]['key']): OpeningDay => ({
  day_of_week: dayOfWeek,
  is_open: false,
  business_open_time: '09:00',
  business_close_time: '17:00',
  dropoff_from_time: '07:00',
  dropoff_to_time: '09:00',
});

// Helper to parse time string to hours and minutes
const parseTime = (time: string): { hour: string; minute: string } => {
  const [hour, minute] = time.split(':');
  return {
    hour: hour || '09',
    minute: minute || '00',
  };
};

// Helper to format time from hour and minute
const formatTime = (hour: string, minute: string): string => {
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [notificationName, setNotificationName] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  
  const [openingDays, setOpeningDays] = useState<OpeningDay[]>([]);
  const [leadTimeDays, setLeadTimeDays] = useState(0);
  const [dailyBookingLimit, setDailyBookingLimit] = useState(3);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    try {
      loadSettings();
    } catch (err) {
      console.error('Error in useEffect:', err);
      setError('Failed to initialize settings. Please refresh the page.');
      setLoading(false);
    }
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading settings...');
      
      // Use Supabase client directly
      let supabase;
      try {
        supabase = getSupabaseClient();
      } catch (clientError) {
        const errorMsg = clientError instanceof Error ? clientError.message : 'Failed to initialize Supabase client';
        throw new Error(errorMsg);
      }
      const { data, error } = await supabase
        .from('booking_settings')
        .select('*')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - this is OK, we'll use defaults
          console.log('No settings found, initializing with defaults');
          const defaultDays = DAYS_OF_WEEK.map(day => createDefaultOpeningDay(day.key));
          setOpeningDays(defaultDays);
          setLoading(false);
          return;
        }
        throw error;
      }
      
      const settings = data as BookingSettings | null;
      console.log('Settings loaded:', settings);
      
      if (settings) {
        setSettingsId(settings.id);
        setNotificationName(settings.notification_name || '');
        setNotificationEmail(settings.notification_email || '');
        setLeadTimeDays(settings.lead_time_days || 0);
        setDailyBookingLimit(settings.daily_booking_limit || 3);
        
        // Ensure we have all 7 days
        const daysMap = new Map(settings.opening_days.map((d: OpeningDay) => [d.day_of_week, d]));
        const allDays = DAYS_OF_WEEK.map(day => 
          daysMap.get(day.key) || createDefaultOpeningDay(day.key)
        );
        setOpeningDays(allDays);
      } else {
        // No settings exist - initialize with defaults
        console.log('No settings found, initializing with defaults');
        const defaultDays = DAYS_OF_WEEK.map(day => createDefaultOpeningDay(day.key));
        setOpeningDays(defaultDays);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings. Please try again.';
      setError(`Failed to load settings: ${errorMessage}`);
      console.error('Error loading settings:', err);
      
      // Initialize with defaults even on error so user can still use the form
      const defaultDays = DAYS_OF_WEEK.map(day => createDefaultOpeningDay(day.key));
      setOpeningDays(defaultDays);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    setEmailError(null);
    
    if (!notificationName.trim()) {
      setError('Notification name is required');
      return false;
    }
    
    if (!notificationEmail.trim()) {
      setError('Notification email is required');
      return false;
    }
    
    if (!validateEmail(notificationEmail)) {
      setEmailError('Please enter a valid email address');
      setError('Please fix validation errors');
      return false;
    }

    // Validate drop-off windows are within business hours for each open day
    for (const day of openingDays) {
      if (day.is_open) {
        const openTime = parseTime(day.business_open_time);
        const closeTime = parseTime(day.business_close_time);
        const dropoffFrom = parseTime(day.dropoff_from_time);
        const dropoffTo = parseTime(day.dropoff_to_time);
        
        const openMinutes = parseInt(openTime.hour) * 60 + parseInt(openTime.minute);
        const closeMinutes = parseInt(closeTime.hour) * 60 + parseInt(closeTime.minute);
        const fromMinutes = parseInt(dropoffFrom.hour) * 60 + parseInt(dropoffFrom.minute);
        const toMinutes = parseInt(dropoffTo.hour) * 60 + parseInt(dropoffTo.minute);
        
        if (fromMinutes < openMinutes || toMinutes > closeMinutes || fromMinutes >= toMinutes) {
          setError(`Drop-off window for ${day.day_of_week} must be within business hours`);
          return false;
        }
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const settings: BookingSettings = {
        id: settingsId || '',
        notification_name: notificationName.trim(),
        notification_email: notificationEmail.trim(),
        lead_time_days: leadTimeDays,
        lead_time_basis: 'working_days',
        timezone: 'Europe/London',
        daily_booking_limit: dailyBookingLimit,
        opening_days: openingDays,
        created_at: settingsId ? new Date().toISOString() : new Date().toISOString(),
      };

      // Use Supabase client directly
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('booking_settings')
        .upsert(settings as any, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const saved = data as BookingSettings;
      setSettingsId(saved.id);
      setSuccess('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayKey: typeof DAYS_OF_WEEK[0]['key']) => {
    setOpeningDays(prev => prev.map(day => 
      day.day_of_week === dayKey 
        ? { ...day, is_open: !day.is_open }
        : day
    ));
  };

  const updateDayTime = (
    dayKey: typeof DAYS_OF_WEEK[0]['key'],
    field: 'business_open_time' | 'business_close_time' | 'dropoff_from_time' | 'dropoff_to_time',
    hour: string,
    minute: string
  ) => {
    const time = formatTime(hour, minute);
    setOpeningDays(prev => prev.map(day =>
      day.day_of_week === dayKey
        ? { ...day, [field]: time }
        : day
    ));
  };

  const openDays = openingDays.filter(day => day.is_open);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Booking Alerts Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Booking alerts</h2>
        <p className="text-sm text-gray-600 mb-4">Who should we alert if you get an online booking?</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={notificationName}
              onChange={(e) => setNotificationName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => {
                setNotificationEmail(e.target.value);
                setEmailError(null);
              }}
              onBlur={() => {
                if (notificationEmail && !validateEmail(notificationEmail)) {
                  setEmailError('Please enter a valid email address');
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                emailError ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter email"
            />
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
          </div>
        </div>
      </section>

      {/* Business Hours Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Business Hours</h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Days</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Open</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Close</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {DAYS_OF_WEEK.map((dayInfo) => {
                const day = openingDays.find(d => d.day_of_week === dayInfo.key)!;
                const openTime = parseTime(day.business_open_time);
                const closeTime = parseTime(day.business_close_time);
                
                return (
                  <tr key={dayInfo.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleDay(dayInfo.key)}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          day.is_open
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {day.is_open && <span className="mr-1">✓</span>}
                        {dayInfo.label}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {day.is_open ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={openTime.hour}
                            onChange={(e) => updateDayTime(dayInfo.key, 'business_open_time', e.target.value, openTime.minute)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {HOURS.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <span>:</span>
                          <select
                            value={openTime.minute}
                            onChange={(e) => updateDayTime(dayInfo.key, 'business_open_time', openTime.hour, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {MINUTES.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {day.is_open ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={closeTime.hour}
                            onChange={(e) => updateDayTime(dayInfo.key, 'business_close_time', e.target.value, closeTime.minute)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {HOURS.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <span>:</span>
                          <select
                            value={closeTime.minute}
                            onChange={(e) => updateDayTime(dayInfo.key, 'business_close_time', closeTime.hour, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {MINUTES.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Advance Booking Notice Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Advance booking notice</h2>
        <p className="text-sm text-gray-600 mb-4">Customers must book online at least</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLeadTimeDays(Math.max(0, leadTimeDays - 1))}
            className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 font-medium"
          >
            −
          </button>
          <input
            type="number"
            value={leadTimeDays}
            onChange={(e) => setLeadTimeDays(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-20 px-3 py-1.5 border border-gray-300 rounded text-center"
            min="0"
          />
          <button
            type="button"
            onClick={() => setLeadTimeDays(leadTimeDays + 1)}
            className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 font-medium"
          >
            +
          </button>
          <span className="text-sm text-gray-600">working days in advance.</span>
        </div>
      </section>

      {/* Daily Booking Limit Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Daily booking limit</h2>
        <p className="text-sm text-gray-600 mb-4">Limit bookings to</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDailyBookingLimit(Math.max(1, dailyBookingLimit - 1))}
            className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 font-medium"
          >
            −
          </button>
          <input
            type="number"
            value={dailyBookingLimit}
            onChange={(e) => setDailyBookingLimit(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-3 py-1.5 border border-gray-300 rounded text-center"
            min="1"
          />
          <button
            type="button"
            onClick={() => setDailyBookingLimit(dailyBookingLimit + 1)}
            className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 font-medium"
          >
            +
          </button>
          <span className="text-sm text-gray-600">per day.</span>
        </div>
      </section>

      {/* Drop Off Times Section */}
      {openDays.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Drop off times</h2>
          <p className="text-sm text-gray-600 mb-4">
            Ask customers to drop off their vehicles between these times when booking online:
          </p>
          <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Days</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">From</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {openDays.map((day) => {
                  const dayInfo = DAYS_OF_WEEK.find(d => d.key === day.day_of_week)!;
                  const fromTime = parseTime(day.dropoff_from_time);
                  const toTime = parseTime(day.dropoff_to_time);
                  
                  return (
                    <tr key={day.day_of_week} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">
                        {dayInfo.shortLabel}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <select
                            value={fromTime.hour}
                            onChange={(e) => updateDayTime(day.day_of_week, 'dropoff_from_time', e.target.value, fromTime.minute)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {HOURS.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <span>:</span>
                          <select
                            value={fromTime.minute}
                            onChange={(e) => updateDayTime(day.day_of_week, 'dropoff_from_time', fromTime.hour, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {MINUTES.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <select
                            value={toTime.hour}
                            onChange={(e) => updateDayTime(day.day_of_week, 'dropoff_to_time', e.target.value, toTime.minute)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {HOURS.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <span>:</span>
                          <select
                            value={toTime.minute}
                            onChange={(e) => updateDayTime(day.day_of_week, 'dropoff_to_time', toTime.hour, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {MINUTES.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Save Button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            saving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
