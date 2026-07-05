import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requiresAdminMfa } from '@/lib/platform-admin'
import { hasVerifiedMfaSession } from '@/lib/security/mfa'
import { AdminMfaClient } from './admin-mfa-client'

export default async function AdminMfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams
  const next = params.next?.startsWith('/') ? params.next : '/controle-interno-julia-docs-7f3c9a'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (!requiresAdminMfa(user.email)) redirect('/dashboard')

  const verified = await hasVerifiedMfaSession(supabase)
  if (verified) redirect(next)

  return <AdminMfaClient email={user.email ?? ''} next={next} />
}
