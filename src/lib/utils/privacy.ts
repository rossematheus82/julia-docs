function onlyDigits(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '')
}

export function mascararCpf(cpf: string | null | undefined): string {
  const digits = onlyDigits(cpf)
  if (digits.length !== 11) return cpf ? '***.***.***-**' : ''
  return `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function mascararCns(cns: string | null | undefined): string {
  const digits = onlyDigits(cns)
  if (!digits) return ''
  const suffix = digits.slice(-4)
  return `${'*'.repeat(Math.max(digits.length - 4, 0))}${suffix}`
}

export function documentoPacienteMascarado(patient: { cpf?: string | null; cns?: string | null }) {
  if (patient.cpf) return `CPF: ${mascararCpf(patient.cpf)}`
  if (patient.cns) return `CNS: ${mascararCns(patient.cns)}`
  return ''
}
