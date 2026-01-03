"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBooking } from "@/lib/db";
import toast from "react-hot-toast";

const APPOINTMENT_TYPES = [
  "MOT",
  "Interim Service",
  "Full Service",
  "Request a Specific Job",
];

function CreateBookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_mobile: "",
    date: "",
    time: "",
    vehicle_reg: "",
    issue_description: "",
    appointment_type: "",
  });

  // Pre-fill date if coming from Day Panel
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setFormData((prev) => ({ ...prev, date: dateParam }));
    }
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.customer_name.trim()) {
        toast.error("Customer name is required");
        setLoading(false);
        return;
      }
      if (!formData.customer_mobile.trim()) {
        toast.error("Customer phone is required");
        setLoading(false);
        return;
      }
      if (!formData.date) {
        toast.error("Date is required");
        setLoading(false);
        return;
      }
      if (!formData.appointment_type) {
        toast.error("Appointment type is required");
        setLoading(false);
        return;
      }

      // Create booking
      const booking = await createBooking({
        customer_name: formData.customer_name.trim(),
        customer_mobile: formData.customer_mobile.trim(),
        date: formData.date,
        time: formData.time || undefined,
        vehicle_reg: formData.vehicle_reg.trim() || undefined,
        issue_description: formData.issue_description.trim() || undefined,
        appointment_type: formData.appointment_type,
      });

      // Send email notification (fire-and-forget, don't block on errors)
      fetch('/api/bookings/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId: booking.id }),
      }).catch((error) => {
        console.error("Failed to send booking notification email:", error);
        // Don't show error to user - email failure shouldn't block booking
      });

      toast.success("Booking created");
      
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
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking");
      setLoading(false);
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

  return (
    <div className="w-full max-w-4xl">
      <h1 className="text-2xl font-semibold mb-4">Create Booking</h1>

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
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="customer_mobile" className="block text-sm font-medium text-gray-700 mb-1">
            Customer phone
          </label>
          <input
            type="tel"
            id="customer_mobile"
            name="customer_mobile"
            value={formData.customer_mobile}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Time (optional)
            </label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="appointment_type" className="block text-sm font-medium text-gray-700 mb-1">
            Appointment Type
          </label>
          <select
            id="appointment_type"
            name="appointment_type"
            value={formData.appointment_type}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select appointment type</option>
            {APPOINTMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="vehicle_reg" className="block text-sm font-medium text-gray-700 mb-1">
            Car Registration (optional)
          </label>
          <input
            type="text"
            id="vehicle_reg"
            name="vehicle_reg"
            value={formData.vehicle_reg}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="issue_description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
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
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving..." : "Save booking"}
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

export default function CreateBookingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <CreateBookingPageContent />
    </Suspense>
  );
}

