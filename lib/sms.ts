import { Resend } from "resend";
import twilio from "twilio";

type ResendSmsClient = {
  sms?: {
    send?: (payload: { from: string; to: string; text: string }) => Promise<unknown>;
  };
  messages?: {
    send?: (payload: { from: string; to: string; text: string }) => Promise<unknown>;
  };
};

function getFromNumber(): string {
  const from =
    process.env.RESEND_SMS_FROM ||
    process.env.RESEND_FROM_PHONE ||
    process.env.TWILIO_DEFAULT_FROM_NUMBER;

  if (!from) {
    throw new Error(
      "Missing SMS sender env var. Set RESEND_SMS_FROM, RESEND_FROM_PHONE, or TWILIO_DEFAULT_FROM_NUMBER."
    );
  }

  return from;
}

async function sendViaResend(from: string, to: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const client = new Resend(apiKey) as unknown as ResendSmsClient;

  if (typeof client.sms?.send === "function") {
    await client.sms.send({ from, to, text });
    return true;
  }

  if (typeof client.messages?.send === "function") {
    await client.messages.send({ from, to, text });
    return true;
  }

  return false;
}

async function sendViaTwilio(from: string, to: string, text: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Resend SMS API unavailable and Twilio credentials are missing.");
  }

  const client = twilio(accountSid, authToken);
  await client.messages.create({ from, to, body: text });
}

export async function sendSms(to: string, text: string): Promise<void> {
  const from = getFromNumber();
  const sentByResend = await sendViaResend(from, to, text);

  if (sentByResend) return;

  await sendViaTwilio(from, to, text);
}

export function bookingLink(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_APP_URL;
  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL or BASE_APP_URL");
  }

  return `${baseUrl.replace(/\/$/, "")}/book`;
}
