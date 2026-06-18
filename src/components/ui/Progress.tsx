import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number // 0-100
  className?: string
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'cyan'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

function Progress({ value, className, color: _color = 'indigo', size = 'md', showLabel = false }: ProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value))

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  const getColor = (val: number) => {
    if (val >= 80) return 'bg-emerald-500'
    if (val >= 60) return 'bg-indigo-500'
    if (val >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full rounded-full bg-[#242736]', sizes[size])}>
        <div
          className={cn('rounded-full transition-all duration-500 ease-out', sizes[size], getColor(clampedValue))}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-400 mt-1">{clampedValue}%</span>
      )}
    </div>
  )
}

export { Progress }
