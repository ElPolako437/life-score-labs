import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow hover:shadow-glow-lg active:scale-[0.98] rounded-full",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] rounded-xl",
        outline:
          "border border-border/70 bg-transparent hover:bg-secondary/50 hover:border-primary/40 text-foreground active:scale-[0.98] rounded-full",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70 active:scale-[0.98] rounded-xl",
        ghost: "hover:bg-secondary/50 hover:text-foreground active:scale-[0.98] rounded-lg",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5 active:translate-y-0 rounded-full",
        // Quiz answer option variants with solid backgrounds for visibility
        answer: "border border-border/50 bg-card text-card-foreground hover:bg-elevated-surface hover:border-primary/50 active:scale-[0.98] rounded-xl",
        answerSelected: "border-2 border-primary bg-primary text-primary-foreground shadow-glow active:scale-[0.98] rounded-xl",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-5 text-xs",
        lg: "h-13 px-10 text-base",
        xl: "h-14 px-14 text-lg",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
