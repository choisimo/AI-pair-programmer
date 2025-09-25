/**
 * Icon Wrapper Component
 * Implements TASK-042: 공통 UI 컴포넌트 라이브러리 스캐폴드
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Import commonly used icons
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Home,
  Info,
  Loader2,
  Lock,
  Mail,
  Menu,
  Moon,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Star,
  Sun,
  Trash2,
  Upload,
  User,
  X,
  XCircle
} from "lucide-react"

// Icon registry for dynamic icon loading
const iconRegistry = {
  // Status icons
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  'check': Check,
  'check-circle': CheckCircle,
  'info': Info,
  'x-circle': XCircle,
  
  // Navigation icons
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'external-link': ExternalLink,
  'home': Home,
  
  // Action icons
  'copy': Copy,
  'download': Download,
  'edit': Edit,
  'eye': Eye,
  'eye-off': EyeOff,
  'loader': Loader2,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  'plus': Plus,
  'search': Search,
  'trash': Trash2,
  'upload': Upload,
  'x': X,
  
  // UI icons
  'file-text': FileText,
  'help-circle': HelpCircle,
  'lock': Lock,
  'mail': Mail,
  'menu': Menu,
  'moon': Moon,
  'settings': Settings,
  'star': Star,
  'sun': Sun,
  'user': User,
} as const

type IconName = keyof typeof iconRegistry

const iconVariants = cva(
  "inline-block shrink-0",
  {
    variants: {
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
        "2xl": "h-10 w-10"
      },
      color: {
        default: "text-current",
        primary: "text-primary",
        secondary: "text-secondary-foreground",
        muted: "text-muted-foreground",
        destructive: "text-destructive",
        success: "text-green-600",
        warning: "text-yellow-600",
        info: "text-blue-600"
      }
    },
    defaultVariants: {
      size: "md",
      color: "default"
    }
  }
)

export interface IconProps
  extends Omit<React.SVGProps<SVGSVGElement>, "color">,
    VariantProps<typeof iconVariants> {
  name: IconName
  decorative?: boolean
  spin?: boolean
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ 
    name, 
    size, 
    color, 
    className, 
    decorative = false,
    spin = false,
    ...props 
  }, ref) => {
    const IconComponent = iconRegistry[name]
    
    if (!IconComponent) {
      console.warn(`Icon "${name}" not found in registry`)
      return null
    }

    return (
      <IconComponent
        ref={ref}
        className={cn(
          iconVariants({ size, color }),
          spin && "animate-spin",
          className
        )}
        aria-hidden={decorative}
        {...props}
      />
    )
  }
)

Icon.displayName = "Icon"

// Predefined icon components for common use cases
export function LoadingIcon({ 
  size = "md", 
  className,
  ...props 
}: Omit<IconProps, "name" | "spin">) {
  return (
    <Icon
      name="loader"
      size={size}
      spin
      className={className}
      decorative
      {...props}
    />
  )
}

export function StatusIcon({ 
  status,
  size = "md",
  className,
  ...props
}: Omit<IconProps, "name" | "color"> & {
  status: "success" | "error" | "warning" | "info"
}) {
  const iconMap = {
    success: "check-circle" as const,
    error: "x-circle" as const,
    warning: "alert-triangle" as const,
    info: "info" as const
  }
  
  const colorMap = {
    success: "success" as const,
    error: "destructive" as const,
    warning: "warning" as const,
    info: "info" as const
  }

  return (
    <Icon
      name={iconMap[status]}
      color={colorMap[status]}
      size={size}
      className={className}
      {...props}
    />
  )
}

export function ChevronIcon({ 
  direction,
  size = "md",
  className,
  ...props
}: Omit<IconProps, "name"> & {
  direction: "up" | "down" | "left" | "right"
}) {
  const iconMap = {
    up: "chevron-up" as const,
    down: "chevron-down" as const,
    left: "chevron-left" as const,
    right: "chevron-right" as const
  }

  return (
    <Icon
      name={iconMap[direction]}
      size={size}
      className={className}
      {...props}
    />
  )
}

// Icon button component
export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  icon: IconName
  iconSize?: IconProps["size"]
  iconColor?: IconProps["color"]
  variant?: "ghost" | "outline" | "solid"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
  label: string // Required for accessibility
}

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        ghost: "hover:bg-accent hover:text-accent-foreground",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        solid: "bg-primary text-primary-foreground hover:bg-primary/90"
      },
      size: {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12"
      }
    },
    defaultVariants: {
      variant: "ghost",
      size: "md"
    }
  }
)

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ 
    icon,
    iconSize,
    iconColor,
    variant,
    size,
    isLoading = false,
    label,
    className,
    disabled,
    ...props 
  }, ref) => {
    const iconSizeMap = {
      sm: "sm" as const,
      md: "md" as const,
      lg: "lg" as const
    }

    return (
      <button
        ref={ref}
        className={cn(iconButtonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        aria-label={label}
        title={label}
        {...props}
      >
        {isLoading ? (
          <LoadingIcon size={iconSize || iconSizeMap[size || "md"]} />
        ) : (
          <Icon
            name={icon}
            size={iconSize || iconSizeMap[size || "md"]}
            color={iconColor}
            decorative
          />
        )}
        <span className="sr-only">{label}</span>
      </button>
    )
  }
)

IconButton.displayName = "IconButton"

// Export icon registry for external use
export const availableIcons = Object.keys(iconRegistry) as IconName[]

export { Icon, iconVariants, iconRegistry }
export type { IconName }
