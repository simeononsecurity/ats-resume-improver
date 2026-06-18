import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'
}

function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30',
    success: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
    danger: 'bg-red-600/20 text-red-300 border-red-500/30',
    info: 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30',
    muted: 'bg-[#242736] text-slate-400 border-[#2e3347]',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge }
