import * as React from "react"

// Función simple para combinar clases CSS
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ')
}

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  barClassName?: string // Nueva prop para personalizar la barra
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, barClassName, ...props }, ref) => {
    const normalizedValue = Math.min(Math.max(0, value), max)
    const percentage = (normalizedValue / max) * 100

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-gray-200",
          className
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={normalizedValue}
        {...props}
      >
        <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out bg-blue-600",
            barClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)

Progress.displayName = "Progress"

export { Progress }
