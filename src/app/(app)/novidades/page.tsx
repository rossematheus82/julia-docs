import { Sparkles } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CHANGELOG, type ChangeKind } from '@/lib/changelog'

const KIND_STYLES: Record<ChangeKind, { label: string; cls: string }> = {
  novo:     { label: 'Novo',     cls: 'bg-green-50 text-green-700 border-green-200' },
  melhoria: { label: 'Melhoria', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  correcao: { label: 'Correção', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
}

export default function NovidadesPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novidades</h1>
          <p className="text-gray-500 text-sm">Atualizações, melhorias e correções do sistema</p>
        </div>
      </div>

      <div className="relative pl-5 space-y-8">
        <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" aria-hidden />
        {CHANGELOG.map((entry) => (
          <div key={entry.data} className="relative">
            <div className="absolute -left-3.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-100" aria-hidden />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              {format(parseISO(entry.data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            {entry.titulo && <p className="text-sm font-semibold text-gray-900 mb-2">{entry.titulo}</p>}
            <ul className="space-y-2">
              {entry.itens.map((item, i) => {
                const k = KIND_STYLES[item.tipo]
                return (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`shrink-0 mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border ${k.cls}`}>
                      {k.label}
                    </span>
                    <span className="text-sm text-gray-700">{item.texto}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
