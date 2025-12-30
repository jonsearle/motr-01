"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Booking } from "@/types/db";
import DeleteBookingModal from "./DeleteBookingModal";
import { deleteBooking } from "@/lib/db";
import toast from "react-hot-toast";

interface DiaryDayPanelProps {
  isOpen: boolean;
  date: Date;
  bookings: Booking[];
  currentMonth: Date;
  onClose: () => void;
  onBookingDeleted: () => void;
}

export default function DiaryDayPanel({
  isOpen,
  date,
  bookings,
  currentMonth,
  onClose,
  onBookingDeleted,
}: DiaryDayPanelProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

  if (!isOpen) return null;

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(date);
  };

  // Check if the date is in the past
  const isPastDate = (): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const dateIsPast = isPastDate();

  const handleCreateBooking = () => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    const currentYear = currentMonth.getFullYear();
    const currentMonthStr = String(currentMonth.getMonth() + 1).padStart(2, "0");
    router.push(`/admin/diary/create?date=${dateStr}&month=${currentYear}-${currentMonthStr}`);
  };

  const handleEdit = (booking: Booking) => {
    const currentYear = currentMonth.getFullYear();
    const currentMonthStr = String(currentMonth.getMonth() + 1).padStart(2, "0");
    router.push(`/admin/diary/edit/${booking.id}?month=${currentYear}-${currentMonthStr}&selectedDate=${booking.date}`);
  };

  const handleDeleteClick = (booking: Booking) => {
    setBookingToDelete(booking);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookingToDelete) return;

    try {
      await deleteBooking(bookingToDelete.id);
      toast.success("Booking deleted");
      setDeleteModalOpen(false);
      setBookingToDelete(null);
      onBookingDeleted();
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    }
  };

  // Sort bookings by time (earliest first), bookings without time go first
  const sortedBookings = [...bookings].sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return -1;
    if (!b.time) return 1;
    return a.time.localeCompare(b.time);
  });

  return (
    <>
      <div
        className={`fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{formatDate(date)}</h2>
            <div className="flex items-center gap-2">
              {!dateIsPast && (
                <button
                  onClick={handleCreateBooking}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Create booking
                </button>
              )}
              <button
                onClick={onClose}
                className="ml-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          {/* Bookings List */}
          <div className="flex-1 overflow-y-auto p-4">
            {sortedBookings.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>{dateIsPast ? "No bookings for this day." : "No bookings for this day yet."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="space-y-2">
                      {booking.time && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <span>🕐</span>
                          <span>{booking.time}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span>👤</span>
                        <span>{booking.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span>📞</span>
                        <span>{booking.customer_mobile}</span>
                      </div>
                      {booking.vehicle_reg && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <span>🚗</span>
                          <span>{booking.vehicle_reg}</span>
                        </div>
                      )}
                      {booking.issue_description && (
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <span>📄</span>
                          <span>{booking.issue_description}</span>
                        </div>
                      )}
                      {booking.appointment_type && (
                        <div className="text-xs text-gray-500 mt-1">
                          {booking.appointment_type}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleEdit(booking)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="Edit booking"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(booking)}
                        className="flex-1 px-3 py-1.5 border border-red-300 rounded text-sm text-red-700 hover:bg-red-50 transition-colors"
                        aria-label="Delete booking"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteBookingModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setBookingToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        customerName={bookingToDelete?.customer_name}
      />
    </>
  );
}

