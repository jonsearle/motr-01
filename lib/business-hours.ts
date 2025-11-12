import type { BookingSettings, OpeningDay } from '@/types/db';

/**
 * Converts 24-hour time string (HH:MM) to 12-hour format with am/pm
 * Examples: "08:00" -> "8am", "14:30" -> "2:30pm", "12:00" -> "12pm"
 */
export function formatTime12Hour(time24Hour: string): string {
  const [hours, minutes] = time24Hour.split(':').map(Number);
  const hour12 = hours % 12 || 12;
  const ampm = hours < 12 ? 'am' : 'pm';
  const minuteStr = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
  return `${hour12}${minuteStr}${ampm}`;
}

/**
 * Gets the day name from a day_of_week value
 */
function getDayName(dayOfWeek: OpeningDay['day_of_week']): string {
  const dayNames: Record<OpeningDay['day_of_week'], string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };
  return dayNames[dayOfWeek];
}

/**
 * Gets the day of week as a number (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * for the current date in the specified timezone
 */
function getCurrentDayOfWeek(timezone: string): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  });
  const dayName = formatter.format(now).toLowerCase();
  
  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  
  return dayMap[dayName] ?? 1; // Default to Monday if unknown
}

/**
 * Gets the current time in HH:MM format in the specified timezone
 */
function getCurrentTime(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(now);
}

/**
 * Converts day_of_week string to a number (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
function dayOfWeekToNumber(dayOfWeek: OpeningDay['day_of_week']): number {
  const dayMap: Record<OpeningDay['day_of_week'], number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return dayMap[dayOfWeek];
}

/**
 * Compares two time strings (HH:MM format)
 * Returns: -1 if time1 < time2, 0 if equal, 1 if time1 > time2
 */
function compareTimes(time1: string, time2: string): number {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;
  if (minutes1 < minutes2) return -1;
  if (minutes1 > minutes2) return 1;
  return 0;
}

/**
 * Determines if the garage is currently open based on booking settings
 */
export function isCurrentlyOpen(settings: BookingSettings, timezone: string = 'Europe/London'): boolean {
  const currentDayOfWeek = getCurrentDayOfWeek(timezone);
  const currentTime = getCurrentTime(timezone);
  
  // Find today's opening day configuration
  const dayNames: OpeningDay['day_of_week'][] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDayName = dayNames[currentDayOfWeek];
  
  const todayOpening = settings.opening_days.find(
    (day) => day.day_of_week === todayDayName
  );
  
  if (!todayOpening || !todayOpening.is_open) {
    return false;
  }
  
  // Check if current time is within business hours
  const openTime = todayOpening.business_open_time;
  const closeTime = todayOpening.business_close_time;
  
  const isAfterOpen = compareTimes(currentTime, openTime) >= 0;
  const isBeforeClose = compareTimes(currentTime, closeTime) < 0;
  
  return isAfterOpen && isBeforeClose;
}

/**
 * Gets the next opening time and day
 * Returns: { time: string (12-hour format), day: string | null }
 * - If next open day is tomorrow, day is null
 * - Otherwise, day is the day name (e.g., "Monday")
 */
export function getNextOpeningTime(
  settings: BookingSettings,
  timezone: string = 'Europe/London'
): { time: string; day: string | null } {
  const currentDayOfWeek = getCurrentDayOfWeek(timezone);
  const currentTime = getCurrentTime(timezone);
  
  const dayNames: OpeningDay['day_of_week'][] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Always start by checking tomorrow first
  const tomorrowDayOfWeek = (currentDayOfWeek + 1) % 7;
  const tomorrowDayName = dayNames[tomorrowDayOfWeek];
  const tomorrowOpening = settings.opening_days.find(
    (day) => day.day_of_week === tomorrowDayName
  );
  
  // If tomorrow is open, return tomorrow's opening time
  if (tomorrowOpening?.is_open) {
    return {
      time: formatTime12Hour(tomorrowOpening.business_open_time),
      day: null, // Tomorrow
    };
  }
  
  // Find the next open day after tomorrow
  let daysToCheck = 6; // Check up to 6 days ahead (skip tomorrow, already checked)
  let dayOffset = 2; // Start with day after tomorrow
  
  while (daysToCheck > 0) {
    const checkDayOfWeek = (currentDayOfWeek + dayOffset) % 7;
    const checkDayName = dayNames[checkDayOfWeek];
    const checkOpening = settings.opening_days.find(
      (day) => day.day_of_week === checkDayName
    );
    
    if (checkOpening?.is_open) {
      return {
        time: formatTime12Hour(checkOpening.business_open_time),
        day: getDayName(checkDayName),
      };
    }
    
    dayOffset++;
    daysToCheck--;
  }
  
  // Fallback: if no open day found, return first open day from settings
  const firstOpenDay = settings.opening_days.find((day) => day.is_open);
  if (firstOpenDay) {
    return {
      time: formatTime12Hour(firstOpenDay.business_open_time),
      day: getDayName(firstOpenDay.day_of_week),
    };
  }
  
  // Last resort: return a default
  return {
    time: '9am',
    day: null,
  };
}

