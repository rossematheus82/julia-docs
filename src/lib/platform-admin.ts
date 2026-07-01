export const PLATFORM_ADMIN_EMAILS = [
  'drmatheusrosse@gmail.com',
  'rossematheus@gmail.com',
] as const

export function isPlatformAdminEmail(email?: string | null) {
  if (!email) return false
  return PLATFORM_ADMIN_EMAILS.includes(email.trim().toLowerCase() as typeof PLATFORM_ADMIN_EMAILS[number])
}
