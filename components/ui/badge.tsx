import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type BadgeVariant = "green" | "yellow" | "red" | "blue" | "gray";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-emerald-400/10 text-emerald-400",
  yellow: "bg-amber-400/10 text-amber-400",
  red: "bg-red-400/10 text-red-400",
  blue: "bg-[#19AFFF]/10 text-[#19AFFF]",
  gray: "bg-white/[0.04] text-[#8B939E]",
};

export function Badge({ variant = "gray", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
