import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusCardVariants = cva(
  "p-6 border-2 text-center shadow-brutal-sm transition-colors",
  {
    variants: {
      status: {
        success: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
        warning: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800",
        error: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
        info: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
      },
    },
    defaultVariants: {
      status: "info",
    },
  }
)

const statusTextVariants = {
  success: "text-green-700 dark:text-green-300",
  warning: "text-yellow-700 dark:text-yellow-300",
  error: "text-red-700 dark:text-red-300",
  info: "text-blue-700 dark:text-blue-300",
}

const statusTitleVariants = {
  success: "text-green-600 dark:text-green-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  error: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
}

export interface StatusCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusCardVariants> {
  title: string
  value: string
  icon?: React.ReactNode
}

const StatusCard = React.forwardRef<HTMLDivElement, StatusCardProps>(
  ({ className, status = "info", title, value, icon, ...props }, ref) => {
    const textClass = status ? statusTextVariants[status] : statusTextVariants.info
    const titleClass = status ? statusTitleVariants[status] : statusTitleVariants.info

    return (
      <div
        ref={ref}
        className={cn(statusCardVariants({ status, className }))}
        {...props}
      >
        {icon && (
          <div className={cn("flex justify-center mb-2", titleClass)}>
            {icon}
          </div>
        )}
        <p className={cn("text-xs font-bold uppercase tracking-wider mb-2", titleClass)}>
          {title}
        </p>
        <p className={cn("text-xl font-heading font-black uppercase", textClass)}>
          {value}
        </p>
      </div>
    )
  }
)
StatusCard.displayName = "StatusCard"

export { StatusCard, statusCardVariants }
