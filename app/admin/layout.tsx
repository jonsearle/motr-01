"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/diary", label: "Your Diary", icon: "📅" },
    { href: "/admin/website", label: "Your Website", icon: "🏠" },
    { href: "/admin/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar - Full Width */}
      <div className="w-full bg-gray-100 h-16 flex items-center justify-between px-4">
        <div className="flex items-center">
          {/* Spannr Logo Placeholder */}
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
        </div>
        <div className="text-gray-700 font-medium">Your garage</div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex">
        {/* Sidebar Navigation - Vertically Stacked */}
        <aside className="w-64 border-r border-gray-200 bg-white py-6 flex-shrink-0">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors ${
                    isActive
                      ? "bg-gray-100 text-blue-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-white p-8">{children}</main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

