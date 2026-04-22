"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ActiveLinkProps {
  href: string;
  exact?: boolean;
  children: React.ReactNode;
}

export function ActiveLink({ href, exact = false, children }: ActiveLinkProps) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      {children}
    </Link>
  );
}
