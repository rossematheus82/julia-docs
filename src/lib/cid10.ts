export interface Cid10 {
  codigo: string
  descricao: string
  doenca: 'asma' | 'dpoc' | 'dpi-fp' | 'hap'
}

export const CIDS_PRINCIPAIS: Cid10[] = [
  // ASMA
  { codigo: 'J45.0', descricao: 'Asma predominantemente alérgica', doenca: 'asma' },
  { codigo: 'J45.1', descricao: 'Asma não alérgica', doenca: 'asma' },
  { codigo: 'J45.8', descricao: 'Asma mista', doenca: 'asma' },
  { codigo: 'J45.9', descricao: 'Asma não especificada', doenca: 'asma' },
  { codigo: 'J46', descricao: 'Estado de mal asmático', doenca: 'asma' },

  // DPOC
  { codigo: 'J43.0', descricao: 'Síndrome de MacLeod', doenca: 'dpoc' },
  { codigo: 'J43.1', descricao: 'Enfisema panlobular', doenca: 'dpoc' },
  { codigo: 'J43.2', descricao: 'Enfisema centrolobular', doenca: 'dpoc' },
  { codigo: 'J43.8', descricao: 'Outros tipos de enfisema', doenca: 'dpoc' },
  { codigo: 'J43.9', descricao: 'Enfisema não especificado', doenca: 'dpoc' },
  { codigo: 'J44.0', descricao: 'DPOC com infecção respiratória aguda do trato respiratório inferior', doenca: 'dpoc' },
  { codigo: 'J44.1', descricao: 'DPOC com exacerbação aguda não especificada', doenca: 'dpoc' },
  { codigo: 'J44.8', descricao: 'Outras formas especificadas de DPOC', doenca: 'dpoc' },
  { codigo: 'J44.9', descricao: 'DPOC não especificada', doenca: 'dpoc' },

  // DPI-FP
  { codigo: 'J84.1', descricao: 'Fibrose Pulmonar Idiopática (FPI)', doenca: 'dpi-fp' },
  { codigo: 'J84.8', descricao: 'Outras doenças pulmonares intersticiais especificadas', doenca: 'dpi-fp' },
  { codigo: 'J84.9', descricao: 'Doença pulmonar intersticial não especificada', doenca: 'dpi-fp' },
  { codigo: 'J67', descricao: 'Pneumonite de hipersensibilidade a poeira orgânica', doenca: 'dpi-fp' },
  { codigo: 'J99.0', descricao: 'Doença pulmonar reumatoide', doenca: 'dpi-fp' },
  { codigo: 'J99.1', descricao: 'Doenças pulmonares em outras doenças do tecido conjuntivo', doenca: 'dpi-fp' },
  { codigo: 'J99.8', descricao: 'Doenças pulmonares em outras doenças classificadas em outra parte', doenca: 'dpi-fp' },

  // HAP
  { codigo: 'I27.0', descricao: 'Hipertensão pulmonar primária', doenca: 'hap' },
  { codigo: 'I27.2', descricao: 'Outras hipertensões pulmonares secundárias', doenca: 'hap' },
  { codigo: 'I27.8', descricao: 'Outras doenças pulmonares do coração especificadas', doenca: 'hap' },
  { codigo: 'I27.9', descricao: 'Doença pulmonar do coração não especificada', doenca: 'hap' },
]

export function getCidsByDoenca(doenca: Cid10['doenca']) {
  return CIDS_PRINCIPAIS.filter(c => c.doenca === doenca)
}
