// Limites de caracteres por campo de texto longo, calculados a partir das
// dimensões reais de cada caixa no PDF (Helvetica 10pt, ~11pt de altura de linha)
// com fator de folga de ~8%. Ver scripts/compute-limits.mjs.
//
// O PDF quebra linha automaticamente (campos multiline), mas caixas estreitas/baixas
// estouram verticalmente se o texto for longo demais — estes limites evitam isso.

export const SPEC_TEXT_LIMITS: Record<string, Record<string, number>> = {
  asma: {
    achados_exame_fisico: 560,
    outras_observacoes: 185,
  },
  dpoc: {
    tratamentos_atuais: 470,
    outras_observacoes: 465,
  },
  'dpi-fp': {
    caracteristicas_clinicas: 920,
    tratamentos: 530, // campo grande Text7 (474x72, ~6 linhas)
    justificativa_troca: 825,
  },
  hap: {
    caracteristicas_clinicas: 735,
    outras_observacoes: 725,
    teste_no_justificativa_nao_realizacao: 45,
    exame_resultado: 85,
    // Detalhamento do risco — caixa livre logo abaixo da linha "Detalhar:" na seção 9
    // (Text15, p2, ~470x99 → ~9 linhas × 94 chars ≈ 778 chars; cap com folga).
    risco_detalhe: 700,
  },
}

export const LME_TEXT_LIMITS: Record<string, number> = {
  anamnese: 405,
  diagnostico: 85,
  tratamento_previo_descricao: 80,
}
