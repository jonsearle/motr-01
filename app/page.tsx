import { Suspense } from "react";
import { OwnerHomeLoading } from "@/components/owner-home-loading";
import { OwnerHomeClient } from "@/components/owner-home-client";
import { getGarageSettingsForRequest } from "@/lib/server-data";

async function HomePageContent() {
  const settings = await getGarageSettingsForRequest();

  return <OwnerHomeClient initialSettings={settings} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<OwnerHomeLoading />}>
      <HomePageContent />
    </Suspense>
  );
}
