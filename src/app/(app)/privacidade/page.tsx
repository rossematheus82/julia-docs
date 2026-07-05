import { ShieldCheck } from 'lucide-react'

const sections = [
  {
    title: 'Finalidade',
    body: 'O Júlia Docs organiza dados necessários para cadastro de pacientes, preenchimento de LMEs, geração de documentos do CEAF/SES-MG, acompanhamento de renovações e apoio à rotina assistencial do ambulatório.',
  },
  {
    title: 'Dados tratados',
    body: 'A plataforma pode tratar dados cadastrais, documentos pessoais, dados de contato, informações clínicas necessárias aos formulários, dados do médico responsável, dados de ambulatório, registros técnicos de acesso e logs de auditoria.',
  },
  {
    title: 'Base de uso',
    body: 'O uso dos dados ocorre para apoiar assistência à saúde, emissão documental necessária ao tratamento, cumprimento de obrigações legais/regulatórias e segurança da plataforma. Os usuários devem inserir apenas dados necessários ao atendimento e à emissão dos documentos.',
  },
  {
    title: 'Acesso e permissões',
    body: 'O acesso é separado por ambulatório. Usuários comuns acessam apenas ambulatórios em que entraram por convite. Administradores do ambulatório podem apoiar a gestão de membros. Administradores da plataforma possuem acesso restrito a funções de segurança, auditoria, suspensão, restauração e exportação administrativa.',
  },
  {
    title: 'Segurança',
    body: 'A plataforma usa autenticação, convite por ambulatório, políticas de banco de dados, timeout por inatividade, auditoria de ações sensíveis, restrição de permissões e mascaramento de CPF/CNS em listas e telas de seleção.',
  },
  {
    title: 'PDFs e arquivos baixados',
    body: 'Os PDFs são gerados sob demanda e baixados no computador do usuário. Eles não devem ser compartilhados por canais não autorizados e precisam ser armazenados em local seguro após o download.',
  },
  {
    title: 'Retenção e arquivamento',
    body: 'Cadastros, LMEs e snapshots são mantidos enquanto houver necessidade assistencial, documental ou obrigação legal aplicável. Pacientes excluídos saem dos fluxos normais, mas permanecem arquivados para histórico e auditoria.',
  },
  {
    title: 'Direitos e solicitações',
    body: 'Solicitações de correção, revisão de acesso, informação sobre dados tratados, exportação administrativa ou avaliação de arquivamento devem ser enviadas pela aba flutuante Sugestões / Erros, sem incluir dados sensíveis no texto livre.',
  },
]

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
          {sections.map(section => (
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
