export const SENSITIVE_PDF_NOTICE =
  'Este PDF contém dados pessoais e de saúde. Baixe apenas em computador seguro, não compartilhe por canais não autorizados e armazene o arquivo conforme o fluxo do serviço.'

export function confirmSensitivePdfDownload() {
  if (typeof window === 'undefined') return true
  return window.confirm(`${SENSITIVE_PDF_NOTICE}\n\nDeseja continuar com o download?`)
}
