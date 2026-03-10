export const MOTORHQ_AUTH_COOKIE = "motorhq_auth";

const DEFAULT_PASSCODE = "1973";

export function getMotorHqPasscode(): string {
  return process.env.MOTORHQ_PASSCODE?.trim() || DEFAULT_PASSCODE;
}

export function getMotorHqSessionToken(): string {
  return process.env.MOTORHQ_SESSION_TOKEN?.trim() || "motorhq-unlocked";
}
