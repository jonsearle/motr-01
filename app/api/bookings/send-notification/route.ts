import { NextRequest, NextResponse } from 'next/server';
import { sendBookingNotificationEmail } from '@/lib/send-booking-notification-email';

/**
 * API route to send booking notification email
 * POST /api/bookings/send-notification
 * Body: { bookingId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId || typeof bookingId !== 'string') {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      );
    }

    // Send email (this is fire-and-forget, but we'll wait for it to start)
    await sendBookingNotificationEmail(bookingId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error in send-notification route:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

