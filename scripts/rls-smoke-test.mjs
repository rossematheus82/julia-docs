import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const password = process.env.RLS_TEST_PASSWORD ?? 'ChangeMe-rls-test-123!'

if (!url || !anonKey || !serviceKey) {
  throw new Error('Defina NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.')
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function userClient() {
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function createUser(email) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  return data.user
}

async function signIn(email) {
  const client = userClient()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return client
}

async function main() {
  const stamp = Date.now()
  const emailA = `rls-a-${stamp}@example.test`
  const emailB = `rls-b-${stamp}@example.test`
  const userA = await createUser(emailA)
  const userB = await createUser(emailB)

  const clientA = await signIn(emailA)
  const clientB = await signIn(emailB)

  const { data: workspaceA, error: workspaceAError } = await clientA.rpc('create_workspace_with_owner', {
    workspace_name: `RLS A ${stamp}`,
    invite: `RLSA-${String(stamp).slice(-4)}`,
  })
  if (workspaceAError) throw workspaceAError

  const { data: workspaceB, error: workspaceBError } = await clientB.rpc('create_workspace_with_owner', {
    workspace_name: `RLS B ${stamp}`,
    invite: `RLSB-${String(stamp).slice(-4)}`,
  })
  if (workspaceBError) throw workspaceBError

  const { data: patientB, error: patientBError } = await admin
    .from('patients')
    .insert({
      workspace_id: workspaceB,
      created_by_user_id: userB.id,
      full_name: 'RLS Test Patient B',
    })
    .select('id')
    .single()
  if (patientBError) throw patientBError

  const { data: doctorB, error: doctorBError } = await admin
    .from('doctors')
    .insert({
      workspace_id: workspaceB,
      created_by_user_id: userB.id,
      owner_user_id: userB.id,
      full_name: 'RLS Test Doctor B',
      crm: '00000',
      crm_uf: 'MG',
    })
    .select('id')
    .single()
  if (doctorBError) throw doctorBError

  const { data: facilityB, error: facilityBError } = await admin
    .from('health_facilities')
    .insert({
      workspace_id: workspaceB,
      name: 'RLS Test Facility B',
    })
    .select('id')
    .single()
  if (facilityBError) throw facilityBError

  const { data: lmeB, error: lmeBError } = await admin
    .from('lmes')
    .insert({
      workspace_id: workspaceB,
      patient_id: patientB.id,
      doctor_id: doctorB.id,
      facility_id: facilityB.id,
      created_by_user_id: userB.id,
      disease: 'asma',
      request_type: 'inicial',
      cid10: 'J45',
      status: 'rascunho',
      lme_data: {},
      prescription_data: {},
      patient_snapshot: {},
      doctor_snapshot: {},
      facility_snapshot: {},
    })
    .select('id')
    .single()
  if (lmeBError) throw lmeBError

  const { data: leakedPatients, error: patientReadError } = await clientA
    .from('patients')
    .select('id')
    .eq('id', patientB.id)
  if (patientReadError) throw patientReadError

  const { data: leakedLmes, error: lmeReadError } = await clientA
    .from('lmes')
    .select('id')
    .eq('id', lmeB.id)
  if (lmeReadError) throw lmeReadError

  if ((leakedPatients?.length ?? 0) > 0 || (leakedLmes?.length ?? 0) > 0) {
    throw new Error('RLS falhou: usuario A leu dados do workspace B.')
  }

  await admin.from('workspaces').delete().in('id', [workspaceA, workspaceB])
  await admin.auth.admin.deleteUser(userA.id)
  await admin.auth.admin.deleteUser(userB.id)

  console.log('RLS OK: usuario A nao acessou paciente/LME do usuario B.')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
