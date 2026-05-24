import type { AsmaFormData } from '@/lib/schemas/asma'

// Maps AsmaFormData → PDF AcroForm field names
// PDF has 57 fields: Text1-Text24, Text59, Button25-Button58
export function buildAsmaMappings(data: AsmaFormData, fillDate: string) {
  const [dia, mes, ano] = fillDate.split('/')

  // Helper: find tratamento previo by tipo
  const trat = (tipo: string) => data.tratamentos_previos?.find(t => t.tipo === tipo)
  const ciTrat   = trat('ci')
  const labaTrat = trat('laba')
  const ciLabaTrat = trat('ci_laba')
  const sabaCiTrat = trat('saba_ci')
  const ocsTrat  = trat('ocs')
  const outrosTrat = trat('outros')

  const dd = data.diag_diferencial

  return {
    // Seção 1 – Identificação
    text: {
      Text1:  data.nome_civil,
      Text2:  data.nome_social ?? '',
      Text3:  data.idade,
      // Text4 (achados exame físico) é desenhado manualmente — ver wrappedText
      // Seção 5 – Tratamentos prévios (ordem: CI, LABA, CI+LABA, SABA+CI, OCS, Outros)
      Text5:  ciTrat?.medicamento ?? '',
      Text6:  ciTrat?.dose ?? '',
      Text7:  ciTrat?.tempo_uso ?? '',
      Text8:  labaTrat?.medicamento ?? '',
      Text9:  labaTrat?.dose ?? '',
      Text10: labaTrat?.tempo_uso ?? '',
      Text11: ciLabaTrat?.medicamento ?? '',
      Text12: ciLabaTrat?.dose ?? '',
      Text13: ciLabaTrat?.tempo_uso ?? '',
      Text14: sabaCiTrat?.medicamento ?? '',
      Text15: sabaCiTrat?.frequencia ?? '',
      Text16: sabaCiTrat?.tempo_uso ?? '',
      Text17: ocsTrat?.medicamento ?? '',
      Text18: ocsTrat?.dose ?? '',
      Text19: ocsTrat?.num_cursos_ano ?? '',
      Text20: outrosTrat?.especificacao ?? '',
      Text21: '',
      // Text22 (outras observações) é desenhado manualmente — ver wrappedText
      // Seção 9 – Data (Text24=dia, Text59=mês, Text23=ano)
      Text24: dia ?? '',
      Text59: mes ?? '',
      Text23: ano ?? '',
    },
    checkboxes: {
      // Seção 3.2 – Diagnóstico diferencial (18 itens, Button25-44 pulando 29 e 30)
      Button25: dd?.corpo_estranho_inalado ?? false,
      Button26: dd?.rinossinusite ?? false,
      Button27: dd?.disfuncao_cordas_vocais ?? false,
      Button28: dd?.obstrucao_vias_aereas_centrais ?? false,
      Button31: dd?.hiperventilacao_psicogenica ?? false,
      Button32: dd?.dpoc ?? false,
      Button33: dd?.bronquiectasias ?? false,
      Button34: dd?.refluxo_gastroesofagico ?? false,
      Button35: dd?.micoses_bronco_pulmonares ?? false,
      Button36: dd?.tuberculose_pulmonar ?? false,
      Button37: dd?.bronquite_eosinofilica ?? false,
      Button38: dd?.deficiencia_alfa1_antitripsina ?? false,
      Button39: dd?.tromboembolismo_pulmonar ?? false,
      Button40: dd?.hipertensao_arterial_pulmonar ?? false,
      Button41: dd?.doencas_pulmonares_intersticiais ?? false,
      Button42: dd?.insuficiencia_cardiaca ?? false,
      Button43: dd?.cancer_pulmao ?? false,
      Button44: dd?.tosse_medicamentos ?? false,
      // Seção 5 – checkboxes de tratamentos prévios
      Button46: !!ciTrat,
      Button47: !!labaTrat,
      Button48: !!ciLabaTrat,
      Button49: !!sabaCiTrat,
      Button50: !!ocsTrat,
      Button51: !!outrosTrat,
      // Seção 6 – Omalizumabe
      Button52: data.omalizumabe?.exacerbacao_grave_ultimo_ano ?? false,
      Button53: data.omalizumabe?.alergia_igE ?? false,
      Button54: data.omalizumabe?.igE_30_1500 ?? false,
      Button55: data.omalizumabe?.asma_grave_t2_alergica ?? false,
      // Seção 7 – Mepolizumabe
      Button56: data.mepolizumabe?.exacerbacao_grave_ultimo_ano ?? false,
      Button57: data.mepolizumabe?.eosinofilos_300 ?? false,
      Button58: data.mepolizumabe?.asma_grave_t2_eosinofilica ?? false,
    },
    // Seção 4 – Gravidade (Radio: <1>=leve, <2>=moderada, <3>=grave)
    radios: {
      Button45: data.gravidade === 'leve' ? '<1>' : data.gravidade === 'moderada' ? '<2>' : data.gravidade === 'grave' ? '<3>' : '',
    },
    // Campos de texto longo desenhados manualmente com quebra de linha
    wrappedText: {
      Text4:  data.achados_exame_fisico ?? '', // achados exame físico
      Text22: data.outras_observacoes ?? '',   // outras observações
    },
  }
}
