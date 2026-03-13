export function OwnerHomeLoading() {
  return (
    <main className="min-h-screen bg-[#FBFCFE] text-[#1C2330]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-36 pt-6">
        <header className="mb-6 flex items-center justify-end">
          <div className="h-6 w-36 animate-pulse rounded-full bg-[#E8EAF0]" />
        </header>

        <div className="flex flex-1 items-center">
          <div className="mx-auto flex aspect-square w-full max-w-[336px] items-center justify-center rounded-full bg-[#E8EAF0] text-center text-[#4A515D] shadow-[0_14px_28px_rgba(31,37,46,0.08)]">
            <div className="w-[78%]">
              <div className="mx-auto mb-5 flex items-center justify-center">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full border-4 border-[#C8CED8]" />
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#6B727D] border-r-[#6B727D]" />
                </div>
              </div>

              <p className="text-[30px] leading-[1.02] font-semibold tracking-[-0.02em]">
                <span className="block">Loading</span>
                <span className="block">Online Bookings</span>
              </p>

              <p className="mx-auto mt-3 max-w-[220px] text-[14px] leading-[1.35] text-[#6B727D]">
                Just getting everything ready...
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
