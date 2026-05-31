import type { HapFormData } from '@/lib/schemas/hap'
import { formatarData } from '@/lib/utils/date'

// ── Field map (confirmed via inspect-hap-coords.mjs + PDF visual analysis) ──
//
// PAGE 1
//   Text1  = nome_civil
//   Text2  = nome_social
//   Text3  = nascimento DIA  (x=188, w=28)
//   Text4  = nascimento MÊS  (x=224, w=32)
//   Text5  = nascimento ANO  (x=265, w=40)
//   Text38 = CID-10          (x=113, w=437 — wide)
//   Text6  = características clínicas (multiline)
//   Text55 = cateterismo DIA (x=269, y=364, w=22)
//   Text56 = cateterismo MÊS (x=302, y=364, w=17)
//   Text57 = cateterismo ANO (x=327, y=364, w=37)
//   Text7  = PAPm
//   Text8  = POAP/PDF-VE
//   Text9  = RVP (Wood)
//   Button51 = Grupo HP      (5 opções: I-V)
//   Button52 = doença coração esquerdo  SIM/NÃO/3ª opção (x=478/524, y=580)
//   Button53 = doença pulmonar crônica  SIM/NÃO            (x=478/524, y=553)
//   Button54 = embolia pulmonar         SIM/NÃO            (x=478/524, y=526)
//   Button58 = (3 opções verticais x=70, y=332-301 — não usado; NÃO é o teste 7.1.1)
//   Button59 = teste vasorreatividade NO 7.1.1 (x=324/385 y=190, <1>=Positivo <2>=Negativo)
//   Button39 = etiologia_tipo idiopática/hereditária/drogas (x=70, y=220)
//   Button40 = etiologia_tipo associada                     (x=70, y=133)
//   Button41 = etiologia colagenoses         (x=116, y=105)
//   Button42 = etiologia HP portopulmonar    (x=116, y=88)
//   Button43 = etiologia esquistossomose     (x=116, y=72)
//   Button44 = etiologia HIV                 (x=116, y=55)
//   Button45 = etiologia cardiopatia congênita (x=116, y=39)
//   Button46 = etiologia veno-oclusiva       (x=116, y=25)
//
// PAGE 2
//   Button47 = medicamento Ambrisentana checkbox (x=93, y=705)
//   Button48 = medicamento Bosentana checkbox    (x=93, y=676)
//   Button49 = medicamento Sildenafil checkbox   (x=93, y=647)
//   Button50 = medicamento Iloprosta checkbox    (x=93, y=619)
//   Text11   = Ambrisentana posologia            (x=227, y=697)
//   Text12   = Bosentana posologia               (x=227, y=670)
//   Text13   = Sildenafil posologia              (x=227, y=640)
//   Text14   = Iloprosta posologia               (x=227, y=613)
//   Text15   = detalhar risco (sec. 9)           (x=77,  y=454 — caixa livre abaixo de "Detalhar:")
//   Button60 = risco estratificado (3 opções: baixo/intermediário/alto)
//   Button61 = classe funcional    (4 opções: I/II/III/IV)
//   Button62-66 = situações específicas SIM/NÃO
//
// PAGE 3
//   Left col (x≈227) = datas exames:
//     Text16 = eco date (y=701), Text17 = ecg date (y=673),
//     Text18 = espiro date (y=645), Text19 = tc6m date (y=620),
//     Text20 = polisso date (y=593), Text21 = angiotc date (y=549),
//     Text22 = usg date (y=523), Text23 = gasometria date (y=496),
//     Text24 = rx date (y=467)
//   Right col (x≈311) = resultados exames:
//     Text25 = eco (y=701), Text26 = ecg (y=675), Text67 = espiro (y=646),
//     Text28 = tc6m (y=618), Text29 = polisso (y=591), Text30 = angiotc (y=550),
//     Text31 = usg (y=523), Text68 = gasometria (y=496), Text33 = rx (y=469)
//   Text34 = outras observações (sec. 13)
//   Text35 = data preenchimento DIA  (x=189, y=301)
//   Text36 = data preenchimento MÊS  (x=227, y=303)
//   Text37 = data preenchimento ANO  (x=265, y=301)

