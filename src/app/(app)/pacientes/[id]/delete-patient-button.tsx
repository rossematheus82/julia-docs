'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  patientId: string
  patientName: string
  lmeCount: number
}

export function DeletePatientButton({ patientId, patientName, lmeCount }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const hasLmes = lmeCount > 0

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/pacientes/${patientId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      toast.success('Paciente excluído.')
      router.push('/pacientes')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir paciente')
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" /> Excluir
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir paciente?</DialogTitle>
            <DialogDescription>
              {hasLmes ? (
                <><strong>{patientName}</strong> possui {lmeCount} LME{lmeCount > 1 ? 's' : ''} vinculada{lmeCount > 1 ? 's' : ''}. Exclua {lmeCount > 1 ? 'as LMEs' : 'a LME'} antes de remover o paciente, para não perder o histórico.</>
              ) : (
                <>Esta ação não pode ser desfeita. <strong>{patientName}</strong> será removido permanentemente.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              {hasLmes ? 'Entendi' : 'Cancelar'}
            </Button>
            {!hasLmes && (
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Excluindo...</> : 'Sim, excluir'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
