import type { DpocFormData } from '@/lib/schemas/dpoc'

// Maps DpocFormData → PDF AcroForm field names
// PDF has 39 fields: Text1-Text14, Button15-Button41 (com gaps)
export function buildDpocMappings(data: DpocFormData, fillDate: string) {
  const [dia, mes, ano] = fillDate.split('/')
  const h = data.historia ?? {}
  const od = data.outros_diagnosticos ?? {}

  return {
    text: {
      // Seção 1 – Identificação (nome + idade na mesma linha, depois nome social)
      Text1: data.nome_civil,
      Text2: data.idade,
      Text3: data.nome_social ?? '',
      // Seção 3.1 – Especificações de texto inline
      Text4: h.macos_ano ?? '',
      Text5: h.poluentes_ambientais_especificacao ?? '',
      Text6: h.poluentes_ocupacionais_especificacao ?? '',
      Text7: h.outros_especificacao ?? '',
      // Seção 3.2 – Quantidades de exacerbações
      Text8: data.exacerbacoes_moderadas_qtd ?? '',
      Text9: data.exacerbacoes_graves_qtd ?? '',
      // Text10 (tratamentos atuais) e Text11 (outras observações) → wrappedText (quebra de linha)
      // Data de preenchimento (Text12=dia, Text13=mês, Text14=ano)
      Text12: dia ?? '',
      Text13: mes ?? '',
      Text14: ano ?? '',
    },
    checkboxes: {
      // Seção 3.1 – Histórico clínico (14 itens, Button16-Button29)
      // Layout em 2 colunas — mapeamento confirmado via diagnóstico visual
      Button16: h.tabagista,
      Button17: h.exposicao_poluentes_ambientais,
      Button18: h.exposicao_poluentes_ocupacionais,
      Button19: h.dispneia_controlada,
      Button26: h.dispneia_persistente,
      Button20: h.respiracao_ofegante,
      Button27: h.pressao_toracica,
      Button21: h.tosse_cronica,
      Button28: h.expectoracao,
      Button22: h.sibilancia,
      Button29: h.deficiencia_alfa1,
      Button23: h.historia_familiar,
      Button24: h.fatores_infancia,
      Button25: h.outros,
      // Seção 3.3 – Outros diagnósticos (7 itens, Button31-Button37, sem Button30)
      Button31: od.asma,
      Button32: od.tuberculose,
      Button33: od.hiv,
      Button34: od.infeccoes_broncopulmonares,
      Button35: od.bronquiectasias,
      Button36: od.bronquiolite_obliterante,
      Button37: od.icc,
    },
    radios: {
      // Seção 2 – Classificação de gravidade (Radio: <1>=A, <2>=B, <3>=E)
      Button15: data.gravidade_grupo === 'A' ? '<1>' : data.gravidade_grupo === 'B' ? '<2>' : data.gravidade_grupo === 'E' ? '<3>' : '',
      // Seção 3.2 – Houve exacerbações? (Button39: #0=SIM<1>, #1=NÃO<2>)
      Button39: data.exacerbacoes_12m ? '<1>' : '<2>',
      // Seção 4 – Em uso de medicamento p/ DPOC? (Button41: #0=SIM<1>, #1=NÃO<2>)
      // Tri-estado: só marca quando respondido. Não força NÃO quando indefinido.
      Button41: data.em_uso_medicamento === true ? '<1>' : data.em_uso_medicamento === false ? '<2>' : '',
    },
    // Seção 3.2 – Tipo de exacerbação (Button40: #0=Moderada, #1=Grave). Independentes →
    // marca cada um conforme a quantidade informada.
    radiosMulti: {
      Button40: [
        ...(data.exacerbacoes_moderadas_qtd ? [0] : []),
        ...(data.exacerbacoes_graves_qtd ? [1] : []),
      ],
    },
    // Campos de texto longo desenhados manualmente com quebra de linha
    wrappedText: {
      Text10: data.tratamentos_atuais ?? '',  // tratamentos atuais
      Text11: data.outras_observacoes ?? '',  // outras observações
    },
  }
}
