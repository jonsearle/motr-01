"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { getBookingById, updateBooking } from "@/lib/db";
import toast from "react-hot-toast";
import TimePicker from "@/components/TimePicker";
import DatePicker from "@/components/DatePicker";
import type { Booking } from "@/types/db";

const APPOINTMENT_TYPES = [
  "MOT",
  "Interim Service",
  "Full Service",
  "Specific job",
];

function EditBookingPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_mobile: "",
    date: "",
    time: "09:00",
    vehicle_reg: "",
    vehicle_make_model: "",
    issue_description: "",
    appointment_type: "",
  });

  const bookingId = params?.id as string;

  // Load existing booking
  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId) return;

      try {
        setLoading(true);
        const booking = await getBookingById(bookingId);
        
        if (!booking) {
          toast.error("Booking not found");
          router.push("/admin/diary");
          return;
        }

        // Pre-fill form with existing booking data
        setFormData({
          customer_name: booking.customer_name || "",
          customer_mobile: booking.customer_mobile || "",
          date: booking.date || "",
          time: booking.time || "09:00",
          vehicle_reg: booking.vehicle_reg || "",
          vehicle_make_model: "", // Not in booking type, but keep for form consistency
          issue_description: booking.issue_description || "",
          appointment_type: booking.appointment_type || "",
        });
      } catch (error) {
        console.error("Error loading booking:", error);
        toast.error("Failed to load booking");
        router.push("/admin/diary");
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimeChange = (time: string) => {
    setFormData((prev) => ({ ...prev, time }));
  };

  const handleDateChange = (date: string) => {
    setFormData((prev) => ({ ...prev, date }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validation
      if (!formData.customer_name.trim()) {
        toast.error("Customer name is required");
        setSaving(false);
        return;
      }
      if (!formData.customer_mobile.trim()) {
        toast.error("Customer phone is required");
        setSaving(false);
        return;
      }
      if (!formData.date) {
        toast.error("Date is required");
        setSaving(false);
        return;
      }
      if (!formData.appointment_type) {
        toast.error("Appointment type is required");
        setSaving(false);
        return;
      }
      if (!formData.time) {
        toast.error("Expected arrival time is required");
        setSaving(false);
        return;
      }

      // Update booking
      await updateBooking(bookingId, {
        customer_name: formData.customer_name.trim(),
        customer_mobile: formData.customer_mobile.trim(),
        date: formData.date,
        time: formData.time,
        vehicle_reg: formData.vehicle_reg.trim() || undefined,
        issue_description: formData.issue_description.trim() || undefined,
        appointment_type: formData.appointment_type,
      });

      toast.success("Booking updated");
      
      // Return to diary with preserved state
      const monthParam = searchParams.get("month");
      const selectedDateParam = searchParams.get("selectedDate");
      if (monthParam) {
        const url = selectedDateParam
          ? `/admin/diary?month=${monthParam}&selectedDate=${selectedDateParam}`
          : `/admin/diary?month=${monthParam}`;
        router.push(url);
      } else {
        router.push("/admin/diary");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const monthParam = searchParams.get("month");
    const selectedDateParam = searchParams.get("selectedDate");
    if (monthParam) {
      const url = selectedDateParam
        ? `/admin/diary?month=${monthParam}&selectedDate=${selectedDateParam}`
        : `/admin/diary?month=${monthParam}`;
      router.push(url);
    } else {
      router.push("/admin/diary");
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      <h1 className="text-[28px] font-semibold tracking-[-0.02em] mb-4">Edit Booking</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">
            Customer name
          </label>
          <input
            type="text"
            id="customer_name"
            name="customer_name"
            value={formData.customer_name}
            onChange={handleChange}
            required
            className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="customer_mobile" className="block text-sm font-medium text-gray-700 mb-1">
            Customer phone number
          </label>
          <input
            type="tel"
            id="customer_mobile"
            name="customer_mobile"
            value={formData.customer_mobile}
            onChange={handleChange}
            required
            className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="inline-block">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <DatePicker
              id="date"
              value={formData.date}
              onChange={handleDateChange}
              required
            />
          </div>

          <div className="inline-block">
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Expected arrival time
            </label>
            <TimePicker
              id="time"
              value={formData.time}
              onChange={handleTimeChange}
              required
            />
          </div>
        </div>

        <div className="text-sm text-gray-600 italic -mt-2">
          A reminder SMS will be sent the day before
        </div>

        <div className="!mt-8">
          <label htmlFor="appointment_type" className="block text-sm font-medium text-gray-700 mb-1">
            Appointment Type
          </label>
          <select
            id="appointment_type"
            name="appointment_type"
            value={formData.appointment_type}
            onChange={handleChange}
            required
            className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select appointment type</option>
            {APPOINTMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="inline-block">
            <label htmlFor="vehicle_reg" className="block text-sm font-medium text-gray-700 mb-1">
              Car Registration
            </label>
            <input
              type="text"
              id="vehicle_reg"
              name="vehicle_reg"
              value={formData.vehicle_reg}
              onChange={handleChange}
              className="w-full sm:w-36 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="inline-block">
            <label htmlFor="vehicle_make_model" className="block text-sm font-medium text-gray-700 mb-1">
              Make and Model
            </label>
            <input
              type="text"
              id="vehicle_make_model"
              name="vehicle_make_model"
              value={formData.vehicle_make_model}
              onChange={handleChange}
              placeholder="e.g. Ford Fiesta"
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="issue_description" className="block text-sm font-medium text-gray-700 mb-1">
            Additional information (optional)
          </label>
          <textarea
            id="issue_description"
            name="issue_description"
            value={formData.issue_description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Update booking"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditBookingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <EditBookingPageContent />
    </Suspense>
  );
}
