import { Alumno } from '../types';

export interface CuotaInfo {
  isAlDia: boolean;
  statusText: 'ACTIVO' | 'DEBE';
  vencimientoFormatted: string;
  diasRestantes: number;
}

export function getCuotaInfo(alumno: Alumno): CuotaInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (alumno.cuota_al_dia === false) {
    return {
      isAlDia: false,
      statusText: 'DEBE',
      vencimientoFormatted: alumno.fecha_vencimiento_cuota || 'Vencida',
      diasRestantes: -1
    };
  }

  if (!alumno.fecha_vencimiento_cuota) {
    return {
      isAlDia: true,
      statusText: 'ACTIVO',
      vencimientoFormatted: 'Al día',
      diasRestantes: 30
    };
  }

  const [y, m, d] = alumno.fecha_vencimiento_cuota.split('-').map(Number);
  const vencDate = new Date(y, m - 1, d);
  vencDate.setHours(0, 0, 0, 0);

  const diffTime = vencDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isAlDia = diffDays >= 0;

  return {
    isAlDia,
    statusText: isAlDia ? 'ACTIVO' : 'DEBE',
    vencimientoFormatted: alumno.fecha_vencimiento_cuota,
    diasRestantes: diffDays
  };
}

export function computeFullMonthExpiration(fromDateStr?: string): string {
  const base = fromDateStr ? new Date(fromDateStr) : new Date();
  const nextMonth = new Date(base);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return nextMonth.toISOString().split('T')[0];
}
