import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface-primary overflow-hidden">
      {/* Cinematic Boot Sequence Background */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/marketing/boot-sequence.jpg" 
          alt="Rain Check Boot Sequence" 
          fill 
          className="object-cover opacity-20 contrast-[1.2] grayscale-[0.5]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-primary via-surface-primary/60 to-surface-primary" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "bg-surface-secondary/80 backdrop-blur-2xl border border-white/[0.08] shadow-2xl rounded-2xl",
              headerTitle: "font-heading text-white uppercase italic tracking-tighter",
              headerSubtitle: "text-muted font-mono tracking-widest text-[10px] uppercase",
              socialButtonsBlockButton: "bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.08]",
              formButtonPrimary: "bg-accent hover:bg-accent-hover text-white font-bold uppercase tracking-widest",
              footerActionLink: "text-accent hover:text-accent-hover",
              formFieldLabel: "text-muted uppercase text-[10px] font-bold tracking-widest",
              formFieldInput: "bg-white/[0.02] border-white/[0.08] text-white focus:border-accent transition-all",
            },
          }}
          forceRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
