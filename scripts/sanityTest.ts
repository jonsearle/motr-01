import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  getBookingSettings,
  upsertBookingSettings,
  createBooking,
  getBookingsByMonth,
  getGarageSiteContent,
  upsertGarageSiteContent,
} from '../lib/db'
import type { BookingSettings, GarageSiteContent } from '../types/db'

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = join(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    const envFile = readFileSync(envPath, 'utf-8')
    envFile.split('\n').forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
}

loadEnvFile()

;(async () => {
  try {
    console.log('🔧 Running Supabase sanity test...\n')

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in environment variables')
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables')
    }

    console.log('✅ Environment variables loaded')
    console.log(`   Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`)

    // Test 1: Upsert booking settings
    console.log('📝 Test 1: Upserting booking settings...')
    const testSettings: BookingSettings = {
      id: '00000000-0000-0000-0000-000000000001',
      opening_days: [
        {
          day_of_week: 'monday',
          is_open: true,
          business_open_time: '08:00',
          business_close_time: '17:00',
          dropoff_from_time: '08:30',
          dropoff_to_time: '09:30',
        },
      ],
      lead_time_days: 2,
      lead_time_basis: 'working_days',
      timezone: 'Europe/London',
      daily_booking_limit: 5,
      notification_name: 'Test Garage',
      notification_email: 'test@example.com',
      created_at: new Date().toISOString(),
    }

    const settings = await upsertBookingSettings(testSettings)
    console.log('✅ Booking settings saved:')
    console.log(JSON.stringify(settings, null, 2))
    console.log('')

    // Test 2: Read back booking settings
    console.log('📖 Test 2: Reading booking settings...')
    const retrievedSettings = await getBookingSettings()
    if (retrievedSettings) {
      console.log('✅ Booking settings retrieved:')
      console.log(`   ID: ${retrievedSettings.id}`)
      console.log(`   Opening days: ${retrievedSettings.opening_days.length}`)
      console.log(`   Daily limit: ${retrievedSettings.daily_booking_limit}`)
      console.log(`   Notification: ${retrievedSettings.notification_name} (${retrievedSettings.notification_email})`)
    } else {
      console.log('⚠️  No booking settings found')
    }
    console.log('')

    // Test 3: Create a booking
    console.log('📅 Test 3: Creating a booking...')
    const today = new Date().toISOString().split('T')[0]
    const booking = await createBooking({
      date: today,
      appointment_type: 'MOT',
      issue_description: 'Test booking for sanity check',
      customer_name: 'Jon Tester',
      customer_mobile: '07123456789',
      vehicle_reg: 'TEST123',
    })
    console.log('✅ Booking created:')
    console.log(JSON.stringify(booking, null, 2))
    console.log('')

    // Test 4: Get bookings by month
    console.log('📆 Test 4: Getting bookings for current month...')
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const bookings = await getBookingsByMonth(year, month)
    console.log(`✅ Found ${bookings.length} booking(s) in ${year}-${month.toString().padStart(2, '0')}:`)
    bookings.forEach((b, i) => {
      console.log(`   ${i + 1}. ${b.date} - ${b.customer_name} (${b.appointment_type})`)
    })
    console.log('')

    // Test 5: Get garage site content (might be null)
    console.log('🏢 Test 5: Reading garage site content...')
    const siteContent = await getGarageSiteContent()
    if (siteContent) {
      console.log('✅ Garage site content retrieved:')
      console.log(`   ID: ${siteContent.id}`)
      console.log(`   Business name: ${siteContent.business_name || 'Not set'}`)
      console.log(`   Services: ${siteContent.services?.length || 0}`)
      console.log(`   Reviews: ${siteContent.reviews?.length || 0}`)
    } else {
      console.log('⚠️  No garage site content found (this is expected if not yet created)')
    }
    console.log('')

    // Test 6: Upsert garage site content
    console.log('💾 Test 6: Upserting garage site content...')
    const testSiteContent: GarageSiteContent = {
      id: '00000000-0000-0000-0000-000000000002',
      business_name: 'Test Garage',
      tagline: 'Your trusted automotive partner',
      about_text: 'This is a test garage for sanity checking the database connection.',
      address_line1: '123 Test Street',
      city: 'Test City',
      postcode: 'TE5T 1NG',
      phone: '01234567890',
      email: 'info@testgarage.com',
      services: [
        {
          service_name: 'MOT',
          description: 'Ministry of Transport test',
        },
        {
          service_name: 'Servicing',
          description: 'Full vehicle servicing',
        },
      ],
      reviews: [
        {
          customer_name: 'John Doe',
          review_text: 'Great service!',
          stars: 5,
        },
      ],
      google_reviews_link: 'https://example.com/reviews',
      created_at: new Date().toISOString(),
    }

    const updatedSiteContent = await upsertGarageSiteContent(testSiteContent)
    console.log('✅ Garage site content saved:')
    console.log(`   ID: ${updatedSiteContent.id}`)
    console.log(`   Business: ${updatedSiteContent.business_name}`)
    console.log(`   Services: ${updatedSiteContent.services?.length || 0}`)
    console.log(`   Reviews: ${updatedSiteContent.reviews?.length || 0}`)
    console.log('')

    console.log('🎉 All tests passed successfully!')
  } catch (err) {
    console.error('❌ Sanity test failed:')
    if (err instanceof Error) {
      console.error(`   Error: ${err.message}`)
      if (err.stack) {
        console.error(`   Stack: ${err.stack}`)
      }
    } else {
      console.error('   Unknown error:', err)
    }
    process.exit(1)
  }
})()

