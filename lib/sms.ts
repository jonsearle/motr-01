import { Resend } from "resend";

type ResendSmsClient = {
  sms?: {
    send?: (payload: { from: string; to: string; text: string }) => Promise<unknown>;
  };
  messages?: {
    send?: (payload: { from: string; to: string; text: string }) => Promise<unknown>;
  };
};

function getResendClient(): { client: ResendSmsClient; from: string } {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const from =
    process.env.RESEND_SMS_FROM ||
    process.env.RESEND_FROM_PHONE ||
    process.env.TWILIO_DEFAULT_FROM_NUMBER;

  if (!from) {
    throw new Error(
      "Missing SMS sender env var. Set RESEND_SMS_FROM, RESEND_FROM_PHONE, or TWILIO_DEFAULT_FROM_NUMBER."
    );
  }

  return { client: new Resend(apiKey) as unknown as ResendSmsClient, from };
}

export async function sendSms(to: string, text: string): Promise<void> {
  const { client, from } = getResendClient();

  if (typeof client.sms?.send === "function") {
    await client.sms.send({ from, to, text });
    return;
  }

  if (typeof client.messages?.send === "function") {
    await client.messages.send({ from, to, text });
    return;
  }

  throw new Error("Current Resend SDK does not expose sms/messages send methods.");
}

export function bookingLink(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_APP_URL;
  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL or BASE_APP_URL");
  }

  return `${baseUrl.replace(/\/$/, "")}/book`;
}
