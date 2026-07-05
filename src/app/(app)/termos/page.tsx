import Link from 'next/link'
import { FileText } from 'lucide-react'
import { TERMS_SECTIONS } from '@/lib/legal-content'

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Termos de Uso</h1>
          <p className="text-sm text-gray-500">Regras básicas para uso seguro do Júlia Docs</p>
        </div>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6 text-sm leading-6 text-gray-700">
        <div className="space-y-5">
          {TERMS_SECTIONS.map(section => (
            <div key={section.title}>
              <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
              <p className="mt-1">{section.body}</p>
            </div>
          ))}

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-blue-900">
            <h2 className="text-base font-semibold">Privacidade</h2>
            <p className="mt-1">
              Estes termos devem ser lidos junto com a{' '}
              <Link href="/privacidade" className="font-medium underline">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
