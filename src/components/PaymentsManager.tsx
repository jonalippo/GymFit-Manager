import React, { useState, useMemo } from 'react';
import { Alumno, Grupo, PagoCuota } from '../types';
import { PaymentModal } from './PaymentModal';
import {
  DollarSign,
  Calendar,
  CreditCard,
  UserCheck,
  UserX,
  Search,
  PlusCircle,
  TrendingUp,
  BarChart3,
  Users,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  Trash2,
  Filter,
  ArrowUpRight
} from 'lucide-react';

interface PaymentsManagerProps {
  alumnos: Alumno[];
  grupos: Grupo[];
  pagos: PagoCuota[];
  onSavePayment: (pago: Omit<PagoCuota, 'id' | 'created_at'>) => Promise<void>;
  onDeletePayment?: (pagoId: string) => Promise<void>;
}

function calculateNextMonthDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

function formatMonthName(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${meses[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function getYearMonthKey(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  } catch {
    return dateStr.slice(0, 7);
  }
}

export const PaymentsManager: React.FC<PaymentsManagerProps> = ({
  alumnos,
  grupos,
  pagos,
  onSavePayment,
  onDeletePayment,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const currentMonthKey = getYearMonthKey(today);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrupo, setFilterGrupo] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'al_dia' | 'vencido'>('todos');

  // Modal para cargar pago rápido
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Alumno | null>(null);

  // Formulario Superior "Registrar Nuevo Pago"
  const [formAlumnoId, setFormAlumnoId] = useState<string>('');
  const [formMonto, setFormMonto] = useState<string>('15000');
  const [formFechaInicio, setFormFechaInicio] = useState<string>(today);
  const [formFechaVencimiento, setFormFechaVencimiento] = useState<string>(calculateNextMonthDate(today));
  const [formMesCorrespondiente, setMesCorrespondiente] = useState<string>(formatMonthName(today));
  const [formMetodoPago, setFormMetodoPago] = useState<string>('efectivo');
  const [formNotas, setFormNotas] = useState<string>('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const handleStudentSelectInForm = (studentId: string) => {
    setFormAlumnoId(studentId);
    const student = alumnos.find((a) => a.id === studentId);
    if (student?.ultimo_monto_pago && student.ultimo_monto_pago > 0) {
      setFormMonto(String(student.ultimo_monto_pago));
    }
  };

  const handleRegisterDirectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAlumnoId) return;
    const student = alumnos.find((a) => a.id === formAlumnoId);
    if (!student) return;

    const parsedMonto = parseFloat(formMonto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) return;

    const grupo = grupos.find((g) => g.id === student.grupo_id);

    setIsSubmittingForm(true);
    try {
      await onSavePayment({
        alumno_id: student.id,
        alumno_nombre: `${student.nombre} ${student.apellido}`,
        grupo_id: student.grupo_id,
        grupo_nombre: grupo?.nombre_grupo || 'Sin Grupo',
        monto: parsedMonto,
        fecha_pago: formFechaInicio,
        fecha_vencimiento: formFechaVencimiento,
        mes_correspondiente: formMesCorrespondiente,
        metodo_pago: formMetodoPago,
        notas: formNotas.trim() || undefined,
      });

      setFormNotas('');
      setFormAlumnoId('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentMonthKey);
    pagos.forEach((p) => {
      if (p.fecha_pago) monthsSet.add(getYearMonthKey(p.fecha_pago));
    });
    for (let i = 1; i <= 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthsSet.add(getYearMonthKey(d.toISOString().split('T')[0]));
    }
    return Array.from(monthsSet).sort().reverse();
  }, [pagos, currentMonthKey]);

  const metrics = useMemo(() => {
    const pagosDelMes = pagos.filter((p) => getYearMonthKey(p.fecha_pago) === selectedMonth);
    const totalRecaudadoMes = pagosDelMes.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

    const alumnosAlDia = alumnos.filter((a) => {
      if (a.cuota_al_dia === false) return false;
      if (!a.fecha_vencimiento_cuota) return true;
      return a.fecha_vencimiento_cuota >= today;
    }).length;

    const alumnosVencidos = alumnos.length - alumnosAlDia;

    const recaudacionPorGrupo: Record<string, { grupoId: string; nombre: string; total: number; cantPagos: number }> = {};
    grupos.forEach((g) => {
      recaudacionPorGrupo[g.id] = {
        grupoId: g.id,
        nombre: g.nombre_grupo,
        total: 0,
        cantPagos: 0,
      };
    });
    recaudacionPorGrupo['otros'] = {
      grupoId: 'otros',
      nombre: 'Sin Grupo / General',
      total: 0,
      cantPagos: 0,
    };

    pagosDelMes.forEach((p) => {
      const gId = p.grupo_id && recaudacionPorGrupo[p.grupo_id] ? p.grupo_id : 'otros';
      recaudacionPorGrupo[gId].total += Number(p.monto) || 0;
      recaudacionPorGrupo[gId].cantPagos += 1;
    });

    const breakdownGrupos = Object.values(recaudacionPorGrupo);
    const maxGrupoTotal = Math.max(...breakdownGrupos.map((b) => b.total), 1);

    return {
      totalRecaudadoMes,
      totalPagosMes: pagosDelMes.length,
      alumnosAlDia,
      alumnosVencidos,
      breakdownGrupos,
      maxGrupoTotal,
    };
  }, [pagos, alumnos, grupos, selectedMonth, today]);

  const filteredAlumnos = useMemo(() => {
    return alumnos.filter((alumno) => {
      const fullName = `${alumno.nombre} ${alumno.apellido}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        (alumno.dni && alumno.dni.includes(searchTerm)) ||
        (alumno.telefono && alumno.telefono.includes(searchTerm));

      const matchesGrupo = filterGrupo === 'todos' || alumno.grupo_id === filterGrupo;

      const isActivo = alumno.cuota_al_dia !== false && (!alumno.fecha_vencimiento_cuota || alumno.fecha_vencimiento_cuota >= today);
      const matchesEstado =
        filterEstado === 'todos' ||
        (filterEstado === 'al_dia' && isActivo) ||
        (filterEstado === 'vencido' && !isActivo);

      return matchesSearch && matchesGrupo && matchesEstado;
    });
  }, [alumnos, searchTerm, filterGrupo, filterEstado, today]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* 1. Header con Selector de Mes */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Gestión de Pagos & Cuotas</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                {formatMonthName(selectedMonth + '-01')}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Control de ingresos, recaudación por grupos y actualización de estados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">
            Visualizar Mes:
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthName(m + '-01')} {m === currentMonthKey ? '★ (Actual)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Tarjetas de Métricas del Mes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Recaudado Mes
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              ${metrics.totalRecaudadoMes.toLocaleString()}
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.totalPagosMes} cuotas registradas
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Alumnos Al Día
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {metrics.alumnosAlDia}
            </span>
            <UserCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-[11px] text-emerald-400 font-medium mt-1">
            {alumnos.length > 0 ? Math.round((metrics.alumnosAlDia / alumnos.length) * 100) : 0}% del total
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Cuotas Vencidas / Debe
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-400">
              {metrics.alumnosVencidos}
            </span>
            <UserX className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-[11px] text-rose-400/90 font-medium mt-1">
            Pendientes de regularización
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Promedio Por Cuota
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-teal-300 font-mono">
              $
              {metrics.totalPagosMes > 0
                ? Math.round(metrics.totalRecaudadoMes / metrics.totalPagosMes).toLocaleString()
                : '0'}
            </span>
            <BarChart3 className="w-5 h-5 text-teal-400" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            En {formatMonthName(selectedMonth + '-01')}
          </p>
        </div>
      </div>

      {/* 3. Gráfica de Recaudación por Grupo */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Recaudación por Grupos de Entrenamiento ({formatMonthName(selectedMonth + '-01')})
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
            Total: ${metrics.totalRecaudadoMes.toLocaleString()}
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {metrics.breakdownGrupos.map((bg) => {
            const pct = metrics.maxGrupoTotal > 0 ? (bg.total / metrics.maxGrupoTotal) * 100 : 0;
            return (
              <div key={bg.grupoId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-200">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>{bg.nombre}</span>
                    <span className="text-[10px] text-slate-500">
                      ({bg.cantPagos} {bg.cantPagos === 1 ? 'pago' : 'pagos'})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-300">
                    ${bg.total.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                    style={{ width: `${Math.max(pct, bg.total > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Componente: "Registrar un Nuevo Pago" */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Registrar un Nuevo Pago</h3>
            <p className="text-xs text-slate-400">
              Busca un alumno, ingresa el monto, fechas de inicio y vencimiento para asentar el cobro
            </p>
          </div>
        </div>

        <form onSubmit={handleRegisterDirectPayment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Alumno Selector */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Seleccionar Alumno *
            </label>
            <select
              required
              value={formAlumnoId}
              onChange={(e) => handleStudentSelectInForm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="">-- Seleccionar alumno para cargar pago --</option>
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} {a.apellido} {a.dni ? `(DNI: ${a.dni})` : ''} -{' '}
                  {a.cuota_al_dia !== false ? 'Activo' : 'Debe'}
                </option>
              ))}
            </select>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Monto ($) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input
                type="number"
                min="0"
                step="100"
                required
                value={formMonto}
                onChange={(e) => setFormMonto(e.target.value)}
                placeholder="15000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Método */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Método de Pago
            </label>
            <select
              value={formMetodoPago}
              onChange={(e) => setFormMetodoPago(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* Fecha Inicio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Fecha Inicio / Pago *
            </label>
            <input
              type="date"
              required
              value={formFechaInicio}
              onChange={(e) => {
                setFormFechaInicio(e.target.value);
                setFormFechaVencimiento(calculateNextMonthDate(e.target.value));
                setMesCorrespondiente(formatMonthName(e.target.value));
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Fecha Vencimiento */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Fecha de Vencimiento *
            </label>
            <input
              type="date"
              required
              value={formFechaVencimiento}
              onChange={(e) => setFormFechaVencimiento(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Mes Correspondiente */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mes Correspondiente
            </label>
            <input
              type="text"
              value={formMesCorrespondiente}
              onChange={(e) => setMesCorrespondiente(e.target.value)}
              placeholder="Octubre 2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Botón Registrar */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmittingForm || !formAlumnoId}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40 border border-emerald-500/30 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmittingForm ? 'Registrando...' : 'Registrar Pago'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 5. Listado de Alumnos con Último Pago, Monto, Estado y Botón "Cargar Pago" */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Estado de Cuotas por Alumno</span>
            </h3>
            <p className="text-xs text-slate-400">
              Visualiza el último pago, vencimiento y abre el modal para registrar cuotas
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar alumno..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={filterGrupo}
              onChange={(e) => setFilterGrupo(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todos los grupos</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre_grupo}
                </option>
              ))}
            </select>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="al_dia">Solo Activos (Al día)</option>
              <option value="vencido">Solo Vencidos</option>
            </select>
          </div>
        </div>

        {/* Tabla / Tarjetas de Alumnos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3">Alumno</th>
                <th className="py-3 px-3">Grupo</th>
                <th className="py-3 px-3">Último Pago</th>
                <th className="py-3 px-3">Vencimiento</th>
                <th className="py-3 px-3">Último Monto</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAlumnos.map((alumno) => {
                const grupo = grupos.find((g) => g.id === alumno.grupo_id);
                const isActivo =
                  alumno.cuota_al_dia !== false &&
                  (!alumno.fecha_vencimiento_cuota || alumno.fecha_vencimiento_cuota >= today);

                return (
                  <tr key={alumno.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                          {alumno.nombre.charAt(0)}{alumno.apellido.charAt(0)}
                        </div>
                        <span>
                          {alumno.nombre} {alumno.apellido}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-400">
                      {grupo?.nombre_grupo || 'Sin Grupo'}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-300">
                      {alumno.fecha_pago_cuota || 'Sin registro'}
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <span className={isActivo ? 'text-slate-300' : 'text-rose-400 font-bold'}>
                        {alumno.fecha_vencimiento_cuota || 'Sin fecha'}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-emerald-300 font-bold">
                      {alumno.ultimo_monto_pago && alumno.ultimo_monto_pago > 0
                        ? `$${alumno.ultimo_monto_pago.toLocaleString()}`
                        : '-'}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isActivo
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActivo ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        {isActivo ? 'Activo (Al día)' : 'Vencido / Debe'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedStudentForModal(alumno)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition active:scale-95 shadow-sm"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Cargar Pago</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredAlumnos.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              No se encontraron alumnos con los filtros seleccionados.
            </div>
          )}
        </div>
      </div>

      {/* Modal Desplegable de Carga de Pago */}
      {selectedStudentForModal && (
        <PaymentModal
          alumno={selectedStudentForModal}
          grupos={grupos}
          isOpen={!!selectedStudentForModal}
          onClose={() => setSelectedStudentForModal(null)}
          onSavePayment={onSavePayment}
        />
      )}
    </div>
  );
};