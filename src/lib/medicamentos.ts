export interface Medicamento {
  id: string
  nome: string
  apresentacao: string
  idadeMinima: number
  doenca: 'asma' | 'dpoc' | 'dpi-fp' | 'hap'
  obs?: string
}

export const MEDICAMENTOS: Medicamento[] = [
  // ASMA
  { id: 'asma-bud200', nome: 'Budesonida', apresentacao: '200 mcg cápsula inalante', idadeMinima: 4, doenca: 'asma' },
  { id: 'asma-bud400', nome: 'Budesonida', apresentacao: '400 mcg cápsula inalante', idadeMinima: 4, doenca: 'asma' },
  { id: 'asma-fen100', nome: 'Fenoterol', apresentacao: '100 mcg aerossol 200 doses', idadeMinima: 4, doenca: 'asma' },
  { id: 'asma-for12', nome: 'Formoterol', apresentacao: '12 mcg cápsula inalante', idadeMinima: 6, doenca: 'asma' },
  { id: 'asma-for6bud200cap', nome: 'Formoterol 6 mcg + Budesonida 200 mcg', apresentacao: 'cápsula inalante', idadeMinima: 6, doenca: 'asma' },
  { id: 'asma-for6bud200po', nome: 'Formoterol 6 mcg + Budesonida 200 mcg', apresentacao: 'pó inalante 60 doses', idadeMinima: 6, doenca: 'asma' },
  { id: 'asma-for12bud400po', nome: 'Formoterol 12 mcg + Budesonida 400 mcg', apresentacao: 'pó inalante 60 doses', idadeMinima: 6, doenca: 'asma' },
  { id: 'asma-for12bud400cap', nome: 'Formoterol 12 mcg + Budesonida 400 mcg', apresentacao: 'cápsula inalante', idadeMinima: 6, doenca: 'asma' },
  { id: 'asma-mepo', nome: 'Mepolizumabe', apresentacao: '100 mg/mL solução injetável', idadeMinima: 18, doenca: 'asma' },
  { id: 'asma-omali', nome: 'Omalizumabe', apresentacao: '150 mg solução injetável', idadeMinima: 6, doenca: 'asma', obs: 'Não indicado para CID J45.1' },

  // DPOC
  { id: 'dpoc-bud200', nome: 'Budesonida', apresentacao: '200 mcg cápsula inalante', idadeMinima: 0, doenca: 'dpoc' },
  { id: 'dpoc-bud400', nome: 'Budesonida', apresentacao: '400 mcg cápsula inalante', idadeMinima: 0, doenca: 'dpoc' },
  { id: 'dpoc-becfor-gli', nome: 'DIPROPIONATO DE BECLOMETASONA + BROMETO DE GLICOPIRRÔNIO + FUMARATO DE FORMOTEROL', apresentacao: '(100MCG + 12,5MCG + 6MCG) 120 DOSES', idadeMinima: 18, doenca: 'dpoc' },
  { id: 'dpoc-fen100', nome: 'Fenoterol', apresentacao: '100 mcg aerossol', idadeMinima: 0, doenca: 'dpoc' },
  { id: 'dpoc-for12', nome: 'Formoterol', apresentacao: '12 mcg cápsula inalante', idadeMinima: 0, doenca: 'dpoc' },
  { id: 'dpoc-for6bud200cap', nome: 'Formoterol 6 mcg + Budesonida 200 mcg', apresentacao: 'cápsula inalante', idadeMinima: 0, doenca: 'dpoc' },
  { id: 'dpoc-for12bud400cap', nome: 'Formoterol 12 mcg + Budesonida 400 mcg', apresentacao: 'cápsula inalante', idadeMinima: 0, doenca: 'dpoc' },
  { id: 'dpoc-flut-ume-vil', nome: 'Fluticasona + Umeclidínio + Vilanterol', apresentacao: '(100+62,5+25 mcg) pó inalante 30 doses', idadeMinima: 18, doenca: 'dpoc' },
  { id: 'dpoc-gli50', nome: 'Glicopirrônio', apresentacao: '50 mcg cápsula inalante', idadeMinima: 0, doenca: 'dpoc' },
  { id: 'dpoc-sal25flut125', nome: 'Salmeterol 25 mcg + Fluticasona 125 mcg', apresentacao: 'aerossol', idadeMinima: 0, doenca: 'dpoc' },
  { id: 'dpoc-sal25flut250', nome: 'Salmeterol 25 mcg + Fluticasona 250 mcg', apresentacao: 'aerossol', idadeMinima: 0, doenca: 'dpoc' },
  { id: 'dpoc-sal50flut250', nome: 'Salmeterol 50 mcg + Fluticasona 250 mcg', apresentacao: 'pó inalante', idadeMinima: 0, doenca: 'dpoc' },
  { id: 'dpoc-tio25spray', nome: 'Tiotrópio', apresentacao: '2,5 mcg spray 60 doses', idadeMinima: 0, doenca: 'dpoc' },
  { id: 'dpoc-tio-olo', nome: 'Tiotrópio 2,5 mcg + Olodaterol 2,5 mcg', apresentacao: 'solução para inalação 60 doses', idadeMinima: 18, doenca: 'dpoc' },
  { id: 'dpoc-ume625', nome: 'Umeclidínio', apresentacao: '62,5 mcg pó inalante 30 doses', idadeMinima: 0, doenca: 'dpoc' },
  { id: 'dpoc-ume-vil', nome: 'Umeclidínio 62,5 mcg + Vilanterol 25 mcg', apresentacao: 'pó inalante 30 doses', idadeMinima: 18, doenca: 'dpoc' },

  // DPI-FP
  { id: 'dpifp-pirf267', nome: 'Pirfenidona', apresentacao: '267 mg cápsula', idadeMinima: 18, doenca: 'dpi-fp' },
  { id: 'dpifp-nint150', nome: 'Nintedanibe', apresentacao: '150 mg cápsula', idadeMinima: 18, doenca: 'dpi-fp' },

  // HAP
  { id: 'hap-ambri5', nome: 'Ambrisentana', apresentacao: '5 mg comprimido revestido', idadeMinima: 18, doenca: 'hap' },
  { id: 'hap-ambri10', nome: 'Ambrisentana', apresentacao: '10 mg comprimido revestido', idadeMinima: 18, doenca: 'hap' },
  { id: 'hap-bos625', nome: 'Bosentana', apresentacao: '62,5 mg comprimido revestido', idadeMinima: 0, doenca: 'hap' },
  { id: 'hap-bos125', nome: 'Bosentana', apresentacao: '125 mg comprimido revestido', idadeMinima: 0, doenca: 'hap' },
  { id: 'hap-ilo10', nome: 'Iloprosta', apresentacao: '10 mcg/mL solução para nebulização ampola 1 mL', idadeMinima: 0, doenca: 'hap' },
  { id: 'hap-sil20', nome: 'Sildenafila', apresentacao: '20 mg comprimido', idadeMinima: 0, doenca: 'hap' },
]

