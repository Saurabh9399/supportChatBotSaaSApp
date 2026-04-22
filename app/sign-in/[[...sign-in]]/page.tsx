import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Sign In" };

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center px-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "shadow-2xl rounded-2xl",
          },
        }}
      />
    </div>
  );
}
