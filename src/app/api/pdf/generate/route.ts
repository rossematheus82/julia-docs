import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { type SupportedDisease } from '@/lib/pdf/fill-specific'
import { gerarProcessoCompleto } from '@/lib/pdf/merge-processo'
import type { LmeCommonData } from '@/lib/schemas/lme-common'
import { dataHoje, calcularIdade, formatarCPF, formatarTelefone } from '@/lib/utils/date'
import { CIDS_PRINCIPAIS } from '@/lib/cid10'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { readJsonBody, UUID_RE, safeErrorMessage } from '@/lib/api/security'
import { auditLog } from '@/lib/security/audit'
import { logError } from '@/lib/security/logger'

type Snap = Record<string, unknown>

/** Nome da doença a partir do código CID (mesma fonte usada na UI). */
function diagnosticoDoCid(cid: string): string {
  const code = cid.trim().toUpperCase()
  return CIDS_PRINCIPAIS.find(c => c.codigo === code)?.descricao ?? ''
}

function str(v: unknown): string {
  return v != null ? String(v) : ''
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const parsed = await readJsonBody<{ lmeId?: unknown; type?: unknown }>(request, 16 * 1024)
  if ('response' in parsed) return parsed.response
  const { lmeId, type } = parsed.data

  if (!lmeId || !type) {
    return NextResponse.json({ error: 'Parâmetros obrigatórios: lmeId, type' }, { status: 400 })
  }

  if (typeof lmeId !== 'string' || !UUID_RE.test(lmeId)) {
    return NextResponse.json({ error: 'lmeId invalido' }, { status: 400 })
  }
  if (type !== 'lme' && type !== 'all') {
    return NextResponse.json({ error: 'Tipo nao suportado' }, { status: 400 })
  }

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) return NextResponse.json({ error: 'Sem workspace' }, { status: 403 })
  const memberData = { workspace_id: active.workspaceId }

  const { data: lme } = await supabase
    .from('lmes')
    .select('*')
    .eq('id', lmeId)
    .eq('workspace_id', memberData.workspace_id)
    .single()

  if (!lme) return NextResponse.json({ error: 'LME não encontrada' }, { status: 404 })

  // Dados do paciente vêm do CADASTRO ATUAL (o snapshot pode estar incompleto/desatualizado).
  // Buscamos todos os campos usados na LME/processo para que nome, mãe, CPF, CNS, nascimento,
  // sexo, raça, peso, altura, telefone, e-mail, endereço e capacidade civil sejam preenchidos.
  let currentPatient: Snap | null = null
  if (lme.patient_id) {
    const { data: cur } = await supabase
      .from('patients')
      .select('full_name, social_name, mother_name, cpf, cns, birth_date, sex, race_ethnicity, ethnicity_detail, weight_kg, height_cm, phone, email, address, is_incapable, responsible_name')
      .eq('id', lme.patient_id)
      .single()
    currentPatient = (cur ?? null) as Snap | null
  }

  // Dados do MÉDICO: só relemos do cadastro atual quando quem gera é o criador da LME.
  // Assim, edições no próprio perfil (ex.: CNS preenchido depois) refletem no PDF, mas
  // outro médico que baixa o "processo original" continua vendo o snapshot do emissor.
  let currentDoctor: Snap | null = null
  if (lme.doctor_id && lme.created_by_user_id === user.id) {
    const { data: dCur } = await supabase
      .from('doctors')
      .select('full_name, crm, crm_uf, cns')
      .eq('id', lme.doctor_id)
      .single()
    currentDoctor = (dCur ?? null) as Snap | null
  }

  try {
    const fillDate = dataHoje()
    const snapshot = (lme.patient_snapshot ?? {}) as Snap
    // Cadastro atual (campos não-vazios) sobrepõe o snapshot — garante que peso, altura,
    // nome da mãe, telefone etc. fluam pro PDF mesmo em LMEs criadas antes deste ajuste.
    const patient: Snap = currentPatient
      ? { ...snapshot, ...Object.fromEntries(Object.entries(currentPatient).filter(([, val]) => val != null && val !== '')) }
      : snapshot
    const doctorSnap = (lme.doctor_snapshot ?? {}) as Snap
    // Cadastro atual (campos não-vazios) sobrepõe o snapshot do médico — só quando o
    // requester é o criador (currentDoctor só é buscado nesse caso).
    const doctor: Snap = currentDoctor
      ? { ...doctorSnap, ...Object.fromEntries(Object.entries(currentDoctor).filter(([, val]) => val != null && val !== '')) }
      : doctorSnap
    const facility = (lme.facility_snapshot ?? {}) as Snap
    const raw      = (lme.lme_data          ?? {}) as Snap

    if (type === 'lme') {
      if (!lme.lme_data || Object.keys(lme.lme_data as object).length === 0) {
        return NextResponse.json({ error: 'Dados da LME ainda não preenchidos.' }, { status: 400 })
      }

      // Documento: priorizar CPF → CNS
      const cpfRaw = str(patient.cpf)
      const cnsRaw = str(patient.cns)
      const hasCpf = cpfRaw.replace(/\D/g, '').length === 11
      const docTipo = hasCpf ? 'CPF' : (cnsRaw ? 'CNS' : '')
      const docNumero = hasCpf ? formatarCPF(cpfRaw) : cnsRaw

      // Incapaz → preenchido_por padrão
      const isIncapaz = Boolean(patient.is_incapable)
      const preenchidoPorDefault = isIncapaz ? 'responsavel' : 'medico'

      const enriched: Partial<LmeCommonData> = {
        ...(raw as Partial<LmeCommonData>),
        // Médico / estabelecimento
        cnes:                 str(raw.cnes)                 || str(facility.cnes),
        estabelecimento_nome: str(raw.estabelecimento_nome) || str(facility.name),
        medico_nome:          str(raw.medico_nome)          || str(doctor.full_name),
        medico_cns:           str(raw.medico_cns)           || str(doctor.cns),
        // Dados do paciente
        paciente_nome:        str(raw.paciente_nome)        || str(patient.full_name),
        mae_nome:             str(raw.mae_nome)             || str(patient.mother_name),
        peso_kg:              str(raw.peso_kg)              || str(patient.weight_kg),
        altura_cm:            str(raw.altura_cm)            || str(patient.height_cm),
        telefones:            str(raw.telefones)            || formatarTelefone(str(patient.phone)),
        email_paciente:       str(raw.email_paciente)       || str(patient.email),
        raca_etnia:           (patient.race_ethnicity as LmeCommonData['raca_etnia']) ?? (raw.raca_etnia as LmeCommonData['raca_etnia']) ?? undefined,
        etnia_detalhe:        str(raw.etnia_detalhe)        || str(patient.ethnicity_detail),
        // Capacidade civil
        paciente_incapaz:     raw.paciente_incapaz != null ? Boolean(raw.paciente_incapaz) : isIncapaz,
        responsavel_nome:     str(raw.responsavel_nome)     || str(patient.responsible_name),
        // Documento
        documento_tipo:       (raw.documento_tipo as LmeCommonData['documento_tipo']) ?? (docTipo as LmeCommonData['documento_tipo']) ?? undefined,
        documento_numero:     str(raw.documento_numero)     || docNumero,
        // Tratamento prévio
        tratamento_previo:    raw.tratamento_previo != null ? Boolean(raw.tratamento_previo) : false,
        tratamento_previo_descricao: str(raw.tratamento_previo_descricao),
        // CID e diagnóstico (diagnóstico é determinado pelo CID — derivado server-side)
        cid10:                str(raw.cid10)                || lme.cid10 || '',
        diagnostico:          diagnosticoDoCid(str(raw.cid10) || lme.cid10 || '') || str(raw.diagnostico),
        // Quem preencheu
        preenchido_por:       (raw.preenchido_por as LmeCommonData['preenchido_por']) ?? preenchidoPorDefault,
        // Data
        data_solicitacao:     str(raw.data_solicitacao)     || fillDate,
      }

      // LME (SES-MG): reutiliza a MESMA geração do processo completo e extrai só a página da LME,
      // garantindo que seja idêntica à LME contida no processo.
      const specificRaw = (lme.specific_form_data ?? {}) as Snap
      const enrichedSpecific: Snap = {
        ...specificRaw,
        nome_civil:      str(specificRaw.nome_civil)      || str(patient.full_name),
        nome_social:     str(specificRaw.nome_social),
        idade:           str(specificRaw.idade)           || (calcularIdade(str(patient.birth_date)) != null ? String(calcularIdade(str(patient.birth_date))) : ''),
        data_nascimento: str(specificRaw.data_nascimento) || str(patient.birth_date),
        cid10:           str(specificRaw.cid10)           || lme.cid10 || '',
      }

      type MedItem = { nome: string; apresentacao: string; quantidades: { mes1?: string }; posologia?: string }
      const meds: MedItem[] = Array.isArray(raw.medicamentos) ? (raw.medicamentos as MedItem[]) : []
      const prescMeds = meds.map(m => ({ nome: m.nome, apresentacao: m.apresentacao, quantidade: m.quantidades?.mes1 ?? '1', posologia: m.posologia }))
      const reqMeds = meds.map(m => ({ nome: m.nome, apresentacao: m.apresentacao }))
      const patientNome = str(patient.full_name) || str(enriched.paciente_nome)

      const lmePdf = await gerarProcessoCompleto({
        disease: lme.disease as SupportedDisease,
        requestType: lme.request_type as 'inicial' | 'renovacao' | 'reavaliacao',
        lmeData: enriched as LmeCommonData,
        specificFormData: enrichedSpecific,
        fillDate,
        prescricaoData: {
          estabelecimento_nome: str(enriched.estabelecimento_nome), cnes: str(enriched.cnes), cidade: str(facility.city),
          paciente_nome: patientNome, paciente_cpf: docTipo === 'CPF' ? docNumero : undefined,
          paciente_birth_date: str(patient.birth_date), cid10: str(enriched.cid10), diagnostico: str(enriched.diagnostico),
          medico_nome: str(enriched.medico_nome), medico_crm: str(doctor.crm), medico_crm_uf: str(doctor.crm_uf),
          medico_cns: str(enriched.medico_cns), medicamentos: prescMeds, data_prescricao: fillDate,
        },
        requerimentoData: {
          unidade_solicitante: str(enriched.estabelecimento_nome), paciente_nome: patientNome,
          paciente_nome_social: str(patient.social_name) || undefined, paciente_cpf: docTipo === 'CPF' ? docNumero : undefined,
          telefones: str(enriched.telefones), medicamentos: reqMeds,
        },
        termoData: {
          paciente_nome: patientNome, paciente_nome_social: str(patient.social_name) || undefined,
          data_solicitacao: fillDate, medicamentos: reqMeds,
        },
      }, true) // apenasLme

      const diseaseLabel = ({ asma: 'Asma', dpoc: 'DPOC', 'dpi-fp': 'DPI-FP', hap: 'HAP' } as Record<string, string>)[lme.disease] ?? lme.disease
      const [dd, mm, aa] = fillDate.split('/')
      await auditLog(supabase, {
        workspaceId: memberData.workspace_id,
        userId: user.id,
        action: 'pdf_generate',
        resourceType: 'lme',
        resourceId: lmeId,
        metadata: { type },
      })
      return new NextResponse(Buffer.from(lmePdf), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="LME_${diseaseLabel}_${lmeId}_${dd}-${mm}-${aa}.pdf"`,
        },
      })
    }

    if (type === 'all') {
      // Build enriched LME data (same as 'lme' branch)
      const cpfRaw = str(patient.cpf)
      const cnsRaw = str(patient.cns)
      const hasCpf = cpfRaw.replace(/\D/g, '').length === 11
      const docTipo = hasCpf ? 'CPF' : (cnsRaw ? 'CNS' : '')
      const docNumero = hasCpf ? formatarCPF(cpfRaw) : cnsRaw
      const isIncapaz = Boolean(patient.is_incapable)
      const preenchidoPorDefault = isIncapaz ? 'responsavel' : 'medico'

      const enriched: Partial<LmeCommonData> = {
        ...(raw as Partial<LmeCommonData>),
        cnes:                 str(raw.cnes)                 || str(facility.cnes),
        estabelecimento_nome: str(raw.estabelecimento_nome) || str(facility.name),
        medico_nome:          str(raw.medico_nome)          || str(doctor.full_name),
        medico_cns:           str(raw.medico_cns)           || str(doctor.cns),
        paciente_nome:        str(raw.paciente_nome)        || str(patient.full_name),
        mae_nome:             str(raw.mae_nome)             || str(patient.mother_name),
        peso_kg:              str(raw.peso_kg)              || str(patient.weight_kg),
        altura_cm:            str(raw.altura_cm)            || str(patient.height_cm),
        telefones:            str(raw.telefones)            || formatarTelefone(str(patient.phone)),
        email_paciente:       str(raw.email_paciente)       || str(patient.email),
        raca_etnia:           (patient.race_ethnicity as LmeCommonData['raca_etnia']) ?? (raw.raca_etnia as LmeCommonData['raca_etnia']) ?? undefined,
        etnia_detalhe:        str(raw.etnia_detalhe)        || str(patient.ethnicity_detail),
        paciente_incapaz:     raw.paciente_incapaz != null ? Boolean(raw.paciente_incapaz) : isIncapaz,
        responsavel_nome:     str(raw.responsavel_nome)     || str(patient.responsible_name),
        documento_tipo:       (raw.documento_tipo as LmeCommonData['documento_tipo']) ?? (docTipo as LmeCommonData['documento_tipo']) ?? undefined,
        documento_numero:     str(raw.documento_numero)     || docNumero,
        tratamento_previo:    raw.tratamento_previo != null ? Boolean(raw.tratamento_previo) : false,
        tratamento_previo_descricao: str(raw.tratamento_previo_descricao),
        cid10:                str(raw.cid10)                || lme.cid10 || '',
        diagnostico:          diagnosticoDoCid(str(raw.cid10) || lme.cid10 || '') || str(raw.diagnostico),
        preenchido_por:       (raw.preenchido_por as LmeCommonData['preenchido_por']) ?? preenchidoPorDefault,
        data_solicitacao:     str(raw.data_solicitacao)     || fillDate,
      }

      // Build enriched specific form data
      const specificRaw = (lme.specific_form_data ?? {}) as Snap
      const enrichedSpecific: Snap = {
        ...specificRaw,
        nome_civil:      str(specificRaw.nome_civil)      || str(patient.full_name),
        nome_social:     str(specificRaw.nome_social),
        idade:           str(specificRaw.idade)           || (calcularIdade(str(patient.birth_date)) != null ? String(calcularIdade(str(patient.birth_date))) : ''),
        data_nascimento: str(specificRaw.data_nascimento) || str(patient.birth_date),
        cid10:           str(specificRaw.cid10)           || lme.cid10 || '',
      }

      // Build medication list for prescription / requerimento
      type MedItem = { nome: string; apresentacao: string; quantidades: { mes1?: string }; posologia?: string }
      const meds: MedItem[] = Array.isArray(raw.medicamentos) ? (raw.medicamentos as MedItem[]) : []

      const prescMeds = meds.map(m => ({
        nome: m.nome,
        apresentacao: m.apresentacao,
        quantidade: m.quantidades?.mes1 ?? '1',
        posologia: m.posologia,
      }))

      const reqMeds = meds.map(m => ({ nome: m.nome, apresentacao: m.apresentacao }))

      const patientNome = str(patient.full_name) || str(enriched.paciente_nome)

      const processo = await gerarProcessoCompleto({
        disease: lme.disease as SupportedDisease,
        requestType: lme.request_type as 'inicial' | 'renovacao' | 'reavaliacao',
        lmeData: enriched as LmeCommonData,
        specificFormData: enrichedSpecific,
        fillDate,
        prescricaoData: {
          estabelecimento_nome: str(enriched.estabelecimento_nome),
          cnes: str(enriched.cnes),
          cidade: str(facility.city),
          paciente_nome: patientNome,
          paciente_cpf: docTipo === 'CPF' ? docNumero : undefined,
          paciente_birth_date: str(patient.birth_date),
          cid10: str(enriched.cid10),
          diagnostico: str(enriched.diagnostico),
          medico_nome: str(enriched.medico_nome),
          medico_crm: str(doctor.crm),
          medico_crm_uf: str(doctor.crm_uf),
          medico_cns: str(enriched.medico_cns),
          medicamentos: prescMeds,
          data_prescricao: fillDate,
        },
        requerimentoData: {
          unidade_solicitante: str(enriched.estabelecimento_nome),
          paciente_nome: patientNome,
          paciente_nome_social: str(patient.social_name) || undefined,
          paciente_cpf: docTipo === 'CPF' ? docNumero : undefined,
          telefones: str(enriched.telefones),
          medicamentos: reqMeds,
        },
        termoData: {
          paciente_nome: patientNome,
          paciente_nome_social: str(patient.social_name) || undefined,
          data_solicitacao: fillDate,
          medicamentos: reqMeds,
        },
      })

      // Auto-set status=emitida e next_renewal_date apenas se for o criador da LME.
      // Outros médicos só baixam o documento original — não alteram o estado da LME alheia.
      if (lme.created_by_user_id === user.id) {
        const hoje = new Date()
        const renewal = new Date(hoje)
        renewal.setDate(hoje.getDate() + 180)
        const { error: updateErr } = await supabase.from('lmes').update({
          status: 'emitida',
          next_renewal_date: renewal.toISOString().split('T')[0],
        }).eq('id', lmeId).eq('workspace_id', memberData.workspace_id)
        if (updateErr) logError('[pdf/generate] status update failed', updateErr, { lmeId, workspaceId: memberData.workspace_id })
      }

      const diseaseLabel = ({ asma: 'Asma', dpoc: 'DPOC', 'dpi-fp': 'DPI-FP', hap: 'HAP' } as Record<string, string>)[lme.disease] ?? lme.disease
      const [dd, mm, aa] = fillDate.split('/')
      const dateName = `${dd}-${mm}-${aa}`
      await auditLog(supabase, {
        workspaceId: memberData.workspace_id,
        userId: user.id,
        action: 'pdf_generate',
        resourceType: 'lme',
        resourceId: lmeId,
        metadata: { type },
      })

      return new NextResponse(Buffer.from(processo), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Processo_${diseaseLabel}_${lmeId}_${dateName}.pdf"`,
        },
      })
    }

    return NextResponse.json({ error: `Tipo não suportado: ${type}` }, { status: 400 })
  } catch (err: unknown) {
    logError('[pdf/generate]', err, { lmeId, workspaceId: memberData.workspace_id })
    return NextResponse.json(
      { error: safeErrorMessage(err, 'Erro ao gerar PDF') },
      { status: 500 }
    )
  }
}
