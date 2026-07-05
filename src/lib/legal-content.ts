export type LegalSection = {
  title: string
  body: string
}

export const LEGAL_TERMS_VERSION = '2026-07-05'
export const LEGAL_PRIVACY_VERSION = '2026-07-05'
export const LEGAL_EFFECTIVE_DATE = '2026-07-05'

export const TERMS_SECTIONS: LegalSection[] = [
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

export const PRIVACY_SECTIONS: LegalSection[] = [
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
