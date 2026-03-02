import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-surface-tertiary border border-white/[0.06] shadow-2xl",
          },
        }}
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}


