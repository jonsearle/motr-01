import type { BookingSettings, OpeningDay, Booking } from '@/types/db';

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

/**
 * Gets the day of week name from a Date object
 * Returns: day_of_week string (e.g., "monday", "tuesday")
 */
export function getDayOfWeekFromDate(date: Date, timezone: string = 'Europe/London'): OpeningDay['day_of_week'] {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  });
  const dayName = formatter.format(date).toLowerCase();
  
  // Map to our day_of_week type
  const dayMap: Record<string, OpeningDay['day_of_week']> = {
    sunday: 'sunday',
    monday: 'monday',
    tuesday: 'tuesday',
    wednesday: 'wednesday',
    thursday: 'thursday',
    friday: 'friday',
    saturday: 'saturday',
  };
  
  return dayMap[dayName] ?? 'monday'; // Default to Monday if unknown
}

/**
 * Checks if a specific date is closed based on booking settings
 */
export function isDayClosed(date: Date, settings: BookingSettings, timezone: string = 'Europe/London'): boolean {
  const dayOfWeek = getDayOfWeekFromDate(date, timezone);
  const dayConfig = settings.opening_days.find(day => day.day_of_week === dayOfWeek);
  return !dayConfig || !dayConfig.is_open;
}

/**
 * Formats a date for display as "Mon 01 Jan"
 */
export function formatDateForDisplay(date: Date, timezone: string = 'Europe/London'): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
  // Remove any commas that might be added by the formatter
  return formatter.format(date).replace(/,/g, '');
}

/**
 * Formats a date for display as "Friday 5 January" (full weekday name)
 */
export function formatDateForDisplayFull(date: Date, timezone: string = 'Europe/London'): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return formatter.format(date);
}

/**
 * Gets current date in the specified timezone (date only, no time)
 */
function getCurrentDateInTimezone(timezone: string = 'Europe/London'): Date {
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
}

/**
 * Counts working days from today to a given date (in garage timezone)
 * Today counts as day 0, tomorrow is day 1, etc.
 * Only counts days when the garage is open
 */
function countWorkingDaysToDate(date: Date, settings: BookingSettings): number {
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
    if (!isDayClosed(currentDate, settings, settings.timezone)) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
}

/**
 * Checks if a date is within the lead time window (too soon to book)
 */
function isWithinLeadTime(date: Date, settings: BookingSettings): boolean {
  if (settings.lead_time_days === 0) return false;
  
  const workingDays = countWorkingDaysToDate(date, settings);
  return workingDays < settings.lead_time_days;
}

/**
 * Checks if a date has reached its daily booking limit
 */
function isFullyBooked(date: Date, settings: BookingSettings, bookings: Booking[]): boolean {
  if (settings.daily_booking_limit === 0) return false;
  
  // Format date as YYYY-MM-DD string
  const dateStr = date.toISOString().split('T')[0];
  
  // Count bookings for this date
  const bookingsForDate = bookings.filter(booking => booking.date === dateStr);
  
  return bookingsForDate.length >= settings.daily_booking_limit;
}

/**
 * Checks if a date is in the past (in garage timezone)
 */
function isDateInPast(date: Date, timezone: string = 'Europe/London'): boolean {
  const today = getCurrentDateInTimezone(timezone);
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return compareDate < compareToday;
}

/**
 * Checks if a date is available for booking (not past, not closed, not within lead time, not fully booked)
 */
function isDateAvailable(date: Date, settings: BookingSettings, bookings: Booking[]): boolean {
  const isPast = isDateInPast(date, settings.timezone);
  const isClosed = isDayClosed(date, settings, settings.timezone);
  const isWithinLeadTimeWindow = isWithinLeadTime(date, settings);
  const isFullyBookedDate = isFullyBooked(date, settings, bookings);
  
  return !isPast && !isClosed && !isWithinLeadTimeWindow && !isFullyBookedDate;
}

/**
 * Calculates the next available online booking date
 * Takes into account lead_time_days (working days) and fully booked dates
 * Returns the formatted date string like "Friday 5 January"
 * Note: This function uses the provided bookings array. For accurate results,
 * ensure bookings includes at least a few months of future bookings.
 */
export function getNextAvailableOnlineBookingDate(
  settings: BookingSettings,
  bookings: Booking[]
): string | null {
  if (!settings) return null;

  const today = getCurrentDateInTimezone(settings.timezone);
  let searchDate = new Date(today);
  
  // Start from tomorrow (today is day 0, so we start from day 1)
  // If lead_time_days is 0, today would be available, but typically we want at least tomorrow
  // The isDateAvailable function will check if the date is within lead time
  if (settings.lead_time_days === 0) {
    // Start from today if lead_time_days is 0
    searchDate = new Date(today);
  } else {
    // Start from tomorrow (day 1)
    searchDate.setDate(today.getDate() + 1);
  }
  
  // Search for the next available date
  // isDateAvailable will check: not past, not closed, not within lead time, not fully booked
  const maxDaysToSearch = 365; // Search up to 1 year ahead
  let daysSearched = 0;
  
  while (daysSearched < maxDaysToSearch) {
    if (isDateAvailable(searchDate, settings, bookings)) {
      // Check if the found date is tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Normalize dates to compare only year, month, day
      const foundYear = searchDate.getFullYear();
      const foundMonth = searchDate.getMonth();
      const foundDay = searchDate.getDate();
      
      const tomorrowYear = tomorrow.getFullYear();
      const tomorrowMonth = tomorrow.getMonth();
      const tomorrowDay = tomorrow.getDate();
      
      if (foundYear === tomorrowYear && foundMonth === tomorrowMonth && foundDay === tomorrowDay) {
        return 'Tomorrow';
      }
      
      return formatDateForDisplay(searchDate, settings.timezone);
    }
    
    // Move to next day and continue searching
    searchDate.setDate(searchDate.getDate() + 1);
    daysSearched++;
  }
  
  // If we couldn't find an available date within 1 year, return null
  return null;
}

