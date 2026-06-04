export interface Cid10 {
  codigo: string
  descricao: string
  doenca: 'asma' | 'dpoc' | 'dpi-fp' | 'hap'
}

export const CIDS_PRINCIPAIS: Cid10[] = [
  // ASMA (CEAF: J45.0, J45.1, J45.8)
  { codigo: 'J45.0', descricao: 'Asma predominantemente alérgica', doenca: 'asma' },
  { codigo: 'J45.1', descricao: 'Asma não alérgica', doenca: 'asma' },
  { codigo: 'J45.8', descricao: 'Asma mista', doenca: 'asma' },

  // DPOC (CEAF: J44.0, J44.1, J44.8)
  { codigo: 'J44.0', descricao: 'DPOC com infecção respiratória aguda do trato respiratório inferior', doenca: 'dpoc' },
  { codigo: 'J44.1', descricao: 'DPOC com exacerbação aguda não especificada', doenca: 'dpoc' },
  { codigo: 'J44.8', descricao: 'Outras formas especificadas de DPOC', doenca: 'dpoc' },

  // DPI-FP (CEAF: J84.1, J84.8, J84.9, J67, J99.0, J99.1, J99.8)
  { codigo: 'J84.1', descricao: 'Fibrose Pulmonar Idiopática (FPI)', doenca: 'dpi-fp' },
  { codigo: 'J84.8', descricao: 'Outras doenças pulmonares intersticiais especificadas', doenca: 'dpi-fp' },
  { codigo: 'J84.9', descricao: 'Doença pulmonar intersticial não especificada', doenca: 'dpi-fp' },
  { codigo: 'J67', descricao: 'Pneumonite de hipersensibilidade a poeira orgânica', doenca: 'dpi-fp' },
  { codigo: 'J99.0', descricao: 'Doença pulmonar reumatoide', doenca: 'dpi-fp' },
  { codigo: 'J99.1', descricao: 'Doenças pulmonares em outras doenças do tecido conjuntivo', doenca: 'dpi-fp' },
  { codigo: 'J99.8', descricao: 'Doenças pulmonares em outras doenças classificadas em outra parte', doenca: 'dpi-fp' },

  // HAP (CEAF: I27.0, I27.2, I27.8)
  { codigo: 'I27.0', descricao: 'Hipertensão pulmonar primária', doenca: 'hap' },
  { codigo: 'I27.2', descricao: 'Outras hipertensões pulmonares secundárias', doenca: 'hap' },
  { codigo: 'I27.8', descricao: 'Outras doenças pulmonares do coração especificadas', doenca: 'hap' },
]

export function getCidsByDoenca(doenca: Cid10['doenca']) {
  return CIDS_PRINCIPAIS.filter(c => c.doenca === doenca)
}