export function buildHapMappings(data: HapFormData, fillDate: string) {
  const [dia, mes, ano] = fillDate.split('/')
  const m = data.medicamentos_hap ?? {}
  const s = data.situacoes ?? {}
  const ea = data.etiologia_associada ?? {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exRaw: any = data.exames
  const ex: Record<string, { data?: string; resultado?: string }> = (() => {
    if (!exRaw) return {}
    if (typeof exRaw === 'string') { try { return JSON.parse(exRaw) } catch { return {} } }
    if (typeof exRaw === 'object' && !Array.isArray(exRaw)) return exRaw
    return {}
  })()

  const splitIso = (iso: string | null | undefined): [string, string, string] => {
    const d = (iso ?? '').split('T')[0]
    const parts = d.split('-')
    if (parts.length === 3) return [parts[2] ?? '', parts[1] ?? '', parts[0] ?? '']
    return ['', '', '']
  }

  const [nascDia, nascMes, nascAno] = splitIso(data.data_nascimento)
  const [catDia,  catMes,  catAno]  = splitIso(data.cateterismo_data)

  return {
    text: {
      // Seção 1 – Identificação
      Text1: data.nome_civil ?? '',
      Text2: data.nome_social ?? '',
      // Data de nascimento (3 campos separados)
      Text3: nascDia, Text4: nascMes, Text5: nascAno,
      // Seção 3 – CID-10 (campo largo p1)
      Text38: data.cid10 ?? '',
      // Seção 5 – Características clínicas
      Text6: data.caracteristicas_clinicas ?? '',
      // Seção 6 – Cateterismo cardíaco direito
      Text55: catDia, Text56: catMes, Text57: catAno,
      Text7: data.papm ?? '',
      Text8: data.poap_pdfve ?? '',
      Text9: data.rvp_wood ?? '',
      // Seção 7.1.1 – Justificativa para não realização do teste (p1, rect [306, 173.9, 549.8, 188.2])
      Text10: data.teste_no_justificativa_nao_realizacao ?? '',
      // Seção 8 – Posologias medicamentos (p2, x=227)
      Text11: m.ambrisentana_posologia ?? '',
      Text12: m.bosentana_posologia    ?? '',
      Text13: m.sildenafil_posologia   ?? '',
      Text14: m.iloprosta_posologia    ?? '',
      // Seção 9 – Detalhar critérios do risco (p2, caixa livre logo abaixo da linha "Detalhar:")
      Text15: data.risco_detalhe ?? '',
      // Seção 13 – Outras observações (p3, caixa grande no fim da seção)
      Text34: data.outras_observacoes ?? '',
      // Seção 12 – Exames complementares (p3)
      // Todos os 9 exames têm campo de data (left col) + resultado (right col)
      Text16: formatarData(ex.ecocardiograma?.data),        Text25: ex.ecocardiograma?.resultado        ?? '',
      Text17: formatarData(ex.eletrocardiograma?.data),     Text26: ex.eletrocardiograma?.resultado     ?? '',
      Text18: formatarData(ex.espirometria?.data),          Text67: ex.espirometria?.resultado          ?? '',
      Text19: formatarData(ex.tc6m?.data),                  Text28: ex.tc6m?.resultado                  ?? '',
      Text20: formatarData(ex.polissonografia?.data),       Text29: ex.polissonografia?.resultado       ?? '',
      Text21: formatarData(ex.angiotc_cintilografia?.data), Text30: ex.angiotc_cintilografia?.resultado ?? '',
      Text22: formatarData(ex.usg_abdominal?.data),         Text31: ex.usg_abdominal?.resultado         ?? '',
      Text23: formatarData(ex.gasometria?.data),            Text68: ex.gasometria?.resultado            ?? '',
      Text24: formatarData(ex.rx_torax?.data),              Text33: ex.rx_torax?.resultado              ?? '',
      // Data de preenchimento (p3, 3 campos separados)
      Text35: dia ?? '', Text36: mes ?? '', Text37: ano ?? '',
    },
    // Campos de texto longo desenhados manualmente com quebra de linha (flatten não quebra).
    wrappedText: {
      // Campo 5 – características clínicas
      Text6: data.caracteristicas_clinicas ?? '',
      // Campo 12 – resultados dos exames (todos, p/ quebra e consistência visual)
      Text25: ex.ecocardiograma?.resultado        ?? '',
      Text26: ex.eletrocardiograma?.resultado     ?? '',
      Text67: ex.espirometria?.resultado          ?? '',
      Text28: ex.tc6m?.resultado                  ?? '',
      Text29: ex.polissonografia?.resultado       ?? '',
      Text30: ex.angiotc_cintilografia?.resultado ?? '',
      Text31: ex.usg_abdominal?.resultado         ?? '',
      Text68: ex.gasometria?.resultado            ?? '',
      Text33: ex.rx_torax?.resultado              ?? '',
      // Campo 9 – detalhar critérios do risco (p2)
      Text15: data.risco_detalhe ?? '',
      // Campo 13 – outras observações (p3)
      Text34: data.outras_observacoes ?? '',
    },
    checkboxes: {
      // Seção 7 – Tipo de etiologia (p1, x=70)
      Button39: data.etiologia_tipo === 'idiopatica_hereditaria_drogas',
      Button40: data.etiologia_tipo === 'associada',
      // Seção 7.2.1 – Etiologia associada (p1, x=116, y=105→25)
      Button41: Boolean(ea.colagenoses),
      Button42: Boolean(ea.hipertensao_portopulmonar),
      Button43: Boolean(ea.esquistossomose),
      Button44: Boolean(ea.hiv),
      Button45: Boolean(ea.cardiopatia_congenita),
      Button46: Boolean(ea.veno_oclusiva),
      // Seção 8 – Medicamentos solicitados (p2, x=93)
      Button47: Boolean(m.ambrisentana),
      Button48: Boolean(m.bosentana),
      Button49: Boolean(m.sildenafil),
      Button50: Boolean(m.iloprosta),
    },
    radios: {
      // Seção 4.1 – Grupo HP (I=<1> … V=<5>)
      Button51: data.grupo_hp
        ? `<${'I II III IV V'.split(' ').indexOf(data.grupo_hp) + 1}>`
        : '',
      // Seção 4.2 – Cofatores HP
      // Button52: o PDF tem 2 widgets em x=478 (<1> e <2> = SIM) e 1 em x=524 (<3> = NÃO)
      Button52: data.doenca_coracao_esquerdo ? '<1>' : '<3>',
      Button53: data.doenca_pulmonar_cronica  ? '<1>' : '<2>',
      Button54: data.embolia_pulmonar         ? '<1>' : '<2>',
      // Seção 7.1.1 – Teste vasorreatividade NO (Button59: x=324/385 y=190, <1>=Positivo, <2>=Negativo)
      Button59: data.teste_no_resultado === 'positivo' ? '<1>'
              : data.teste_no_resultado === 'negativo' ? '<2>'
              : '',
      // Seção 9 – Risco estratificado (p2, 3 opções)
      Button60: data.risco === 'baixo'         ? '<1>'
              : data.risco === 'intermediario' ? '<2>'
              : data.risco === 'alto'          ? '<3>'
              : '',
      // Seção 10 – Classe funcional (p2, 4 opções)
      Button61: data.classe_funcional
        ? `<${'I II III IV'.split(' ').indexOf(data.classe_funcional) + 1}>`
        : '',
      // Seção 11 – Situações específicas (p2, SIM=<1>/NÃO=<2>)
      Button62: s.doenca_hepatica_grave     ? '<1>' : '<2>',
      Button63: s.suspeita_venoclusiva      ? '<1>' : '<2>',
      Button64: s.hap_idiopatica_75anos     ? '<1>' : '<2>',
      Button65: s.hap_estavel_monoterapia   ? '<1>' : '<2>',
      Button66: s.vasorreatividade_positiva ? '<1>' : '<2>',
    },
  }
}
