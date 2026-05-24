import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { LmeEditClient } from './lme-edit-client'
import type { Disease, RequestType } from '@/lib/supabase/types'

export default async function LmeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')
  const memberData = { workspace_id: active.workspaceId }

  const { id } = await params

  const { data: lme } = await supabase
    .from('lmes')
    .select('id, disease, request_type, cid10, lme_data, specific_form_data, patient_id, created_by_user_id')
    .eq('id', id)
    .eq('workspace_id', memberData.workspace_id)
    .single()

  if (!lme) notFound()

  // Apenas o criador pode editar — outros médicos só podem visualizar/baixar/renovar
  if (lme.created_by_user_id !== user.id) redirect(`/lmes/${id}`)

  const { data: patient } = await supabase
    .from('patients')
    .select('weight_kg, height_cm, birth_date, is_incapable, responsible_name')
    .eq('id', lme.patient_id)
    .single()

  const lmeData = (lme.lme_data ?? {}) as Record<string, unknown>
  const specificFormData = (lme.specific_form_data ?? {}) as Record<string, unknown>

  const mergedLmeData: Record<string, unknown> = {
    ...lmeData,
    ...(patient?.weight_kg != null && !lmeData.peso_kg ? { peso_kg: String(patient.weight_kg) } : {}),
    ...(patient?.height_cm != null && !lmeData.altura_cm ? { altura_cm: String(patient.height_cm) } : {}),
  }

  return (
    <LmeEditClient
      lmeId={id}
      disease={lme.disease as Disease}
      requestType={lme.request_type as RequestType}
      lmeData={mergedLmeData}
      specificFormData={specificFormData}
      aiUsed={false}
      cid10={lme.cid10}
      patientBirthDate={patient?.birth_date ?? null}
      patientIncapable={patient?.is_incapable ?? false}
      patientResponsibleName={patient?.responsible_name ?? null}
    />
  )
}
