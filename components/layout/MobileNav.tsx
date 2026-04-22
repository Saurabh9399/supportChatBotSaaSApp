"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { Menu, X, LayoutDashboard, MessageSquare, BarChart2, BookOpen, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare, exact: false },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2, exact: false },
  { href: "/dashboard/documents", label: "Knowledge Base", icon: BookOpen, exact: false },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, exact: false },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const initials = user
    ? ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() || user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || "U"
    : "U";

  return (
    <div className="sm:hidden">
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-down drawer */}
      <nav
        className={cn(
          "fixed left-0 right-0 top-14 z-40 bg-white border-b border-gray-100 shadow-lg",
          "transition-all duration-200 ease-out",
          open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0 pointer-events-none",
        )}
        aria-hidden={!open}
      >
        {/* User info row */}
        {user && (
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "Account"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
        )}

        {/* Nav links */}
        <div className="px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive(href, exact)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <div className="px-4 pb-4 pt-1 border-t border-gray-100">
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/" })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign out
          </button>
        </div>
      </nav>
    </div>
  );
}
