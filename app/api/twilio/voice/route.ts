import { NextResponse } from 'next/server';
import twilio from 'twilio';

/**
 * Twilio Voice Webhook Handler
 * 
 * Handles incoming phone calls from Twilio:
 * 1. Extracts caller's phone number
 * 2. Sends SMS with booking link
 * 3. Returns TwiML to play text-to-speech message and hang up
 */
export async function POST(request: Request) {
  try {
    // Parse form-encoded request body from Twilio
    const formData = await request.formData();
    
    // Extract caller's phone number from the From field
    const callerPhoneNumber = formData.get('From') as string;
    
    // Validate environment variables are present
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_DEFAULT_FROM_NUMBER;
    
    if (!accountSid || !authToken || !fromNumber) {
      console.error('Missing Twilio environment variables');
      // Still return valid TwiML so the call doesn't fail
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, there was an error processing your call.</Say><Hangup /></Response>',
        {
          status: 200,
          headers: {
            'Content-Type': 'text/xml',
          },
        }
      );
    }
    
    // Initialize Twilio client
    const client = twilio(accountSid, authToken);
    
    // Attempt to send SMS to caller
    if (callerPhoneNumber) {
      try {
        await client.messages.create({
            body: "Jon's Garage: Sorry we missed your call. You can book your car in here: https://spannr-dropoff-prototype-02.netlify.app/book . Or give us a ring when we're open on 0780 1550538.",

          from: fromNumber,
          to: callerPhoneNumber,
        });
        console.log(`SMS sent successfully to ${callerPhoneNumber}`);
      } catch (smsError) {
        // Log SMS error but don't fail the call
        console.error('Failed to send SMS:', smsError);
      }
    } else {
      console.warn('No caller phone number found in request');
    }
    
    // Generate TwiML XML response
    // This plays a text-to-speech message and then hangs up
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello, this is Jon's Garage. Sorry we missed your call. We've sent you a text with a link to book online. Or you can just try us again later. Thank you.</Say>
  <Hangup />
</Response>`;
    
    // Return TwiML response with proper Content-Type header
    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
    
  } catch (error) {
    // Log any unexpected errors
    console.error('Error processing Twilio webhook:', error);
    
    // Always return valid TwiML even on error so the call doesn't fail
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, there was an error processing your call.</Say><Hangup /></Response>',
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
        },
      }
    );
  }
}

