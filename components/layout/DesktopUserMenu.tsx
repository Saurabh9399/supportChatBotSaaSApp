"use client";

import { useState, useRef, useEffect } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function DesktopUserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { signOut } = useClerk();
  const { user } = useUser();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  const initials = ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase()
    || user.emailAddresses[0]?.emailAddress[0]?.toUpperCase()
    || "U";

  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user.emailAddresses[0]?.emailAddress ?? "Account";

  return (
    // Only visible on desktop (sm+); mobile uses MobileNav
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        aria-expanded={open}
        aria-label="User menu"
      >
        {/* Small initials avatar */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[10px] font-bold leading-none">{initials}</span>
        </div>
        <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
          {/* User info */}
          <div className="px-3 py-2.5 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-[10px] text-gray-400 truncate mt-0.5">
              {user.emailAddresses[0]?.emailAddress}
            </p>
          </div>
          {/* Sign out */}
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/" })}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
