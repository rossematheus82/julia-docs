'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  lmeId: string
}

export function DeleteLmeButton({ lmeId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/lmes/${lmeId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      toast.success('LME excluída.')
      router.push('/lmes')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir LME')
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" /> Excluir LME
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir LME?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A LME e todos os dados preenchidos serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Excluindo...</> : 'Sim, excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
