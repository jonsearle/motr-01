"use client";

import { useRef } from "react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  required?: boolean;
  id?: string;
  className?: string;
}

export default function DatePicker({
  value,
  onChange,
  required = false,
  id,
  className = "",
}: DatePickerProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Format date as "Monday 09 January" (without year)
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    
    const date = new Date(dateString + "T00:00:00"); // Add time to avoid timezone issues
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "2-digit",
      month: "long",
    };
    
    return date.toLocaleDateString("en-GB", options);
  };

  const handleDisplayClick = () => {
    dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const formattedDate = formatDate(value);

  return (
    <div 
      className={`relative inline-block ${className}`}
      onClick={handleDisplayClick}
    >
      <input
        ref={dateInputRef}
        type="date"
        id={id}
        value={value}
        onChange={handleDateChange}
        required={required}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        aria-label="Date picker"
      />
      <div
        className="flex items-center gap-2 px-3 py-2 pr-8 border border-gray-300 rounded focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 pointer-events-none bg-white whitespace-nowrap"
      >
        {formattedDate || (
          <span className="text-gray-400">Select a date</span>
        )}
        <svg
          className="absolute right-2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  );
}

