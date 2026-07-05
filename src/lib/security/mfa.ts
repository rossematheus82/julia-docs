type MfaClient = {
  auth: {
    mfa: {
      getAuthenticatorAssuranceLevel: () => Promise<{
        data: { currentLevel?: string | null } | null
        error: unknown
      }>
    }
  }
}

export async function hasVerifiedMfaSession(supabase: MfaClient) {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) return false
  return data?.currentLevel === 'aal2'
}
