import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary">
      <SignUp
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




