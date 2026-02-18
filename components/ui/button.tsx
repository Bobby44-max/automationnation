"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-[#19AFFF] text-white hover:bg-[#0D9AEB] active:bg-[#0B87D1]",
  secondary:
    "bg-[#151A1F] text-[#8B939E] border border-white/[0.06] hover:bg-[#1C2228] hover:text-white active:bg-[#0E1216]",
  danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 active:bg-red-500/30",
  ghost: "text-[#8B939E] hover:text-white hover:bg-white/[0.04] active:bg-white/[0.06]",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs min-h-[32px]",
  md: "px-4 py-2 text-sm min-h-[40px]",
  lg: "px-6 py-3 text-base min-h-[44px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#19AFFF] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0A0D10]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled}
      {...props}
    />
  )
);
Button.displayName = "Button";
