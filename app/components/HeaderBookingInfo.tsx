"use client";

import { useRouter } from "next/navigation";
import { useBookingInfo } from "@/app/contexts/BookingInfoContext";
import { formatDateForDisplayFull } from "@/lib/business-hours";

export default function HeaderBookingInfo() {
  const router = useRouter();
  const { settings, nextAvailableDate, nextAvailableDateObject } = useBookingInfo();

  if (!settings || !nextAvailableDate) {
    return null;
  }

  return (
    <div className="hidden md:flex flex-col">
      <div className="text-sm font-normal text-gray-600 -mb-0.5">
        Customers can book online from
      </div>
      <div className="flex items-center gap-3">
        <div className="text-lg font-semibold text-gray-900">
          {nextAvailableDate === 'Tomorrow' 
            ? 'Tomorrow' 
            : nextAvailableDateObject 
              ? formatDateForDisplayFull(nextAvailableDateObject, settings.timezone)
              : nextAvailableDate}
        </div>
        <button
          onClick={() => router.push('/admin/diary/rules')}
          className="text-sm font-semibold text-[#0278BD] no-underline whitespace-nowrap"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

