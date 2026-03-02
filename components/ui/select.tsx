import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full rounded border border-white/[0.06] bg-surface-secondary px-4 py-2 text-body-sm text-white",
      "min-h-[44px] transition-all duration-150",
      "focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent/40",
      "disabled:opacity-40 disabled:cursor-not-allowed",
      className
    )}
    {...props}
  />
));
Select.displayName = "Select";





