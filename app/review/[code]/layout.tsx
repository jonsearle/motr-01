import type { Metadata } from "next";
import { getGarageSettingsByShortCode } from "@/lib/db";

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  try {
    const settings = await getGarageSettingsByShortCode(params.code);
    const garageName = settings?.garage_name?.trim();

    if (garageName) {
      return {
        title: `Leave a Review for ${garageName}`,
        description: `Share your feedback for ${garageName}.`,
      };
    }
  } catch {
    // Fall back to static metadata below.
  }

  return {
    title: "Leave a Google Review",
    description: "Share your feedback for your recent booking.",
  };
}

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
