import { ShieldCheck } from 'lucide-react'
import { PRIVACY_SECTIONS } from '@/lib/legal-content'

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Privacidade e proteção de dados</h1>
          <p className="text-sm text-gray-500">Como o Júlia Docs trata informações de pacientes e usuários</p>
        </div>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6 text-sm leading-6 text-gray-700">
        <div className="space-y-5">
          {PRIVACY_SECTIONS.map(section => (
            <div key={section.title}>
              <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
              <p className="mt-1">{section.body}</p>
            </div>
          ))}

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-blue-900">
            <h2 className="text-base font-semibold">Contato</h2>
            <p className="mt-1">
              Para tratar de privacidade, segurança, correção de dados ou revisão de acesso,
              use a aba flutuante Sugestões / Erros dentro da plataforma. Não inclua dados de pacientes na mensagem.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
