import type { ReactNode } from "react";
import { BookingSettingsProvider } from "@/components/booking-settings-provider";
import { BookShell, BookingUnavailable } from "@/components/book-shell";
import { getGarageSettingsForRequest } from "@/lib/server-data";

const DEFAULT_GARAGE_NAME = "N1 Mobile Auto Repairs";
const DEFAULT_CALL_NUMBER = "07846799625";

export default async function BookLayout({ children }: { children: ReactNode }) {
  const settings = await getGarageSettingsForRequest();
  const garageName = settings.garage_name?.trim() || DEFAULT_GARAGE_NAME;
  const callNumber = settings.garage_phone?.trim() || DEFAULT_CALL_NUMBER;

  if (!settings.booking_hours_enabled) {
    return <BookingUnavailable garageName={garageName} callNumber={callNumber} />;
  }

  return (
    <BookingSettingsProvider settings={settings}>
      <BookShell>{children}</BookShell>
    </BookingSettingsProvider>
  );
}
