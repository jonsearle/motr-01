export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: { id?: string; date?: string; time?: string };
}) {
  const readableDate =
    searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date)
      ? new Date(`${searchParams.date}T00:00:00`).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  const readableTime = searchParams.time ? searchParams.time.slice(0, 5) : null;

  return (
    <main className="min-h-screen bg-gray-800 px-6 pb-24 pt-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 mt-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-white">
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Thanks for booking.</h1>
        {readableDate && readableTime ? (
          <p className="mt-4 text-base text-gray-100">
            We&apos;ll see you on {readableDate} at {readableTime}.
          </p>
        ) : (
          <p className="mt-4 text-base text-gray-100">Your booking is confirmed.</p>
        )}
      </div>
    </main>
  );
}
