"use client";

import { createContext, useContext, ReactNode, useState, useCallback } from "react";
import type { BookingSettings } from "@/types/db";

interface BookingInfoContextType {
  settings: BookingSettings | null;
  nextAvailableDate: string | null;
  nextAvailableDateObject: Date | null;
  setBookingInfo: (info: {
    settings: BookingSettings | null;
    nextAvailableDate: string | null;
    nextAvailableDateObject: Date | null;
  }) => void;
}

const BookingInfoContext = createContext<BookingInfoContextType>({
  settings: null,
  nextAvailableDate: null,
  nextAvailableDateObject: null,
  setBookingInfo: () => {},
});

export function BookingInfoProvider({ children }: { children: ReactNode }) {
  const [bookingInfo, setBookingInfoState] = useState<{
    settings: BookingSettings | null;
    nextAvailableDate: string | null;
    nextAvailableDateObject: Date | null;
  }>({
    settings: null,
    nextAvailableDate: null,
    nextAvailableDateObject: null,
  });

  const setBookingInfo = useCallback((info: {
    settings: BookingSettings | null;
    nextAvailableDate: string | null;
    nextAvailableDateObject: Date | null;
  }) => {
    setBookingInfoState(info);
  }, []);

  return (
    <BookingInfoContext.Provider
      value={{
        ...bookingInfo,
        setBookingInfo,
      }}
    >
      {children}
    </BookingInfoContext.Provider>
  );
}

export function useBookingInfo() {
  return useContext(BookingInfoContext);
}

