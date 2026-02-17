import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6">
      <Image
        src="/logo.jpg"
        alt="Rain Check"
        width={200}
        height={50}
        className="h-10 w-auto mb-8"
      />
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-zinc-900 border border-zinc-800",
            headerTitle: "text-white",
            headerSubtitle: "text-zinc-400",
            formFieldLabel: "text-zinc-300",
            formFieldInput:
              "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500",
            formButtonPrimary: "bg-emerald-600 hover:bg-emerald-500",
            footerActionLink: "text-emerald-400 hover:text-emerald-300",
          },
        }}
      />
    </div>
  );
}
