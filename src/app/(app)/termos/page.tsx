import Link from 'next/link'
import { FileText } from 'lucide-react'

const sections = [
  {
    title: 'Uso permitido',
    body: 'O Júlia Docs deve ser usado apenas por usuários autorizados, vinculados a um ambulatório, para apoiar cadastro de pacientes, preenchimento de LMEs, emissão documental e acompanhamento assistencial.',
  },
  {
    title: 'Quem pode usar',
    body: 'O acesso é destinado a profissionais e usuários autorizados pelo ambulatório responsável. O usuário deve manter seus dados de perfil atualizados e informar a administração caso deixe de atuar no serviço ou não deva mais acessar a plataforma.',
  },
  {
    title: 'Cadastro, convite e ambulatório',
    body: 'O cadastro depende de convite válido de ambulatório. O usuário só deve entrar em ambulatórios nos quais tenha autorização. Administradores podem revisar permissões, remover membros ou suspender acessos quando necessário para segurança e organização do serviço.',
  },
  {
    title: 'Responsabilidade do usuário',
    body: 'O usuário é responsável por revisar dados de pacientes, informações clínicas, medicamentos, CID-10, documentos gerados e dados do médico antes de salvar, baixar ou protocolar qualquer documento.',
  },
  {
    title: 'Relação assistencial e dados do paciente',
    body: 'Antes de inserir dados de pacientes, o usuário deve observar as regras do serviço, a legislação aplicável e a finalidade assistencial ou documental do atendimento. A plataforma não deve ser usada para consultar ou tratar dados de pessoas sem necessidade relacionada ao ambulatório.',
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
    title: 'Uso aceitável',
    body: 'É proibido tentar acessar dados de ambulatórios não autorizados, burlar controles de segurança, compartilhar credenciais, inserir informações falsas de forma intencional, exportar dados sem justificativa ou usar a plataforma para finalidade incompatível com o atendimento.',
  },
  {
    title: 'Administração e suspensão',
    body: 'O acesso pode ser suspenso ou revisado em caso de uso indevido, risco de segurança, saída do serviço, solicitação administrativa ou necessidade de proteção dos dados.',
  },
  {
    title: 'Comunicação com a administração',
    body: 'Solicitações, suspeitas de erro, incidentes, revisão de acesso ou demandas de privacidade devem ser enviadas pela aba flutuante Sugestões / Erros, sem incluir dados de pacientes no texto livre.',
  },
  {
    title: 'Disponibilidade e manutenção',
    body: 'A plataforma pode ficar temporariamente indisponível por manutenção, atualização, falha técnica ou dependência de serviços externos. Sempre revise e guarde os documentos necessários conforme o fluxo do serviço.',
  },
  {
    title: 'Limitações',
    body: 'O Júlia Docs é uma ferramenta de apoio operacional. Ele não substitui julgamento clínico, conferência médica, regras oficiais do CEAF/SES-MG ou responsabilidade profissional sobre o conteúdo emitido.',
  },
  {
    title: 'Atualizações dos termos',
    body: 'Estes termos podem ser atualizados para refletir mudanças na plataforma, segurança, governança ou requisitos legais. O uso continuado da plataforma pressupõe ciência das regras vigentes.',
  },
]

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
    </div>
  )
}
