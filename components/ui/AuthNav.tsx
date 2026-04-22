"use client";

import { useAuth } from "@clerk/nextjs";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function AuthNav() {
  const { isLoaded, isSignedIn } = useAuth();

  // Don't render anything until Clerk has loaded auth state
  if (!isLoaded) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" />
    );
  }

  if (isSignedIn) {
    return (
      <UserButton
        appearance={{
          elements: {
            avatarBox: "h-9 w-9 ring-2 ring-white/20",
          },
        }}
      />
    );
  }

  return (
    <>
      <SignInButton mode="modal">
        <button
          type="button"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button
          type="button"
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          Sign up
        </button>
      </SignUpButton>
    </>
  );
}
