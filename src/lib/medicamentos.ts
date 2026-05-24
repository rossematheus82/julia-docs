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
  { id: 'dpoc-becfor-gli', nome: 'Beclometasona + Formoterol + Glicopirrônio', apresentacao: '(100+6+12,5 mcg)/dose aerossol', idadeMinima: 18, doenca: 'dpoc' },
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
