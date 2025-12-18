"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { useState, useEffect, useRef } from "react";
import { getGarageSiteContent } from "@/lib/db";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [businessName, setBusinessName] = useState<string>("");

  const navItems = [
    { href: "/admin/diary", label: "Your Diary", icon: "/images/diary-icon.png" },
    { href: "/admin/website", label: "Your Website", icon: "/images/website-icon.png" },
    { href: "/admin/settings", label: "Settings", icon: "/images/settings-icon.png" },
  ];

  // Fetch business name on mount
  useEffect(() => {
    const loadBusinessName = async () => {
      try {
        const content = await getGarageSiteContent();
        if (content?.business_name) {
          setBusinessName(content.business_name);
        }
      } catch (error) {
        console.error("Error loading business name:", error);
      }
    };
    loadBusinessName();
  }, []);

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
    <div className="min-h-screen bg-white">
      {/* Top Bar - Full Width */}
      <div className="w-full bg-white h-16 flex items-center justify-between px-4 relative">
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

          {/* Business Name */}
          {businessName && (
            <div className="text-gray-800 font-semibold text-lg">
              {businessName}
            </div>
          )}
        </div>
        
        {/* Motr Logo */}
        <div className="flex items-center">
          <a
            href="https://motex-home.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image
              src="/images/motr-grey.png"
              alt="Motr"
              width={40}
              height={16}
              className="h-4 w-auto"
            />
          </a>
        </div>
      </div>

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
          className="hidden md:block fixed top-16 left-4 bg-white border border-gray-200 rounded-lg shadow-lg z-40 min-w-[200px]"
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
      <main className="w-full bg-white p-4 md:p-8">{children}</main>
      <Toaster position="top-right" />
    </div>
  );
}

