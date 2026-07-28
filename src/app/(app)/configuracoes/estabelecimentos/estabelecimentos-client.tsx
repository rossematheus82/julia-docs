'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Edit, Building2, Search } from 'lucide-react'
import { toast } from 'sonner'
import type { HealthFacility } from '@/lib/supabase/types'

const FacilitySchema = z.object({
  name:    z.string().trim().min(2, 'Nome do estabelecimento deve ter ao menos 2 caracteres'),
  cnes:    z.string().regex(/^\d{7}$/, 'CNES inválido — deve ter 7 dígitos numéricos').optional().or(z.literal('')),
  cnpj:    z.string().trim().refine(v => !v || v.replace(/\D/g, '').length === 14, 'CNPJ inválido — deve ter 14 dígitos').optional().or(z.literal('')),
  address: z.string().trim().optional(),
  phone:   z.string().regex(/^\d{10,11}$|^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, 'Telefone inválido — informe 10 ou 11 dígitos (ex: (31) 99999-9999)').optional().or(z.literal('')),
  city:    z.string().trim().optional(),
  state:   z.string().trim().regex(/^[A-Za-z]{2}$/, 'UF inválida — use a sigla do estado (ex: MG, SP, RJ)').toUpperCase().optional().or(z.literal('')),
})
type FacilityForm = z.infer<typeof FacilitySchema>

interface Props {
  facilities: HealthFacility[]
  workspaceId: string
}

