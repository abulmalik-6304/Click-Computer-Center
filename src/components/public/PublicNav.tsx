// src/components/public/PublicNav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/store", label: "Store" },
  { href: "/training", label: "Training" },
  { href: "/services", label: "Services" },
];

export default function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-bold">
              C
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-slate-900 leading-tight">Click Computer</p>
              <p className="text-xs text-slate-500 leading-tight">Enterprise</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => {
              const active = pathname === n.href || pathname?.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-orange-100 text-orange-700"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/training/register"
              className="hidden sm:inline-block px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg"
            >
              Enroll Now
            </Link>
            <button
              onClick={() => setOpen((s) => !s)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
              aria-label="Menu"
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 space-y-1 border-t border-slate-100 pt-2">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium ${
                    active
                      ? "bg-orange-100 text-orange-700"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
            <Link
              href="/training/register"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 text-center"
            >
              Enroll Now
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
