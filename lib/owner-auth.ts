export const OWNER_AUTH_COOKIE = "owner_auth";

const DEFAULT_OWNER_PASSCODE = "1234";

export function getOwnerPasscode(): string {
  return process.env.OWNER_PASSCODE?.trim() || DEFAULT_OWNER_PASSCODE;
}

export function getOwnerSessionToken(): string {
  return process.env.OWNER_SESSION_TOKEN?.trim() || "owner-unlocked";
}
