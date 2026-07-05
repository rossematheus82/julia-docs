import Link from 'next/link'
import { FileText } from 'lucide-react'

const sections = [
  {
    title: 'Uso permitido',
    body: 'O Júlia Docs deve ser usado apenas por usuários autorizados, vinculados a um ambulatório, para apoiar cadastro de pacientes, preenchimento de LMEs, emissão documental e acompanhamento assistencial.',
  },
  {
    title: 'Responsabilidade do usuário',
    body: 'O usuário é responsável por revisar dados de pacientes, informações clínicas, medicamentos, CID-10, documentos gerados e dados do médico antes de salvar, baixar ou protocolar qualquer documento.',
  },
  {
    title: 'Conta e senha',
    body: 'A conta é individual. Não compartilhe senha, não utilize conta de colega e saia da plataforma ao usar computador compartilhado. Atividades realizadas na conta podem ser registradas para segurança e auditoria.',
  },
  {
    title: 'Dados pessoais e de saúde',
    body: 'O usuário deve inserir apenas dados necessários ao atendimento e à emissão dos documentos. É proibido usar a plataforma para consultar, copiar, exportar ou compartilhar dados sem finalidade assistencial, administrativa ou legal adequada.',
  },
  {
    title: 'PDFs e documentos baixados',
    body: 'Os PDFs gerados pela plataforma são baixados no computador do usuário. Após o download, o usuário deve armazenar e compartilhar esses arquivos somente por meios seguros e autorizados pelo fluxo do serviço.',
  },
  {
    title: 'Auditoria e segurança',
    body: 'A plataforma pode registrar ações sensíveis, como entrada em ambulatório, geração de PDF, alterações de LME, exclusão/arquivamento de paciente, restauração, exportação administrativa e mudanças de permissão.',
  },
  {
    title: 'Administração e suspensão',
    body: 'O acesso pode ser suspenso ou revisado em caso de uso indevido, risco de segurança, saída do serviço, solicitação administrativa ou necessidade de proteção dos dados.',
  },
  {
    title: 'Limitações',
    body: 'O Júlia Docs é uma ferramenta de apoio operacional. Ele não substitui julgamento clínico, conferência médica, regras oficiais do CEAF/SES-MG ou responsabilidade profissional sobre o conteúdo emitido.',
  },
]

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-3xl space-y-6 p-6">
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
            {sections.map(section => (
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

        <div className="text-center">
          <Link href="/login" className="text-sm font-medium text-blue-700 hover:underline">
            Voltar para o acesso
          </Link>
        </div>
      </main>
    </div>
  )
}
