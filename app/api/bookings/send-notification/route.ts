import { NextRequest, NextResponse } from 'next/server';
import { sendBookingNotificationEmail } from '@/lib/send-booking-notification-email';

/**
 * API route to send booking notification email
 * POST /api/bookings/send-notification
 * Body: { bookingId: string }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] /api/bookings/send-notification called');
    const body = await request.json();
    const { bookingId } = body;
    console.log('[API] Booking ID received:', bookingId);

    if (!bookingId || typeof bookingId !== 'string') {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      );
    }

    // Send email (this is fire-and-forget, but we'll wait for it to start)
    console.log('[API] Calling sendBookingNotificationEmail...');
    await sendBookingNotificationEmail(bookingId);
    console.log('[API] sendBookingNotificationEmail completed');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error in send-notification route:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

