import Link from "next/link";

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  return (
    <main className="min-h-screen bg-[#F4F5F7] px-4 pb-8 pt-10 text-[#101820]">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Booking Confirmed</h1>
        <p className="mt-3 text-sm text-[#4A5565]">
          Thanks, your appointment has been booked. We also sent a confirmation SMS.
        </p>
        {searchParams.id && (
          <p className="mt-3 text-xs text-[#6B7280]">Reference: {searchParams.id}</p>
        )}
        <div className="mt-5 space-y-3">
          <Link
            href="/book"
            className="block h-12 rounded-xl bg-[#E8EDF5] px-4 py-3 text-center text-sm font-semibold"
          >
            Make Another Booking
          </Link>
          <Link
            href="/"
            className="block h-12 rounded-xl bg-[#101820] px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Open Garage App
          </Link>
        </div>
      </div>
    </main>
  );
}
