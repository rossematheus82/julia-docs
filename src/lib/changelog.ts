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
