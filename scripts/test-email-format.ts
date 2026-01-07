import { formatBookingEmail } from '../lib/format-booking-email'
import { getBookingSettings } from '../lib/db'
import type { Booking } from '../types/db'

// Note: Environment variables are loaded from .env.local in Next.js

async function testEmailFormat() {
  console.log('Testing email format...\n')

  const settings = await getBookingSettings()
  if (!settings) {
    console.error('No booking settings found')
    return
  }

  // Create a test booking
  const testBooking: Booking = {
    id: 'test-id',
    date: '2025-01-27', // Tuesday 27 January
    time: '09:00',
    customer_name: 'Test Customer',
    customer_mobile: '07801550538',
    vehicle_reg: 'TEST123',
    appointment_type: 'MOT',
    issue_description: 'Test booking',
    created_at: new Date().toISOString(),
  }

  const { subject, htmlBody, textBody } = formatBookingEmail(testBooking, settings)

  console.log('SUBJECT:')
  console.log(subject)
  console.log('\nHTML BODY (first 500 chars):')
  console.log(htmlBody.substring(0, 500))
  console.log('\nTEXT BODY (first 500 chars):')
  console.log(textBody.substring(0, 500))
  console.log('\n✓ Email format test complete')
}

testEmailFormat().catch(console.error)

