import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: "default" | "neon"
    showIcon?: boolean
  }
>(({ className, value, variant = "default", showIcon = false, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-3 w-full overflow-hidden rounded-full bg-secondary/60",
      variant === "neon" && "bg-darker-surface/80 border border-border/40 shadow-inner-light",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all duration-500 ease-out relative rounded-full",
        variant === "default" && "bg-primary",
        variant === "neon" && "progress-glow"
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    >
      {showIcon && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <img 
            src="/images/caliness-logo-white.png" 
            alt="" 
            className="w-3 h-3 opacity-80"
          />
        </div>
      )}
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
