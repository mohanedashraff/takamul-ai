import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-500/10 text-primary-400 hover:bg-primary-500/20",
        secondary:
          "border-border-primary bg-bg-tertiary text-text-secondary hover:bg-bg-surface",
        destructive:
          "border-transparent bg-error/10 text-error hover:bg-error/20",
        success:
          "border-transparent bg-success/10 text-success hover:bg-success/20",
        outline: "text-text-primary border-border-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
