import { Heart } from 'lucide-react'

export default function SobrePage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-rose-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sobre o Júlia Docs</h1>
          <p className="text-gray-500 text-sm">Feito por quem usa, para quem usa</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 text-gray-700 leading-relaxed">
        <p>
          O Júlia Docs nasceu dentro da residência médica, da necessidade real do dia a dia:
          preencher as LMEs do CEAF/SES-MG de um jeito mais rápido, organizado e menos sujeito a erros.
        </p>
        <p>
          Foi criado por um residente do Hospital Júlia Kubitschek para facilitar o preenchimento
          desses laudos — para médicos, residentes e equipe. A ideia é simples: reunir num só lugar os
          formulários, as prescrições e os documentos do processo, com os campos já organizados por
          doença, para que o foco fique no cuidado com o paciente, e não na burocracia.
        </p>
        <p>
          O uso é <strong>totalmente gratuito e sem fins lucrativos</strong>. Não há cobrança,
          propaganda nem venda de dados — é uma ferramenta feita por quem usa, para quem usa.
        </p>

        <div className="pt-4 mt-2 border-t border-gray-100">
          <p className="text-sm text-gray-500">Criado por</p>
          <p className="text-base font-semibold text-gray-900">Matheus Rosse</p>
          <p className="text-sm text-gray-500">Residente — Hospital Júlia Kubitschek</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Tem uma sugestão ou encontrou um erro? Use o botão flutuante de feedback no canto da tela.
      </p>
    </div>
  )
}
