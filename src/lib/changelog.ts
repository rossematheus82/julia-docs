/**
 * Changelog exibido em /novidades. Para registrar uma novidade, adicione um
 * objeto NO TOPO da lista (mais recente primeiro). `tipo` controla o rótulo
 * colorido de cada item.
 */
export type ChangeKind = 'novo' | 'melhoria' | 'correcao'

export interface ChangelogItem {
  tipo: ChangeKind
  texto: string
}

export interface ChangelogEntry {
  /** ISO YYYY-MM-DD */
  data: string
  titulo?: string
  itens: ChangelogItem[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    data: '2026-07-04',
    itens: [
      { tipo: 'melhoria', texto: 'Sessões autenticadas agora são encerradas automaticamente após período de inatividade, com aviso antes do logout.' },
      { tipo: 'novo', texto: 'Página de Privacidade adicionada e painel administrativo agora mostra auditoria recente de ações sensíveis da plataforma.' },
      { tipo: 'melhoria', texto: 'CPF e CNS agora aparecem mascarados em listas e telas de seleção, mantendo a busca por documento e a conferência completa apenas nos detalhes e PDFs.' },
      { tipo: 'correcao', texto: 'Exclusão de pacientes ficou mais restrita: usuário comum só remove paciente que cadastrou, enquanto administradores do ambulatório mantêm controle do ambulatório.' },
    ],
  },
  {
    data: '2026-07-01',
    itens: [
      { tipo: 'correcao', texto: 'Datas, horários, idades e prazos de renovação agora usam o horário de Brasília de forma consistente nas telas e PDFs.' },
    ],
  },
  {
    data: '2026-06-24',
    itens: [
      { tipo: 'melhoria', texto: 'Na criação de uma nova LME, o item 12 (tratamento prévio ou atual) não vem mais marcado como “Não”: agora é obrigatório confirmar SIM ou NÃO antes de continuar.' },
      { tipo: 'melhoria', texto: 'O campo de anamnese da LME agora aceita até 1.000 caracteres; o texto é ajustado automaticamente dentro da caixa oficial do PDF, e a IA também respeita o novo limite.' },
      { tipo: 'novo', texto: 'DPOC: adicionadas as apresentações em pó inalante de formoterol 6 mcg + budesonida 200 mcg e formoterol 12 mcg + budesonida 400 mcg, ambas com 60 doses.' },
      { tipo: 'melhoria', texto: 'DPOC: a combinação de beclometasona + glicopirrônio + formoterol agora informa a apresentação completa: solução aerossol com 120 doses.' },
      { tipo: 'correcao', texto: 'Prescrições com nomes ou combinações longas de medicamentos agora quebram linha automaticamente e não ultrapassam a margem do PDF.' },
    ],
  },
  {
    data: '2026-06-22',
    itens: [
      { tipo: 'correcao', texto: 'DPOC: medicamento DIPROPIONATO DE BECLOMETASONA + BROMETO DE GLICOPIRRÔNIO + FUMARATO DE FORMOTEROL corrigido na ordem oficial e com apresentação de 120 doses.' },
      { tipo: 'melhoria', texto: 'Cadastro de pacientes agora avisa em pop-up quando nome ou CPF já existem; CPF repetido bloqueia duplicidade e nome igual só pede conferência dos dados.' },
    ],
  },
  {
    data: '2026-06-13',
    itens: [
      { tipo: 'melhoria', texto: 'O CID-10 não vem mais pré-selecionado na nova LME — é preciso escolher o CID, evitando emitir com o código errado por esquecimento.' },
    ],
  },
  {
    data: '2026-06-08',
    itens: [
      { tipo: 'correcao', texto: 'Geração de PDF não falha mais quando o texto tem caracteres especiais (ex.: a seta “→” vinda do “Melhorar com IA”) — são convertidos automaticamente.' },
      { tipo: 'novo', texto: 'Página “Sobre” no menu e um botão flutuante de Sugestões / Reportar erro — seu feedback chega direto ao responsável.' },
      { tipo: 'correcao', texto: 'Receituário: a posologia agora quebra linha e cabe na página — antes estourava quando o texto era longo (ex.: titulação da pirfenidona).' },
      { tipo: 'novo', texto: 'Ao escolher o medicamento, a posologia e a quantidade já vêm sugeridas (pirfenidona com titulação na 1ª LME, nintedanibe, e os demais por doença).' },
      { tipo: 'correcao', texto: 'CNS, CRM e nome do médico no PDF passam a refletir o cadastro atual do perfil — antes ficavam presos ao momento da criação.' },
      { tipo: 'melhoria', texto: 'O botão “Renovar” aparece agora em todas as LMEs do histórico do paciente, não só na mais recente.' },
      { tipo: 'novo', texto: 'Cada LME ganhou um código de identificação (ex.: DPC-220526-7909), visível na lista, no histórico e no detalhe.' },
      { tipo: 'novo', texto: '“Melhorar com IA” na anamnese: escreva livremente e a IA revisa a redação e ajusta ao limite de caracteres do campo.' },
      { tipo: 'melhoria', texto: 'Membros do ambulatório agora aparecem pelo nome, e o proprietário pode remover membros (residentes) mantendo os pacientes e LMEs deles.' },
      { tipo: 'novo', texto: 'Esta página de Novidades, para acompanhar atualizações e correções.' },
    ],
  },
  {
    data: '2026-05-30',
    itens: [
      { tipo: 'correcao', texto: 'CID-10 restrito à lista oficial do CEAF; a IA não sugere mais CID fora dela.' },
      { tipo: 'melhoria', texto: 'Asma: diagnóstico diferencial com 18 opções e rótulo corrigido.' },
      { tipo: 'melhoria', texto: 'Layout responsivo no celular: menu vira gaveta, formulários e tabelas se ajustam à tela.' },
      { tipo: 'correcao', texto: 'Dashboard passa a usar o horário de Brasília nas contagens e renovações.' },
      { tipo: 'melhoria', texto: 'CID-10 editável na tela de editar e na renovação, mesmo com a LME já emitida.' },
    ],
  },
]