export type RequestTypeLite = 'inicial' | 'renovacao' | 'reavaliacao'

export interface SugestaoPosologia {
  /** Texto da posologia. Pode conter quebras de linha (`\n`). */
  posologia: string
  /**
   * Quantidade sugerida por mês (1º ao 6º). Opcional — só preenchemos onde a
   * conta é exata (orais sólidos, cápsulas e injetáveis). Inalatórios em
   * aerossol/pó/spray ficam com a quantidade padrão (médico ajusta o nº de
   * frascos/dispositivos).
   */
  quantidades?: [string, string, string, string, string, string]
}

/** Mesma quantidade nos 6 meses (açúcar p/ o mapa abaixo). */
function q6(n: string): [string, string, string, string, string, string] {
  return [n, n, n, n, n, n]
}

/**
 * Posologia/quantidade sugeridas ao marcar o medicamento, pré-preenchendo o
 * editor (o médico ainda pode ajustar). Variam por tipo de processo: a 1ª LME
 * (`inicial`) de alguns fármacos exige titulação de dose; a renovação já vai na
 * dose plena de manutenção.
 */
const SUGESTOES_POSOLOGIA: Record<string, { inicial: SugestaoPosologia; manutencao: SugestaoPosologia }> = {
  // ── ASMA ──────────────────────────────────────────────────────────────────
  'asma-bud200': mesma({ posologia: 'Realizar 1 inalação (cápsula de 200 mcg), via oral, de 12/12 horas.', quantidades: q6('60') }),
  'asma-bud400': mesma({ posologia: 'Realizar 1 inalação (cápsula de 400 mcg), via oral, de 12/12 horas.', quantidades: q6('60') }),
  'asma-fen100': mesma({ posologia: 'Realizar 1 a 2 jatos, via oral, se falta de ar (resgate).' }),
  'asma-for12': mesma({ posologia: 'Realizar 1 inalação (cápsula de 12 mcg), via oral, de 12/12 horas.', quantidades: q6('60') }),
  'asma-for6bud200cap': mesma({ posologia: 'Realizar 1 inalação (cápsula), via oral, de 12/12 horas.', quantidades: q6('60') }),
  'asma-for6bud200po': mesma({ posologia: 'Realizar 1 inalação, via oral, de 12/12 horas.' }),
  'asma-for12bud400po': mesma({ posologia: 'Realizar 1 inalação, via oral, de 12/12 horas.' }),
  'asma-for12bud400cap': mesma({ posologia: 'Realizar 1 inalação (cápsula), via oral, de 12/12 horas.', quantidades: q6('60') }),
  'asma-mepo': mesma({ posologia: 'Aplicar 100 mg, via subcutânea, a cada 4 semanas.', quantidades: q6('1') }),
  'asma-omali': mesma({ posologia: 'Aplicar dose conforme peso e IgE sérica, via subcutânea, a cada 2 a 4 semanas.' }),

  // ── DPOC ──────────────────────────────────────────────────────────────────
  'dpoc-bud200': mesma({ posologia: 'Realizar 1 inalação (cápsula de 200 mcg), via oral, de 12/12 horas.', quantidades: q6('60') }),
  'dpoc-bud400': mesma({ posologia: 'Realizar 1 inalação (cápsula de 400 mcg), via oral, de 12/12 horas.', quantidades: q6('60') }),
  'dpoc-becfor-gli': mesma({ posologia: 'Realizar 2 jatos, via oral, de 12/12 horas.' }),
  'dpoc-fen100': mesma({ posologia: 'Realizar 1 a 2 jatos, via oral, se falta de ar (resgate).' }),
  'dpoc-for12': mesma({ posologia: 'Realizar 1 inalação (cápsula de 12 mcg), via oral, de 12/12 horas.', quantidades: q6('60') }),
  'dpoc-for6bud200cap': mesma({ posologia: 'Realizar 1 inalação (cápsula), via oral, de 12/12 horas.', quantidades: q6('60') }),
  'dpoc-for12bud400cap': mesma({ posologia: 'Realizar 1 inalação (cápsula), via oral, de 12/12 horas.', quantidades: q6('60') }),
  'dpoc-flut-ume-vil': mesma({ posologia: 'Realizar 1 inalação, via oral, pela manhã.' }),
  'dpoc-gli50': mesma({ posologia: 'Realizar 1 inalação (cápsula de 50 mcg), via oral, pela manhã.', quantidades: q6('30') }),
  'dpoc-sal25flut125': mesma({ posologia: 'Realizar 2 jatos, via oral, de 12/12 horas.' }),
  'dpoc-sal25flut250': mesma({ posologia: 'Realizar 2 jatos, via oral, de 12/12 horas.' }),
  'dpoc-sal50flut250': mesma({ posologia: 'Realizar 1 inalação, via oral, de 12/12 horas.' }),
  'dpoc-tio25spray': mesma({ posologia: 'Realizar 2 jatos, via oral, pela manhã.' }),
  'dpoc-tio-olo': mesma({ posologia: 'Realizar 2 jatos, via oral, pela manhã.' }),
  'dpoc-ume625': mesma({ posologia: 'Realizar 1 inalação, via oral, pela manhã.' }),
  'dpoc-ume-vil': mesma({ posologia: 'Realizar 1 inalação, via oral, pela manhã.' }),

  // ── DPI-FP ────────────────────────────────────────────────────────────────
  // Pirfenidona 267 mg — titulação nas 2 primeiras semanas na 1ª LME.
  // 1º mês = 207 cáps (7d×3 + 7d×6 + 16d×9); meses seguintes = 270 cáps (30d×9).
  'dpifp-pirf267': {
    inicial: {
      posologia:
        'Titulação:\n' +
        '1ª semana: tomar 1 cápsula (267 mg), via oral, de 8/8 horas\n' +
        '2ª semana: tomar 2 cápsulas (267 mg), via oral, de 8/8 horas\n' +
        'A partir da 3ª semana: tomar 3 cápsulas (267 mg), via oral, de 8/8 horas',
      quantidades: ['207', '270', '270', '270', '270', '270'],
    },
    manutencao: {
      posologia: 'Tomar 3 cápsulas (267 mg), via oral, de 8/8 horas.',
      quantidades: q6('270'),
    },
  },
  'dpifp-nint150': mesma({ posologia: 'Tomar 1 cápsula (150 mg), via oral, de 12/12 horas.', quantidades: q6('60') }),

  // ── HAP ───────────────────────────────────────────────────────────────────
  'hap-ambri5': mesma({ posologia: 'Tomar 1 comprimido (5 mg), via oral, 1 vez ao dia.', quantidades: q6('30') }),
  'hap-ambri10': mesma({ posologia: 'Tomar 1 comprimido (10 mg), via oral, 1 vez ao dia.', quantidades: q6('30') }),
  'hap-bos625': mesma({ posologia: 'Tomar 1 comprimido (62,5 mg), via oral, de 12/12 horas (dose inicial — primeiras 4 semanas).', quantidades: q6('60') }),
  'hap-bos125': mesma({ posologia: 'Tomar 1 comprimido (125 mg), via oral, de 12/12 horas.', quantidades: q6('60') }),
  'hap-ilo10': mesma({ posologia: 'Realizar nebulização com 1 ampola, via inalatória, 6 vezes ao dia.', quantidades: q6('180') }),
  'hap-sil20': mesma({ posologia: 'Tomar 1 comprimido (20 mg), via oral, de 8/8 horas.', quantidades: q6('90') }),
}

