import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "bg-muted",
        text: "bg-muted/60 h-4",
        avatar: "bg-muted rounded-full",
        card: "bg-muted rounded-lg",
        button: "bg-muted rounded-md h-10",
        input: "bg-muted rounded-md h-10"
      },
      size: {
        sm: "h-4",
        md: "h-6", 
        lg: "h-8",
        xl: "h-12"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({
  className,
  variant,
  size,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant, size, className }))}
      role="status"
      aria-label="Loading..."
      {...props}
    />
  )
}

// Predefined skeleton components for common use cases
function SkeletonText({ 
  lines = 1, 
  className,
  ...props 
}: { lines?: number } & SkeletonProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          variant="text" 
          className={cn(
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

function SkeletonAvatar({ 
  size = "md",
  className,
  ...props 
}: SkeletonProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }
  
  return (
    <Skeleton
      variant="avatar"
      className={cn(sizeClasses[size || "md"], className)}
      {...props}
    />
  )
}

function SkeletonCard({ 
  className,
  children,
  ...props 
}: SkeletonProps) {
  return (
    <div className={cn("space-y-3 p-4", className)} {...props}>
      <div className="flex items-center space-x-3">
        <SkeletonAvatar />
        <div className="space-y-2 flex-1">
          <SkeletonText lines={2} />
        </div>
      </div>
      {children}
    </div>
  )
}

function SkeletonButton({ 
  className,
  ...props 
}: SkeletonProps) {
  return (
    <Skeleton
      variant="button"
      className={cn("w-20", className)}
      {...props}
    />
  )
}

function SkeletonInput({ 
  className,
  ...props 
}: SkeletonProps) {
  return (
    <Skeleton
      variant="input"
      className={cn("w-full", className)}
      {...props}
    />
  )
}

export { 
  Skeleton, 
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonButton,
  SkeletonInput,
  skeletonVariants
}
