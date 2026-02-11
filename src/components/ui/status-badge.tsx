import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-2 px-4 py-2 border-2 shadow-brutal-sm font-bold text-sm uppercase tracking-wide transition-colors",
  {
    variants: {
      status: {
        success: "bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300",
        warning: "bg-yellow-100 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300",
        error: "bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300",
        info: "bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300",
      },
      size: {
        sm: "px-3 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      status: "info",
      size: "md",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  icon?: React.ReactNode
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status, size, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statusBadgeVariants({ status, size, className }))}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
      </div>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge, statusBadgeVariants }
