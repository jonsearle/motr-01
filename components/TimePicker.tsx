"use client";

import { useState, useEffect } from "react";

interface TimePickerProps {
  value: string; // HH:MM format
  onChange: (time: string) => void;
  required?: boolean;
  id?: string;
  className?: string;
}

export default function TimePicker({
  value,
  onChange,
  required = false,
  id,
  className = "",
}: TimePickerProps) {
  // Parse the time value (HH:MM format)
  const [hour, setHour] = useState<string>("");
  const [minute, setMinute] = useState<string>("00");

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      setHour(h || "");
      setMinute(m || "00");
    } else {
      setHour("");
      setMinute("00");
    }
  }, [value]);

  // Generate hour options (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hourStr = i.toString().padStart(2, "0");
    return { value: hourStr, label: hourStr };
  });

  // Generate minute options (00, 15, 30, 45)
  const minuteOptions = [
    { value: "00", label: "00" },
    { value: "15", label: "15" },
    { value: "30", label: "30" },
    { value: "45", label: "45" },
  ];

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = e.target.value;
    setHour(newHour);
    // Maintain the current minute selection
    const newTime = newHour ? `${newHour}:${minute}` : "";
    onChange(newTime);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = e.target.value;
    setMinute(newMinute);
    // Only update if hour is already selected
    if (hour) {
      const newTime = `${hour}:${newMinute}`;
      onChange(newTime);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <select
        id={id ? `${id}-hour` : undefined}
        value={hour}
        onChange={handleHourChange}
        required={required}
        className="w-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Hour</option>
        {hourOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        id={id ? `${id}-minute` : undefined}
        value={minute}
        onChange={handleMinuteChange}
        required={required && !!hour}
        disabled={!hour}
        className="w-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {minuteOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

