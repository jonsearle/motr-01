'use server'

import { Resend } from 'resend'
import { getBookingById, getBookingSettings } from './db'
import { formatBookingEmail } from './format-booking-email'

/**
 * Sends a booking notification email to the configured garage notification address.
 * This is a fire-and-forget operation that doesn't throw errors to avoid blocking the booking flow.
 *
 * @param bookingId - The ID of the booking to send notification for
 */
export async function sendBookingNotificationEmail(bookingId: string): Promise<void> {
  console.log('[Email] sendBookingNotificationEmail called with bookingId:', bookingId)
  console.log('[Email] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
  console.log('[Email] RESEND_FROM_EMAIL exists:', !!process.env.RESEND_FROM_EMAIL)
  
  try {
    // Load booking
    const booking = await getBookingById(bookingId)
    if (!booking) {
      console.error(`[Email] Booking not found: ${bookingId}`)
      return
    }
    console.log('[Email] Booking loaded:', booking.id, booking.customer_name)

    // Load settings
    const settings = await getBookingSettings()
    if (!settings) {
      console.error('[Email] Booking settings not found')
      return
    }

    // Validate notification email is configured
    if (!settings.notification_email || !settings.notification_email.trim()) {
      console.warn('[Email] Notification email not configured in settings. Skipping email send.')
      return
    }

    // Format email
    const { subject, body } = formatBookingEmail(booking, settings)

    // Get from email address from environment
    const fromEmail = process.env.RESEND_FROM_EMAIL
    if (!fromEmail) {
      console.error('[Email] RESEND_FROM_EMAIL environment variable not set')
      return
    }

    // Get API key from environment
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('[Email] RESEND_API_KEY environment variable not set')
      return
    }

    // Initialize Resend client (inside function to ensure env vars are loaded)
    const resend = new Resend(apiKey)

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: settings.notification_email.trim(),
      subject: subject,
      text: body,
    })

    if (error) {
      console.error('[Email] Failed to send booking notification email:', {
        bookingId,
        error,
        recipient: settings.notification_email,
      })
      return
    }

    console.log('[Email] Successfully sent booking notification email:', {
      bookingId,
      emailId: data?.id,
      recipient: settings.notification_email,
    })
  } catch (error) {
    // Log error but don't throw - we don't want to block the booking flow
    console.error('[Email] Error sending booking notification email:', {
      bookingId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}




