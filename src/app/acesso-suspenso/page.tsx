import { AlertTriangle } from 'lucide-react'

export default function AcessoSuspensoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md rounded-lg border border-amber-200 bg-white p-6 text-center shadow-sm">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" />
        <h1 className="mt-4 text-xl font-semibold text-gray-900">Acesso suspenso</h1>
        <p className="mt-2 text-sm text-gray-500">
          Seu acesso a plataforma foi suspenso. Entre em contato com o administrador do Julia Docs.
        </p>
      </div>
    </div>
  )
}
