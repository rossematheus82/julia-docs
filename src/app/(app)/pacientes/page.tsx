import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, User, FileText } from 'lucide-react'
import { PacientesSearch } from '@/components/pacientes-search'
import { calcularIdade, formatarData } from '@/lib/utils/date'
import { documentoPacienteMascarado } from '@/lib/utils/privacy'

export default async function PacientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')
  const memberData = { workspace_id: active.workspaceId }

  const params = await searchParams
  const q = params.q?.trim() ?? ''

  let query = supabase
    .from('patients')
    .select('id, full_name, social_name, birth_date, cpf, cns, phone, sex, created_at')
    .eq('workspace_id', memberData.workspace_id)
    .order('full_name', { ascending: true })

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,cpf.ilike.%${q}%,cns.ilike.%${q}%`)
  }

  const { data: patients } = await query.limit(50)

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 text-sm">{patients?.length ?? 0} paciente(s) encontrado(s)</p>
        </div>
        <Link href="/pacientes/novo">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Novo paciente</Button>
        </Link>
      </div>

      <PacientesSearch defaultValue={q} />

      <div className="space-y-2">
        {(patients?.length ?? 0) === 0 && (
          <div className="text-center py-12 text-gray-400">
            <User className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>{q ? `Nenhum paciente encontrado para "${q}"` : 'Nenhum paciente cadastrado ainda.'}</p>
            {!q && <Link href="/pacientes/novo"><Button className="mt-3" size="sm">Cadastrar primeiro paciente</Button></Link>}
          </div>
        )}
        {patients?.map(p => {
          const age = calcularIdade(p.birth_date)
          const documentLabel = documentoPacienteMascarado(p)
          return (
            <Link key={p.id} href={`/pacientes/${p.id}`}>
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">
                      {p.full_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{p.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {p.birth_date ? `Nascimento: ${formatarData(p.birth_date)}` : ''}
                      {age !== null ? ` · ${age} anos` : ''}
                      {documentLabel ? ` · ${documentLabel}` : ''}
                      {p.phone ? ` · ${p.phone}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {p.sex === 'M' ? 'Masculino' : p.sex === 'F' ? 'Feminino' : 'Outro'}
                  </Badge>
                  <FileText className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
