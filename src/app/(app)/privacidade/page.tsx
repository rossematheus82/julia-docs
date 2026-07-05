import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { LEGAL_EFFECTIVE_DATE, LEGAL_PRIVACY_VERSION, LEGAL_TERMS_VERSION, PRIVACY_SECTIONS } from '@/lib/legal-content'
import { formatarDataHora } from '@/lib/utils/date'

export default async function PrivacidadePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: latestAcceptance } = await supabase
    .from('legal_acceptances')
    .select('terms_version, privacy_version, accepted_at')
    .eq('user_id', user.id)
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Privacidade e proteção de dados</h1>
          <p className="text-sm text-gray-500">Como o Júlia Docs trata informações de pacientes e usuários</p>
          <p className="text-xs text-gray-400">Versão {LEGAL_PRIVACY_VERSION} · vigente desde {LEGAL_EFFECTIVE_DATE}</p>
        </div>
      </div>

      <section className="rounded-lg border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
        <h2 className="text-base font-semibold">Seu aceite</h2>
        {latestAcceptance ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-blue-700">Termos de Uso</p>
              <p>Versão {latestAcceptance.terms_version}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-blue-700">Política de Privacidade</p>
              <p>Versão {latestAcceptance.privacy_version}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase text-blue-700">Registrado em</p>
              <p>{formatarDataHora(latestAcceptance.accepted_at)}</p>
            </div>
          </div>
        ) : (
          <p className="mt-2">
            Ainda não há aceite versionado registrado para esta conta. Novos cadastros passam a registrar
            as versões {LEGAL_TERMS_VERSION} dos Termos de Uso e {LEGAL_PRIVACY_VERSION} da Política de Privacidade.
          </p>
        )}
      </section>

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
