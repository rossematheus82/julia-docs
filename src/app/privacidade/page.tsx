import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-3xl space-y-6 p-6">
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
            <div>
              <h2 className="text-base font-semibold text-gray-900">Finalidade</h2>
              <p className="mt-1">
                O Júlia Docs organiza dados necessários para cadastro de pacientes, preenchimento de LMEs,
                geração de documentos do CEAF/SES-MG e acompanhamento assistencial dentro do ambulatório.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">Dados tratados</h2>
              <p className="mt-1">
                A plataforma pode tratar dados cadastrais, documentos pessoais, informações clínicas necessárias
                aos formulários, dados do médico responsável, registros de acesso e logs de auditoria.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">Acesso e segurança</h2>
              <p className="mt-1">
                O acesso aos dados é restrito ao ambulatório do usuário. A plataforma usa autenticação,
                separação por ambulatório, políticas de banco de dados, auditoria de ações e permissões
                administrativas para reduzir acessos indevidos.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">Minimização e exibição</h2>
              <p className="mt-1">
                CPF e CNS são mascarados em listas e telas de seleção. Os documentos completos ficam reservados
                para telas de detalhe, edição e PDFs oficiais, quando necessários para conferência e emissão.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">Retenção</h2>
              <p className="mt-1">
                Cadastros, LMEs e snapshots são mantidos enquanto houver necessidade assistencial, documental
                ou obrigação legal aplicável. Logs de auditoria são mantidos para segurança e rastreabilidade.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">Contato</h2>
              <p className="mt-1">
                Para solicitar correção, revisão de acesso ou tratar de privacidade, entre em contato com o
                administrador responsável pelo Júlia Docs.
              </p>
            </div>
          </div>
        </section>

        <div className="text-center">
          <Link href="/login" className="text-sm font-medium text-blue-700 hover:underline">
            Voltar para o acesso
          </Link>
        </div>
      </main>
    </div>
  )
}
