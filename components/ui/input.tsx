import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded border border-white/[0.06] bg-[#0E1216] px-3 py-2 text-sm text-white",
      "placeholder-[#5A6370] min-h-[40px]",
      "focus:outline-none focus:ring-1 focus:ring-[#19AFFF] focus:border-[#19AFFF]/30",
      "disabled:opacity-40 disabled:cursor-not-allowed",
      "transition-colors duration-150",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
