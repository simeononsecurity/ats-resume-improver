import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated'
}

function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const variants = {
    default: 'bg-[#1a1d27] border border-[#2e3347]',
    bordered: 'bg-[#1a1d27] border border-indigo-500/30',
    elevated: 'bg-[#1a1d27] border border-[#2e3347] shadow-lg shadow-black/30',
  }
  return (
    <div className={cn('rounded-xl p-5', variants[variant], className)} {...props}>
      {children}
    </div>
  )
}

function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center gap-3 mb-4', className)} {...props}>
      {children}
    </div>
  )
}

function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-semibold text-slate-100', className)} {...props}>
      {children}
    </h3>
  )
}

function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  )
}

export { Card, CardHeader, CardTitle, CardContent }
