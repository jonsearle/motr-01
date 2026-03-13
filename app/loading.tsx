export default function Loading() {
  return (
    <main className="min-h-screen bg-[#FBFCFE] text-[#1F252E]">
      <div className="mx-auto w-full max-w-md px-6 pb-36 pt-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="h-8 w-40 animate-pulse rounded bg-[#E8EAF0]" />
          <div className="h-10 w-10 animate-pulse rounded-full bg-[#E8EAF0]" />
        </header>

        <div className="mb-6 grid grid-cols-3 gap-2">
          <div className="h-10 animate-pulse rounded-xl bg-[#E8EAF0]" />
          <div className="h-10 animate-pulse rounded-xl bg-[#E8EAF0]" />
          <div className="h-10 animate-pulse rounded-xl bg-[#E8EAF0]" />
        </div>

        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-2xl bg-white" />
          <div className="h-24 animate-pulse rounded-2xl bg-white" />
          <div className="h-24 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    </main>
  );
}
