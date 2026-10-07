import React, { useMemo } from 'react';
import { Alumno, Grupo } from '../types';
import {
  Users,
  Layers,
  DollarSign,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  Activity,
  Flame,
  ShieldAlert,
  CreditCard,
  Sparkles,
  ChevronRight,
  UserX
} from 'lucide-react';

export interface PagoCuota {
    id: string;
    alumno_id: string;
    alumno_nombre: string;
    grupo_id?: string;
    grupo_nombre?: string;
    monto: number;
    fecha_pago: string;
    fecha_vencimiento: string;
    mes_correspondiente: string;
    metodo_pago?: string;
    notas?: string;
    created_at: string;
  }

interface DashboardHomeProps {
  alumnos: Alumno[];
  grupos: Grupo[];
  pagos: PagoCuota[];
  userName?: string;
  onNavigate: (view: 'alumnos' | 'grupos' | 'pagos') => void;
  onSelectStudent?: (alumno: Alumno, vista: 'rutina' | 'evaluacion') => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  alumnos,
  grupos,
  pagos,
  userName = 'Profesor',
  onNavigate,
  onSelectStudent
}) => {
  const today = new Date().toISOString().split('T')[0];
  const currentMonthKey = today.slice(0, 7); // 'YYYY-MM'

  // Métricas Generales
  const stats = useMemo(() => {
    const totalAlumnos = alumnos.length;
    const activos = alumnos.filter((a) => a.estado_activo !== false).length;

    // Alertas clínicas / dolor
    const conAlerta = alumnos.filter(
      (a) => !!a.alerta_lesion_activa || (a.dolor_eva_actual !== undefined && a.dolor_eva_actual > 0)
    );

    // Finanzas del mes actual
    const pagosMesActual = pagos.filter((p) => p.fecha_pago && p.fecha_pago.startsWith(currentMonthKey));
    const totalRecaudadoMes = pagosMesActual.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

    const alDia = alumnos.filter((a) => {
      if (a.cuota_al_dia === false) return false;
      if (!a.fecha_vencimiento_cuota) return true;
      return a.fecha_vencimiento_cuota >= today;
    }).length;

    const vencidos = totalAlumnos - alDia;

    // Próximos a vencer en los siguientes 7 días
    const proximosAVencer = alumnos.filter((a) => {
      if (!a.fecha_vencimiento_cuota) return false;
      if (a.fecha_vencimiento_cuota < today) return false;
      const diffTime = new Date(a.fecha_vencimiento_cuota).getTime() - new Date(today).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });

    return {
      totalAlumnos,
      activos,
      conAlerta,
      totalRecaudadoMes,
      cantPagosMes: pagosMesActual.length,
      alDia,
      vencidos,
      proximosAVencer
    };
  }, [alumnos, pagos, currentMonthKey, today]);

  // Alumnos por Grupo
  const alumnosPorGrupo = useMemo(() => {
    return grupos.map((g) => {
      const miembros = alumnos.filter((a) => a.grupo_id === g.id);
      return {
        ...g,
        cantidad: miembros.length,
        alumnos: miembros.slice(0, 5)
      };
    });
  }, [grupos, alumnos]);

  const fechaFormateada = useMemo(() => {
    const d = new Date();
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  }, []);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* 1. Hero / Bienvenida */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Centro de Control • GymFit Manager</span>
            </div>
            <h1 className="text-[16px] sm:text-2xl font-black text-white tracking-tight">
              Bienvenido, {userName.split(' ')[0]} 👋
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80 shrink-0 w-fit">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>{fechaFormateada}</span>
          </div>
        </div>
      </div>

      {/* 2. Tarjetas KPI Principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Alumnos Totales */}
        <div
          onClick={() => onNavigate('alumnos')}
          className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Alumnos</span>
            <Users className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalAlumnos}</span>
            <span className="text-xs text-emerald-400 font-mono font-bold">{stats.activos} activos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
            <span>Ver listado completo</span>
            <ChevronRight className="w-3 h-3" />
          </p>
        </div>

        {/* Grupos de Entrenamiento */}
        <div
          onClick={() => onNavigate('grupos')}
          className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Grupos / Turnos</span>
            <Layers className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white">{grupos.length}</span>
            <span className="text-xs text-slate-400 font-mono">Turnos activos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
            <span>Gestionar horarios</span>
            <ChevronRight className="w-3 h-3" />
          </p>
        </div>

        {/* Recaudación Mensual */}
        <div
          onClick={() => onNavigate('pagos')}
          className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Recaudación Mes</span>
            <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              ${stats.totalRecaudadoMes.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-mono">{stats.cantPagosMes} cobros</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
            <span>{stats.alDia} al día • {stats.vencidos} deben</span>
            <ChevronRight className="w-3 h-3" />
          </p>
        </div>

        {/* Alertas Biomecánicas / Clínicas */}
        <div
          onClick={() => onNavigate('alumnos')}
          className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Alertas Clínicas</span>
            <Flame className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{stats.conAlerta.length}</span>
            <span className="text-xs text-amber-300/80 font-mono">En sala</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-amber-400 transition-colors">
            <span>Dolor o restricciones</span>
            <ChevronRight className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* 3. Panel de Dos Columnas: Alumnos con Alerta + Próximos Vencimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Columna Izquierda: Alumnos con Alerta Clínica / Dolor */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Atención en Sala de Entrenamiento</h3>
                  <p className="text-[11px] text-slate-400">Alumnos con dolor activo (EVA) o alertas de lesión</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-xs font-mono font-bold border border-amber-500/20">
                {stats.conAlerta.length}
              </span>
            </div>

            <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {stats.conAlerta.length > 0 ? (
                stats.conAlerta.map((alumno) => {
                  const grupo = grupos.find((g) => g.id === alumno.grupo_id);
                  return (
                    <div
                      key={alumno.id}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/40 transition flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white truncate">
                            {alumno.nombre} {alumno.apellido}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate">
                            {grupo?.nombre_grupo || 'Turno'}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-300 line-clamp-1 mt-0.5">
                          {alumno.alerta_lesion_activa ||
                            (alumno.zona_dolor_principal ? `Zona: ${alumno.zona_dolor_principal}` : 'Atención técnica')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {alumno.dolor_eva_actual !== undefined && alumno.dolor_eva_actual > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-bold">
                            EVA {alumno.dolor_eva_actual}/10
                          </span>
                        )}
                        {onSelectStudent && (
                          <button
                            onClick={() => onSelectStudent(alumno, 'rutina')}
                            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white text-[11px] font-bold transition flex items-center gap-1"
                            title="Ver Rutina"
                          >
                            <Activity className="w-3 h-3" />
                            <span>Rutina</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" />
                  No hay alumnos con alertas clínicas reportadas en este momento.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-end">
            <button
              onClick={() => onNavigate('alumnos')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>Ver todos los alumnos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Columna Derecha: Próximos Vencimientos y Estado de Cuotas */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Control de Cuotas & Vencimientos</h3>
                  <p className="text-[11px] text-slate-400">Vencimientos próximos en 7 días y pendientes</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('pagos')}
                className="px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-bold transition"
              >
                Ir a Pagos
              </button>
            </div>

            <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {stats.proximosAVencer.length > 0 || stats.vencidos > 0 ? (
                <>
                  {stats.proximosAVencer.map((alumno) => (
                    <div
                      key={alumno.id}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-white truncate">
                          {alumno.nombre} {alumno.apellido}
                        </p>
                        <p className="text-[11px] text-amber-400 font-mono mt-0.5">
                          Vence: {alumno.fecha_vencimiento_cuota}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Vence pronto
                      </span>
                    </div>
                  ))}

                  {/* Resumen de los vencidos */}
                  {stats.vencidos > 0 && (
                    <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-900/40 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                        <UserX className="w-4 h-4 text-rose-400" />
                        <span>{stats.vencidos} alumnos tienen cuotas vencidas pendientes</span>
                      </div>
                      <button
                        onClick={() => onNavigate('pagos')}
                        className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline"
                      >
                        Verificar
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" />
                  Todos los alumnos se encuentran al día con sus cuotas.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Al día: <strong className="text-emerald-400">{stats.alDia}</strong></span>
            <span>Vencidos: <strong className="text-rose-400">{stats.vencidos}</strong></span>
            <span>Cobrado este mes: <strong className="text-white">${stats.totalRecaudadoMes.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Resumen de Grupos / Turnos de Entrenamiento */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Grupos y Turnos de Entrenamiento</h3>
              <p className="text-xs text-slate-400">Distribución de alumnos y horarios por grupo de trabajo</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('grupos')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            <span>Administrar grupos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {alumnosPorGrupo.map((grupo) => (
            <div
              key={grupo.id}
              onClick={() => onNavigate('grupos')}
              className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {grupo.nombre_grupo}
                  </h4>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {grupo.cantidad} {grupo.cantidad === 1 ? 'alumno' : 'alumnos'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{grupo.horario}</span>
                </p>
                {grupo.descripcion && (
                  <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-1">
                    {grupo.descripcion}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Turno activo</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Ver detalle →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};