# MOTR Revenue Wedge v1

Mobile-first Next.js prototype focused on missed-call revenue capture.

## Features
- Splash screen on app open
- Revenue Capture toggle persisted in `garage_settings.auto_sms_enabled`
- `POST /api/missed-call` endpoint (sends booking link SMS only when toggle is ON)
- Customer booking flow at `/book` with fixed hourly slots
- Booking persistence to Supabase `bookings`
- Confirmation SMS sent after booking
- Mobile bookings list + tap-for-detail on `/`

## Required env vars
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL` (or `BASE_APP_URL`) for booking link in SMS
- SMS sender: `RESEND_SMS_FROM` (fallbacks: `RESEND_FROM_PHONE`, `TWILIO_DEFAULT_FROM_NUMBER`)

## Local run
```bash
npm install
npm run dev
```

## Manual missed-call trigger
```bash
curl -X POST http://localhost:3000/api/missed-call \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567"}'
```
