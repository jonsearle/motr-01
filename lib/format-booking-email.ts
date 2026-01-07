import type { Booking, BookingSettings, OpeningDay } from '@/types/db'

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
 * Formats a date to "DayName DD MonthName" format
 * Example: "Thursday 08 January"
 */
function formatBookingDate(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
  
  // Format the date parts
  const parts = formatter.formatToParts(date)
  const dayName = parts.find(p => p.type === 'weekday')?.value || ''
  const dayOfMonth = parts.find(p => p.type === 'day')?.value || ''
  const monthName = parts.find(p => p.type === 'month')?.value || ''
  
  return `${dayName} ${dayOfMonth} ${monthName}`
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
    case 'Specific job':
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

/**
 * Sanitizes a mobile number for use in tel: links
 * Removes spaces and keeps only digits and + sign
 */
function sanitizeMobileForTel(mobile: string): string {
  // Keep only digits, +, and remove spaces
  return mobile.replace(/[^\d+]/g, '')
}

/**
 * Formats drop-off window display string
 * Example: "7:00 am–9:00 am"
 */
function formatDropOffWindow(from: string, to: string): string {
  const from12 = formatTime12Hour(from)
  const to12 = formatTime12Hour(to)
  return `${from12}–${to12}`
}

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

export interface FormattedEmail {
  subject: string
  htmlBody: string
  textBody: string
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

  // Format date as "Thursday 08 January"
  const dateDisplay = formatBookingDate(bookingDate, settings.timezone)
  console.log('[Email] Formatted date:', dateDisplay)

  // Subject: "NEW BOOKING: Thursday 08 January"
  const subject = `NEW BOOKING: ${dateDisplay}`
  console.log('[Email] Subject:', subject)

  // Get drop-off window
  const dropOffWindow = getDropOffWindow(bookingDate, settings)
  const dropOffWindowDisplay = dropOffWindow
    ? formatDropOffWindow(dropOffWindow.from, dropOffWindow.to)
    : 'N/A'

  // Map service type for display
  const serviceTypeDisplay = mapServiceTypeForEmail(booking.appointment_type)

  // Format details
  const detailsText = formatDetails(booking.appointment_type, booking.issue_description)

  // Customer details
  const customerName = booking.customer_name
  const customerMobileDisplay = booking.customer_mobile
  const customerMobileTel = sanitizeMobileForTel(booking.customer_mobile)
  const carRegistration = booking.vehicle_reg?.trim() || '(not provided)'

  // Build HTML email body
  const htmlLines: string[] = []
  htmlLines.push('<p>Hello,</p>')
  htmlLines.push('')
  htmlLines.push('<p>You have a new booking:</p>')
  htmlLines.push('')
  htmlLines.push(`<p>Date: <strong>${escapeHtml(dateDisplay)}</strong></p>`)
  htmlLines.push(`<p>Expected drop-off: <strong>${escapeHtml(dropOffWindowDisplay)}</strong></p>`)
  htmlLines.push('')
  htmlLines.push(`<p>Customer name: <strong>${escapeHtml(customerName)}</strong></p>`)
  htmlLines.push(
    `<p>Mobile number: <strong><a href="tel:${escapeHtml(customerMobileTel)}">${escapeHtml(customerMobileDisplay)}</a></strong> (tap to call on mobile)</p>`
  )
  htmlLines.push(`<p>Car registration: <strong>${escapeHtml(carRegistration)}</strong></p>`)
  htmlLines.push('')
  htmlLines.push(`<p>Service type: <strong>${escapeHtml(serviceTypeDisplay)}</strong></p>`)
  htmlLines.push(`<p>Details: <strong>${escapeHtml(detailsText)}</strong></p>`)

  const htmlBody = htmlLines.join('\n')

  // Build plain text email body (same content, no HTML)
  const textLines: string[] = []
  textLines.push('Hello,')
  textLines.push('')
  textLines.push('You have a new booking:')
  textLines.push('')
  textLines.push(`Date: ${dateDisplay}`)
  textLines.push(`Expected drop-off: ${dropOffWindowDisplay}`)
  textLines.push(`Customer name: ${customerName}`)
  textLines.push(`Mobile number: ${customerMobileDisplay}`)
  textLines.push(`Car registration: ${carRegistration}`)
  textLines.push(`Service type: ${serviceTypeDisplay}`)
  textLines.push(`Details: ${detailsText}`)

  const textBody = textLines.join('\n')

  return { subject, htmlBody, textBody }
}








