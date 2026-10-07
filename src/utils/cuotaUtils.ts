import { Alumno } from '../types';

export type CuotaStatus = 'al_dia' | 'vence_pronto' | 'vencido';

export interface CuotaInfo {
  isAlDia: boolean;
  status: CuotaStatus;
  statusText: 'ACTIVO' | 'DEBE' | 'VENCE PRONTO';
  badgeText: string;
  vencimientoFormatted: string;
  diasRestantes: number;
}

export function getCuotaInfo(
  alumnoOrVencimiento?: Alumno | string | null,
  cuotaAlDiaArg?: boolean
): CuotaInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let fechaVencimiento: string | undefined;
  let isAlDiaFlag = true;

  if (alumnoOrVencimiento && typeof alumnoOrVencimiento === 'object') {
    fechaVencimiento = alumnoOrVencimiento.fecha_vencimiento_cuota;
    isAlDiaFlag = alumnoOrVencimiento.cuota_al_dia !== false;
  } else if (typeof alumnoOrVencimiento === 'string') {
    fechaVencimiento = alumnoOrVencimiento;
    isAlDiaFlag = cuotaAlDiaArg !== false;
  } else if (cuotaAlDiaArg !== undefined) {
    isAlDiaFlag = cuotaAlDiaArg;
  }

  if (isAlDiaFlag === false) {
    return {
      isAlDia: false,
      status: 'vencido',
      statusText: 'DEBE',
      badgeText: 'Debe cuota',
      vencimientoFormatted: fechaVencimiento || 'Vencida',
      diasRestantes: -1
    };
  }

  if (!fechaVencimiento) {
    return {
      isAlDia: true,
      status: 'al_dia',
      statusText: 'ACTIVO',
      badgeText: 'Al día',
      vencimientoFormatted: 'Al día',
      diasRestantes: 30
    };
  }

  const parts = fechaVencimiento.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) {
    return {
      isAlDia: true,
      status: 'al_dia',
      statusText: 'ACTIVO',
      badgeText: 'Al día',
      vencimientoFormatted: fechaVencimiento,
      diasRestantes: 30
    };
  }

  const [y, m, d] = parts;
  const vencDate = new Date(y, m - 1, d);
  vencDate.setHours(0, 0, 0, 0);

  const diffTime = vencDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      isAlDia: false,
      status: 'vencido',
      statusText: 'DEBE',
      badgeText: 'Vencida',
      vencimientoFormatted: fechaVencimiento,
      diasRestantes: diffDays
    };
  }

  if (diffDays <= 5) {
    return {
      isAlDia: true,
      status: 'vence_pronto',
      statusText: 'VENCE PRONTO',
      badgeText: diffDays === 0 ? 'Vence hoy' : `Vence en ${diffDays}d`,
      vencimientoFormatted: fechaVencimiento,
      diasRestantes: diffDays
    };
  }

  return {
    isAlDia: true,
    status: 'al_dia',
    statusText: 'ACTIVO',
    badgeText: 'Al día',
    vencimientoFormatted: fechaVencimiento,
    diasRestantes: diffDays
  };
}

export function computeFullMonthExpiration(fromDateStr?: string): string {
  const base = fromDateStr ? new Date(fromDateStr) : new Date();
  const nextMonth = new Date(base);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return nextMonth.toISOString().split('T')[0];
}