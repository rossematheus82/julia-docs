import type { DpiFpFormData } from '@/lib/schemas/dpi-fp'

// Maps DpiFpFormData → PDF AcroForm field names
// PDF has 21 fields: Text1-Text11, Button13-Button26 (com gaps)
export function buildDpiFpMappings(data: DpiFpFormData, fillDate: string) {
  const [dia, mes, ano] = fillDate.split('/')
  const pt = data.progressao_tcar ?? {}
  const pf = data.piora_funcional ?? {}

  // Fallback: se a classificação não foi preenchida no formulário, deriva do CID-10.
  // J84.1 = FPI; demais CIDs do grupo DPI-FP (J84.8, J84.9, J67, J99.0/1/8) = não-FPI.
  // O CID é injetado em `data.cid10` pelo enrichment em /api/pdf/generate.
  const cidRaw = (data as DpiFpFormData & { cid10?: string }).cid10
  const cid = typeof cidRaw === 'string' ? cidRaw.trim().toUpperCase() : ''
  const classificacao = data.classificacao
    ?? (cid === 'J84.1' ? 'fpi' : cid ? 'nao_fpi' : undefined)

  return {
    text: {
      Text1: data.nome_civil ?? '',
      Text2: data.nome_social ?? '', // 2ª linha (verificar)
      Text3: data.idade ?? '',       // topo-direita = IDADE (era nome_social, errado)
      // Text4/Text7/Text8 são desenhados manualmente (wrappedText) p/ quebra de linha
      Text5: data.exacerbacoes_qtd ?? '',
      // Data de preenchimento (por posição x: Text10=dia, Text11=mês, Text9=ano)
      Text10: dia ?? '',
      Text11: mes ?? '',
      Text9:  ano ?? '',
    },
    checkboxes: {
      Button14: Boolean(pt.bronquiectasia_tracao),
      Button15: Boolean(pt.vidro_fosco_bronquiectasia),
      Button16: Boolean(pt.reticulacao_fina),
      Button17: Boolean(pt.reticulacao_grosseira),
      Button18: Boolean(pt.faveolamento),
      Button19: Boolean(pt.perda_volume_lobar),
    },
    radios: {
      // ATENÇÃO: nomes enganosos (confirmado via diagnóstico visual) —
      //   Button26 = Classificação: #1=FPI(<2>, topo y=648), #0=não-FPI(<1>, y=615)
      Button26: classificacao === 'fpi' ? '<2>' : classificacao === 'nao_fpi' ? '<1>' : '',
      Button24: data.mrc ? `<${parseInt(data.mrc) + 1}>` : '',
      Button25: data.exacerbacoes_ultimo_ano ? '<1>' : '<2>',
    },
    // Button13 = Piora funcional (CVF=#0, DLCO=#1). É um radio no PDF, mas os dois critérios
    // são independentes — podem ser marcados ao mesmo tempo. Por isso usamos radiosMulti.
    radiosMulti: {
      Button13: [
        ...(pf.declinio_cvf_5 ? [0] : []),
        ...(pf.declinio_dlco_10 ? [1] : []),
      ],
    },
    // Campos de texto longo desenhados manualmente com quebra de linha (flatten não quebra)
    wrappedText: {
      Text4: data.caracteristicas_clinicas ?? '', // características clínicas (pág 1, 474x122)
      // Tratamentos: usa o espaço GRANDE (Text7, 474x72 ~6 linhas) em vez do campo
      // pequeno "especificar" (Text6, que fica em branco)
      Text7: data.tratamentos ?? '',
      Text8: data.justificativa_troca ?? '',      // justificativa troca (pág 2, 474x111)
    },
  }
}
