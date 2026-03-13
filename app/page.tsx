import { OwnerHomeClient } from "@/components/owner-home-client";
import { getGarageSettingsForRequest } from "@/lib/server-data";

export default async function HomePage() {
  const settings = await getGarageSettingsForRequest();

  return <OwnerHomeClient initialSettings={settings} />;
}
