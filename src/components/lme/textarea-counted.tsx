'use client'

import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (value: string) => void
  maxLength: number
  placeholder?: string
  className?: string
}

/** Textarea com limite de caracteres e contador. O limite reflete o que cabe na
 *  caixa correspondente do PDF (ver src/lib/pdf/text-limits.ts). */
export function TextareaCounted({ value, onChange, maxLength, placeholder, className }: Props) {
  const len = value?.length ?? 0
  const near = len >= maxLength * 0.9
  return (
    <div className="relative">
      <Textarea
        className={cn('text-sm pr-14', className)}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <span
        className={cn(
          'pointer-events-none absolute bottom-1.5 right-2 text-[10px] tabular-nums',
          near ? 'text-amber-600' : 'text-gray-400',
        )}
      >
        {len}/{maxLength}
      </span>
    </div>
  )
}
