"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { useState, useEffect, useRef } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/admin/diary", label: "Your Diary", icon: "/images/diary-icon.png" },
    { href: "/admin/website", label: "Your Website", icon: "/images/website-icon.png" },
    { href: "/admin/settings", label: "Settings", icon: "/images/settings-icon.png" },
  ];

  // Get page title based on pathname
  const getPageTitle = (pathname: string | null): string => {
    if (!pathname) return '';
    if (pathname === '/admin/diary' || pathname.startsWith('/admin/diary/')) {
      return 'Your Diary';
    }
    if (pathname === '/admin/website') {
      return 'Your Website';
    }
    if (pathname === '/admin/settings') {
      return 'Settings';
    }
    return '';
  };

  const pageTitle = getPageTitle(pathname);
  const isDiaryPage = pathname === '/admin/diary';
  const isCreateOrEditPage = pathname?.includes('/admin/diary/create') || pathname?.includes('/admin/diary/edit');

  // Handle create booking navigation
  const handleCreateBooking = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    router.push(`/admin/diary/create?month=${year}-${month}`);
  };

  // Close menu when pathname changes (navigation)
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Close menu when clicking outside (desktop only - mobile menu is full screen)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Only handle click-outside for desktop menu
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Check if we're on desktop (menuRef only exists for desktop menu)
        const isDesktop = window.innerWidth >= 768;
        if (isDesktop) {
          setIsMenuOpen(false);
        }
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Top Bar - Full Width */}
      {!isCreateOrEditPage && (
      <div className="w-full bg-[#F9FAFB] h-16 flex items-center justify-between px-4 relative">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Button */}
          <button
            onClick={toggleMenu}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
              <span
                className={`block h-0.5 w-6 bg-gray-800 transition-all duration-300 ${
                  isMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-gray-800 transition-all duration-300 ${
                  isMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-gray-800 transition-all duration-300 ${
                  isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </div>
          </button>

          {/* Page Title */}
          {pageTitle && (
            <div className="text-gray-800 font-semibold text-lg">
              {pageTitle}
            </div>
          )}
        </div>
        
        {/* Add Booking Button (Diary page only) */}
        {isDiaryPage && (
          <div className="flex items-center">
            <button
              onClick={handleCreateBooking}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xl leading-none"
              aria-label="Add booking"
            >
              +
            </button>
          </div>
        )}
      </div>
      )}

      {/* Mobile Menu - Full Screen Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-50" onClick={(e) => {
          // Close menu if clicking on the overlay background (not on menu content)
          if (e.target === e.currentTarget) {
            setIsMenuOpen(false);
          }
        }}>
          <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
                  <span className="block h-0.5 w-6 bg-gray-800 rotate-45 translate-y-2" />
                  <span className="block h-0.5 w-6 bg-gray-800 -rotate-45 -translate-y-2" />
                </div>
              </button>
            </div>
            <nav className="flex flex-col flex-1 p-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavClick();
                    }}
                    className={`flex items-center gap-3 px-4 py-4 rounded-lg transition-colors touch-manipulation ${
                      isActive
                        ? "bg-gray-100 text-blue-600 font-semibold"
                        : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    }`}
                  >
                    <Image
                      src={item.icon}
                      alt=""
                      width={24}
                      height={24}
                      className="flex-shrink-0"
                    />
                    <span className="text-lg">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Menu - Dropdown */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className={`hidden md:block fixed ${isCreateOrEditPage ? 'top-4' : 'top-16'} left-4 bg-white border border-gray-200 rounded-lg shadow-lg z-40 min-w-[200px]`}
        >
          <nav className="flex flex-col py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center gap-2 px-4 py-3 transition-colors ${
                    isActive
                      ? "bg-gray-100 text-blue-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Image
                    src={item.icon}
                    alt=""
                    width={20}
                    height={20}
                    className="flex-shrink-0"
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content Area - Full Width */}
      <main className={`w-full bg-[#F9FAFB] ${isCreateOrEditPage ? 'p-4 md:p-6 pt-4 md:pt-6' : 'p-4 md:p-8'}`}>{children}</main>
      <Toaster position="top-right" />
    </div>
  );
}

