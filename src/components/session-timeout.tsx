'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const TIMEOUT_MS = 30 * 60 * 1000
const WARNING_MS = 60 * 1000
const CHECK_INTERVAL_MS = 15 * 1000
const STORAGE_KEY = 'julia_docs_last_activity_at'

function now() {
  return Date.now()
}

function readLastActivity() {
  const value = window.localStorage.getItem(STORAGE_KEY)
  const parsed = value ? Number(value) : NaN
  return Number.isFinite(parsed) ? parsed : now()
}

function writeLastActivity() {
  window.localStorage.setItem(STORAGE_KEY, String(now()))
}

export function SessionTimeout() {
  const router = useRouter()
  const supabase = createClient()
  const warnedRef = useRef(false)
  const signedOutRef = useRef(false)

  useEffect(() => {
    writeLastActivity()

    function markActivity() {
      if (signedOutRef.current) return
      warnedRef.current = false
      writeLastActivity()
    }

    async function signOutByTimeout() {
      if (signedOutRef.current) return
      signedOutRef.current = true
      await supabase.auth.signOut()
      toast.warning('Sessao encerrada por inatividade.')
      router.push('/login')
      router.refresh()
    }

    function checkIdleTime() {
      const idleMs = now() - readLastActivity()
      const remainingMs = TIMEOUT_MS - idleMs

      if (remainingMs <= 0) {
        void signOutByTimeout()
        return
      }

      if (remainingMs <= WARNING_MS && !warnedRef.current) {
        warnedRef.current = true
        toast.warning('Sua sessao sera encerrada em 1 minuto por inatividade.')
      }
    }

    const events: Array<keyof WindowEventMap> = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
    events.forEach(event => window.addEventListener(event, markActivity, { passive: true }))
    window.addEventListener('focus', markActivity)
    document.addEventListener('visibilitychange', checkIdleTime)

    const interval = window.setInterval(checkIdleTime, CHECK_INTERVAL_MS)

    return () => {
      events.forEach(event => window.removeEventListener(event, markActivity))
      window.removeEventListener('focus', markActivity)
      document.removeEventListener('visibilitychange', checkIdleTime)
      window.clearInterval(interval)
    }
  }, [router, supabase])

  return null
}
