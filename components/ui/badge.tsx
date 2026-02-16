import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type BadgeVariant = "green" | "yellow" | "red" | "blue" | "gray";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-green-500/20 text-green-400",
  yellow: "bg-yellow-500/20 text-yellow-400",
  red: "bg-red-500/20 text-red-400",
  blue: "bg-blue-500/20 text-blue-400",
  gray: "bg-gray-700 text-gray-300",
};

export function Badge({ variant = "gray", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
