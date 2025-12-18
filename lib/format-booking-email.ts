import type { Booking, BookingSettings, OpeningDay } from '@/types/db'

// Day abbreviations for email subject/body
const DAY_ABBREVIATIONS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

// Full month names
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Predefined problem options from the booking form
const PREDEFINED_PROBLEMS = [
  "Car won't start",
  'Warning light came on',
  "I hear a strange noise",
  'Something smells odd',
  'I see smoke',
  'I see a leak',
]

/**
 * Converts 24-hour time format (HH:MM) to 12-hour format with am/pm
 * Examples: "09:00" -> "9:00 am", "15:30" -> "3:30 pm"
 */
function formatTime12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'pm' : 'am'
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Gets the day of week name from a date in the specified timezone
 */
function getDayOfWeekName(date: Date, timezone: string): OpeningDay['day_of_week'] {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  })
  const dayName = formatter.format(date).toLowerCase()
  return dayName as OpeningDay['day_of_week']
}

/**
 * Formats a date to "DayAbbrev DayOfMonth MonthName" format
 * Example: "Tue 9 December"
 */
function formatBookingDate(date: Date, timezone: string): string {
  const dayOfWeekName = getDayOfWeekName(date, timezone)
  const dayAbbrev = DAY_ABBREVIATIONS[dayOfWeekName] || dayOfWeekName.slice(0, 3)
  const dayOfMonth = date.getDate()
  const monthName = MONTH_NAMES[date.getMonth()]
  return `${dayAbbrev} ${dayOfMonth} ${monthName}`
}

/**
 * Gets drop-off window times for a booking date from settings
 */
function getDropOffWindow(
  bookingDate: Date,
  settings: BookingSettings
): { from: string; to: string } | null {
  const dayOfWeek = getDayOfWeekName(bookingDate, settings.timezone)
  const openingDay = settings.opening_days.find((day) => day.day_of_week === dayOfWeek)

  if (!openingDay || !openingDay.is_open) {
    return null
  }

  if (!openingDay.dropoff_from_time || !openingDay.dropoff_to_time) {
    return null
  }

  return {
    from: openingDay.dropoff_from_time,
    to: openingDay.dropoff_to_time,
  }
}

/**
 * Maps database appointment_type to email display format
 */
function mapServiceTypeForEmail(appointmentType: string): string {
  switch (appointmentType) {
    case 'MOT':
      return 'MOT'
    case 'Interim Service':
      return 'Interim service'
    case 'Full Service':
      return 'Full service'
    case 'Custom job':
      return 'Specific job'
    case 'Customer is unsure':
      return 'Customer is unsure'
    default:
      // Check if it's a predefined problem (these should map to "Customer is unsure")
      if (PREDEFINED_PROBLEMS.includes(appointmentType)) {
        return 'Customer is unsure'
      }
      // Default to the original value if unknown
      return appointmentType
  }
}

/**
 * Formats the details field based on appointment type and issue description
 */
function formatDetails(appointmentType: string, issueDescription?: string): string {
  const serviceType = mapServiceTypeForEmail(appointmentType)

  // MOT, Interim service, Full service - just show the service name
  if (serviceType === 'MOT' || serviceType === 'Interim service' || serviceType === 'Full service') {
    return serviceType
  }

  // Specific job - show the free-text description
  if (serviceType === 'Specific job' && issueDescription) {
    return issueDescription
  }

  // Customer is unsure cases
  if (serviceType === 'Customer is unsure') {
    // If it's a predefined problem, show it
    if (PREDEFINED_PROBLEMS.includes(appointmentType)) {
      return `Customer is unsure – ${appointmentType}`
    }

    // If it's "Something else" with a description
    if (issueDescription) {
      return `Customer is unsure – Other issue. Customer notes: ${issueDescription}`
    }

    // Fallback
    return 'Customer is unsure'
  }

  // Fallback: just return issue description if available
  return issueDescription || serviceType
}

export interface FormattedEmail {
  subject: string
  body: string
}

/**
 * Formats a booking notification email
 */
export function formatBookingEmail(booking: Booking, settings: BookingSettings): FormattedEmail {
  // Parse booking date in the settings timezone
  // booking.date is in YYYY-MM-DD format (date-only)
  // Parse it as a date at noon in the target timezone to avoid timezone shift issues
  const [year, month, day] = booking.date.split('-').map(Number)
  // Create date in UTC, then format using the target timezone
  const bookingDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

  // Format subject: "New booking – {DayAbbrev} {DayOfMonth} {MonthName}"
  const formattedDate = formatBookingDate(bookingDate, settings.timezone)
  const subject = `New booking – ${formattedDate}`

  // Get drop-off window
  const dropOffWindow = getDropOffWindow(bookingDate, settings)
  const dropOffFrom = dropOffWindow
    ? formatTime12Hour(dropOffWindow.from)
    : 'N/A'
  const dropOffTo = dropOffWindow ? formatTime12Hour(dropOffWindow.to) : 'N/A'

  // Map service type for display
  const serviceTypeDisplay = mapServiceTypeForEmail(booking.appointment_type)

  // Format details
  const detailsText = formatDetails(booking.appointment_type, booking.issue_description)

  // Build email body
  const lines: string[] = []

  // Greeting
  lines.push('Hello,')
  lines.push('')

  // Intro line
  lines.push(`You have a new booking for ${formattedDate}.`)
  lines.push(`Expected drop-off between ${dropOffFrom} and ${dropOffTo}.`)
  lines.push('')

  // Customer details
  lines.push(`Customer name: ${booking.customer_name}`)
  lines.push(`Mobile number: ${booking.customer_mobile}`)

  // Car registration
  if (booking.vehicle_reg && booking.vehicle_reg.trim()) {
    lines.push(`Car registration: ${booking.vehicle_reg}`)
  } else {
    lines.push('Car registration: (not provided)')
  }

  lines.push('')

  // Booking date and drop-off window
  lines.push(`Booking date: ${formattedDate}`)
  lines.push(`Drop-off window: ${dropOffFrom} – ${dropOffTo}`)
  lines.push('')

  // Service/issue type
  lines.push(`Service / issue: ${serviceTypeDisplay}`)

  // Details
  lines.push(`Details: ${detailsText}`)

  const body = lines.join('\n')

  return { subject, body }
}