/** Mesma sugestão para 1ª LME e renovação (medicamentos sem titulação). */
function mesma(s: SugestaoPosologia): { inicial: SugestaoPosologia; manutencao: SugestaoPosologia } {
  return { inicial: s, manutencao: s }
}

/**
 * Sugestão de posologia/quantidade para um medicamento, conforme o tipo de
 * processo. Retorna `null` se não houver sugestão cadastrada para o `medId`.
 */
export function getSugestaoPosologia(
  medId: string,
  requestType?: RequestTypeLite | null,
): SugestaoPosologia | null {
  const s = SUGESTOES_POSOLOGIA[medId]
  if (!s) return null
  return requestType === 'renovacao' ? s.manutencao : s.inicial
}

export function getMedicamentosByDoenca(doenca: Medicamento['doenca']) {
  return MEDICAMENTOS.filter(m => m.doenca === doenca)
}

export function checkIdadeRestricao(medicamento: Medicamento, idadeAnos: number): boolean {
  return idadeAnos >= medicamento.idadeMinima
}

export function getMedicamentosViolados(medicamentoIds: string[], idadeAnos: number): string[] {
  return medicamentoIds
    .map(id => MEDICAMENTOS.find(m => m.id === id))
    .filter((m): m is Medicamento => !!m && !checkIdadeRestricao(m, idadeAnos))
    .map(m => `${m.nome} ${m.apresentacao} (mínimo ${m.idadeMinima} anos)`)
}
