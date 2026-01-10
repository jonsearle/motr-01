import type { Booking, BookingSettings } from '@/types/db'

/**
 * Formats a booking notification email with subject, HTML body, and plain text body.
 * 
 * @param booking - The booking to format
 * @param settings - The booking settings (used for notification name)
 * @returns Object containing subject, htmlBody, and textBody
 */
export function formatBookingEmail(
  booking: Booking,
  settings: BookingSettings
): { subject: string; htmlBody: string; textBody: string } {
  // Format date for display
  const bookingDate = new Date(booking.date)
  const formattedDate = bookingDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Format time if available
  const timeDisplay = booking.time 
    ? booking.time.substring(0, 5) // Extract HH:MM format
    : 'Not specified'

  // Build subject
  const subject = `New Booking: ${booking.customer_name} - ${booking.appointment_type} on ${formattedDate}`

  // Build HTML body
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #0278BD; border-bottom: 2px solid #0278BD; padding-bottom: 10px;">
    New Booking Received
  </h2>
  
  <p><strong>Date:</strong> ${formattedDate}</p>
  <p><strong>Expected Arrival Time:</strong> ${timeDisplay}</p>
  <p><strong>Appointment Type:</strong> ${booking.appointment_type}</p>
  
  <h3 style="color: #1F2933; margin-top: 30px; margin-bottom: 10px;">Customer Details</h3>
  <p><strong>Name:</strong> ${booking.customer_name}</p>
  <p><strong>Phone:</strong> ${booking.customer_mobile}</p>
  ${booking.vehicle_reg ? `<p><strong>Vehicle Registration:</strong> ${booking.vehicle_reg}</p>` : ''}
  
  ${booking.issue_description 
    ? `<h3 style="color: #1F2933; margin-top: 30px; margin-bottom: 10px;">Additional Information</h3>
       <p style="background-color: #F9FAFB; padding: 15px; border-left: 4px solid #0278BD; border-radius: 4px;">
         ${booking.issue_description.replace(/\n/g, '<br>')}
       </p>`
    : ''
  }
  
  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
  <p style="color: #6B7280; font-size: 12px;">
    This is an automated notification from your booking system.
  </p>
</body>
</html>
  `.trim()

  // Build plain text body
  const textBody = `
New Booking Received

Date: ${formattedDate}
Expected Arrival Time: ${timeDisplay}
Appointment Type: ${booking.appointment_type}

Customer Details:
Name: ${booking.customer_name}
Phone: ${booking.customer_mobile}
${booking.vehicle_reg ? `Vehicle Registration: ${booking.vehicle_reg}` : ''}

${booking.issue_description 
    ? `Additional Information:\n${booking.issue_description}`
    : ''
}

---
This is an automated notification from your booking system.
  `.trim()

  return {
    subject,
    htmlBody,
    textBody,
  }
}