export function EstabelecimentosClient({ facilities: initial, workspaceId }: Props) {
  const supabase = createClient()
  const [facilities, setFacilities] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<HealthFacility | null>(null)
  const [loading, setLoading] = useState(false)

  const [lookingUp, setLookingUp] = useState(false)

  const EMPTY: FacilityForm = { name: '', cnes: '', cnpj: '', address: '', phone: '', city: '', state: '' }

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FacilityForm>({
    resolver: zodResolver(FacilitySchema),
    defaultValues: EMPTY,
  })

  // Keep Base UI inputs controlled so user typing is captured by RHF
  const v = watch()

  function openCreate() {
    setEditing(null)
    reset(EMPTY)
    setOpen(true)
  }

  function openEdit(facility: HealthFacility) {
    setEditing(facility)
    reset({
      name: facility.name,
      cnes: facility.cnes ?? '',
      cnpj: facility.cnpj ?? '',
      address: facility.address ?? '',
      phone: facility.phone ?? '',
      city: facility.city ?? '',
      state: facility.state ?? '',
    })
    setOpen(true)
  }

  /**
   * Busca endereço/CNPJ no CNES (DataSUS) e preenche os campos vazios.
   * Nunca sobrescreve o que já foi digitado — só completa o que falta.
   */
  async function buscarPorCnes() {
    const codigo = (v.cnes ?? '').replace(/\D/g, '')
    if (codigo.length !== 7) {
      toast.error('Informe o CNES com 7 dígitos para buscar.')
      return
    }

    setLookingUp(true)
    try {
      const res = await fetch(`/api/cnes/${codigo}`)
      const json = await res.json() as {
        estabelecimento?: { nome: string; cnpj: string | null; endereco: string | null; telefone: string | null; state: string | null }
        error?: string
      }
      if (!res.ok || !json.estabelecimento) {
        toast.error(json.error ?? 'Não foi possível consultar o CNES.')
        return
      }

      const e = json.estabelecimento
      const preenchidos: string[] = []
      const completar = (campo: keyof FacilityForm, valor: string | null, rotulo: string) => {
        if (!valor || (v[campo] ?? '').trim()) return
        setValue(campo, valor, { shouldValidate: true, shouldDirty: true })
        preenchidos.push(rotulo)
      }

      completar('name', e.nome, 'nome')
      completar('cnpj', e.cnpj, 'CNPJ')
      completar('address', e.endereco, 'endereço')
      completar('phone', e.telefone, 'telefone')
      completar('state', e.state, 'UF')

      if (!e.cnpj) {
        toast.warning('O CNES não informa CNPJ para este estabelecimento — preencha manualmente.')
      }
      toast.success(
        preenchidos.length
          ? `Dados do CNES preenchidos: ${preenchidos.join(', ')}.`
          : 'CNES encontrado, mas os campos já estavam preenchidos.',
      )
    } catch {
      toast.error('Falha ao consultar o CNES. Tente novamente.')
    } finally {
      setLookingUp(false)
    }
  }

  async function onSubmit(data: FacilityForm) {
    setLoading(true)
    try {
      const payload = {
        name: data.name,
        cnes: data.cnes || null,
        cnpj: data.cnpj || null,
        address: data.address || null,
        phone: data.phone || null,
        city: data.city || null,
        state: data.state || null,
      }

      if (editing) {
        const { data: updated, error } = await supabase
          .from('health_facilities')
          .update(payload)
          .eq('id', editing.id)
          .select()
          .single()
        if (error) throw error
        setFacilities(prev => prev.map(f => f.id === editing.id ? updated : f))
        toast.success('Estabelecimento atualizado!')
      } else {
        const { data: created, error } = await supabase
          .from('health_facilities')
          .insert({ ...payload, workspace_id: workspaceId, is_active: true })
          .select()
          .single()
        if (error) throw error
        setFacilities(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
        toast.success('Estabelecimento cadastrado!')
      }
      setOpen(false)
    } catch (err: unknown) {
      const e = err as { message?: string; details?: string; code?: string }
      const msg = e.message ?? 'Erro ao salvar'
      const detail = e.details ? ` (${e.details})` : e.code ? ` [${e.code}]` : ''
      toast.error(msg + detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estabelecimentos</h1>
          <p className="text-gray-500 text-sm">{facilities.length} estabelecimento(s) cadastrado(s)</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo estabelecimento
        </Button>
      </div>

      <div className="space-y-2">
        {facilities.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum estabelecimento cadastrado.</p>
            <Button size="sm" className="mt-3" onClick={openCreate}>Cadastrar primeiro estabelecimento</Button>
          </div>
        )}
        {facilities.map(facility => (
          <div key={facility.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{facility.name}</p>
                <p className="text-sm text-gray-500">
                  {facility.cnes ? `CNES: ${facility.cnes}` : ''}
                  {facility.cnpj ? `${facility.cnes ? ' · ' : ''}CNPJ: ${facility.cnpj}` : ''}
                  {(facility.cnes || facility.cnpj) && facility.city ? ' · ' : ''}
                  {facility.city ? `${facility.city}${facility.state ? `/${facility.state}` : ''}` : ''}
                  {facility.phone ? ` · ${facility.phone}` : ''}
                </p>
                {facility.address && (
                  <p className="text-xs text-gray-400">{facility.address}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => openEdit(facility)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar estabelecimento' : 'Novo estabelecimento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Nome do estabelecimento *</Label>
              <Input {...register('name')} value={v.name ?? ''} className="mt-1" placeholder="Ex: Ambulatório de Pneumologia" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>CNES</Label>
                <div className="mt-1 flex gap-2">
                  <Input {...register('cnes')} value={v.cnes ?? ''} placeholder="0000000" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={buscarPorCnes}
                    disabled={lookingUp}
                    title="Buscar endereço e CNPJ no cadastro nacional (DataSUS)"
                    className="shrink-0 gap-1"
                  >
                    <Search className="h-4 w-4" />
                    {lookingUp ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>
                {errors.cnes && <p className="text-xs text-red-500 mt-1">{errors.cnes.message}</p>}
                <p className="text-xs text-gray-400 mt-1">Busca preenche endereço e CNPJ pelo DataSUS.</p>
              </div>
              <div>
                <Label>Telefone</Label>
                <Input {...register('phone')} value={v.phone ?? ''} className="mt-1" placeholder="(00) 0000-0000" />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
              </div>
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input {...register('cnpj')} value={v.cnpj ?? ''} className="mt-1" placeholder="00.000.000/0000-00" />
              {errors.cnpj && <p className="text-xs text-red-500 mt-1">{errors.cnpj.message}</p>}
              <p className="text-xs text-gray-400 mt-1">Aparece no cabeçalho da receita, junto com o endereço.</p>
            </div>
            <div>
              <Label>Endereço</Label>
              <Input {...register('address')} value={v.address ?? ''} className="mt-1" placeholder="Rua, número, bairro" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Cidade</Label>
                <Input {...register('city')} value={v.city ?? ''} className="mt-1" placeholder="Belo Horizonte" />
              </div>
              <div>
                <Label>UF</Label>
                <Input {...register('state')} value={v.state ?? ''} className="mt-1" placeholder="MG" maxLength={2} />
                {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : editing ? 'Salvar' : 'Cadastrar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
