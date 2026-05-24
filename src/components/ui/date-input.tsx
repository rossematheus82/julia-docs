'use client'

import { IMaskInput } from 'react-imask'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface DateInputProps {
  value?: string
  onChange?: (isoValue: string) => void
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
}

/** Input de data com máscara DD/MM/AAAA.
 *  Recebe e emite valor em formato ISO (YYYY-MM-DD) para compatibilidade com o banco. */
const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, placeholder = 'DD/MM/AAAA', className, id, disabled }, ref) => {
    // Converte YYYY-MM-DD → DD/MM/AAAA para exibição
    function isoToBr(iso?: string): string {
      if (!iso) return ''
      const parts = iso.split('-')
      if (parts.length !== 3) return iso
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }

    // Converte DD/MM/AAAA → YYYY-MM-DD para armazenar
    function brToIso(br: string): string {
      const parts = br.split('/')
      if (parts.length !== 3 || parts[2].length !== 4) return ''
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }

    return (
      <IMaskInput
        mask="00/00/0000"
        placeholder={placeholder}
        value={isoToBr(value)}
        onAccept={(val: string) => {
          if (onChange) onChange(brToIso(val))
        }}
        inputRef={ref as React.Ref<HTMLInputElement>}
        id={id}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      />
    )
  }
)
DateInput.displayName = 'DateInput'
export { DateInput }
