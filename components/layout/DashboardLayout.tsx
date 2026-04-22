import Link from "next/link";
import { APP_CONFIG } from "@/config";
import { MobileNav } from "./MobileNav";
import { ActiveLink } from "./ActiveLink";
import { DesktopUserMenu } from "./DesktopUserMenu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/conversations", label: "Conversations", exact: false },
  { href: "/dashboard/analytics", label: "Analytics", exact: false },
  { href: "/dashboard/documents", label: "Knowledge Base", exact: false },
  { href: "/dashboard/settings", label: "Settings", exact: false },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm hidden xs:block">{APP_CONFIG.name}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-0.5 text-sm font-medium flex-1 ml-2">
            {NAV_LINKS.map(({ href, label, exact }) => (
              <ActiveLink key={href} href={href} exact={exact}>
                {label}
              </ActiveLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Desktop: small user avatar + sign-out dropdown */}
            <DesktopUserMenu />
            {/* Mobile: hamburger (hidden on sm+) */}
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
