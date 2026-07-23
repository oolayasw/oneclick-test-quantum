export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value ?? 0);
}

export function statusTone(status: string): string {
  if (status === 'Aceptada' || status === 'Aprobada') {
    return 'ok';
  }

  if (status === 'Pendiente de aprobacion' || status === 'Requiere ajustes') {
    return 'warn';
  }

  return 'info';
}