import React, { useState, useMemo } from 'react';
import { Profesor, PagoCuota, Alumno } from '../types';
import {
  ShieldCheck,
  User,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Building2,
  Mail,
  Calendar,
  Lock,
  Unlock,
  RefreshCw,
  X,
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  AlertTriangle,
  Award
} from 'lucide-react';

interface AdminDashboardProps {
  currentUserEmail?: string;
  users?: Profesor[];
  pagos?: PagoCuota[];
  alumnos?: Alumno[];
  onToggleStatus: (userId: string, nuevoEstado: boolean) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUserEmail = '',
  users = [],
  pagos = [],
  alumnos = [],
  onToggleStatus,
  onDeleteUser,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados para los modales de confirmación
  const [userToToggle, setUserToToggle] = useState<{ user: Profesor; targetStatus: boolean } | null>(null);
  const [userToDelete, setUserToDelete] = useState<Profesor | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Verifica si es el propietario titular principal
  const isMasterAdmin = (email?: string) => {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    return (
      clean === 'jonalippo@gmail.com' ||
      clean === 'prof-1'
    );
  };

  // CÁLCULO DE MÉTRICAS FINANCIERAS Y DE GESTIÓN (Con arrays seguros)
  const metrics = useMemo(() => {
    const safePagos = Array.isArray(pagos) ? pagos : [];
    const safeAlumnos = Array.isArray(alumnos) ? alumnos : [];
    const safeUsers = Array.isArray(users) ? users : [];

    // 1. Ingresos totales históricos
    const totalIngresos = safePagos.reduce((sum, p) => sum + (Number(p?.monto) || 0), 0);

    // 2. Ingresos del mes actual
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const pagosMesActual = safePagos.filter((p) => {
      if (!p?.fecha_pago) return false;
      const fecha = new Date(p.fecha_pago);
      return !isNaN(fecha.getTime()) && fecha.getFullYear() === currentYear && fecha.getMonth() === currentMonth;
    });

    const ingresosMesActual = pagosMesActual.reduce((sum, p) => sum + (Number(p?.monto) || 0), 0);

    // 3. Estado de alumnos (cuotas al día vs morosas)
    const totalAlumnos = safeAlumnos.length;
    const alumnosAlDia = safeAlumnos.filter((a) => a?.cuota_al_dia !== false).length;
    const alumnosPendientes = totalAlumnos - alumnosAlDia;

    // 4. Ticket promedio por pago
    const ticketPromedio = safePagos.length > 0 ? Math.round(totalIngresos / safePagos.length) : 0;

    // 5. Métricas de usuarios
    const totalUsuarios = safeUsers.length;
    const usuariosActivos = safeUsers.filter((u) => u?.activo !== false).length;
    const usuariosDesactivados = safeUsers.filter((u) => u?.activo === false).length;

    return {
      totalIngresos,
      ingresosMesActual,
      pagosMesActualCount: pagosMesActual.length,
      totalAlumnos,
      alumnosAlDia,
      alumnosPendientes,
      ticketPromedio,
      totalUsuarios,
      usuariosActivos,
      usuariosDesactivados
    };
  }, [pagos, alumnos, users]);

  // Formateador de moneda en pesos argentinos
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filtro reactivo de usuarios protegido contra undefined
  const filteredUsers = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    return safeUsers.filter((u) => {
      if (!u) return false;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (u.nombre && u.nombre.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.gym_name && u.gym_name.toLowerCase().includes(term));

      const isActivo = u.activo !== false;
      if (filterStatus === 'active') return matchesSearch && isActivo;
      if (filterStatus === 'inactive') return matchesSearch && !isActivo;
      return Boolean(matchesSearch);
    });
  }, [users, searchTerm, filterStatus]);

  // Manejador de refresco
  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Confirmar cambio de estado (Habilitar / Deshabilitar)
  const handleConfirmToggleStatus = async () => {
    if (!userToToggle) return;
    setIsProcessing(true);
    try {
      await onToggleStatus(userToToggle.user.id, userToToggle.targetStatus);
      setUserToToggle(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirmar eliminación definitiva
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsProcessing(true);
    try {
      await onDeleteUser(userToDelete.id);
      setUserToDelete(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-950/50 shrink-0 font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">Panel de Administración</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                Solo Administrador
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervisión de cuentas.
            </p>
          </div>
        </div>

        <button
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95 shrink-0"
          title="Actualizar datos desde la base de datos"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* SECCIÓN 2: CONTROL DE USUARIOS Y PROFESORES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Usuarios y Profesores ({metrics.totalUsuarios})
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{metrics.usuariosActivos} Activos</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 font-mono font-semibold">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>{metrics.usuariosDesactivados} Desactivados</span>
            </span>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar profesor por nombre, correo o nombre de gimnasio..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filterStatus === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({metrics.totalUsuarios})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filterStatus === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Activos ({metrics.usuariosActivos})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filterStatus === 'inactive' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Desactivados ({metrics.usuariosDesactivados})
            </button>
          </div>
        </div>

        {/* Listado de Tarjetas de Usuarios */}
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-400 text-xs">
              <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No se encontraron profesores registrados</p>
              <p className="text-[11px] mt-1">Prueba cambiando los términos de búsqueda o filtros.</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isOwner = isMasterAdmin(user.email);
              const isActivo = user.activo !== false;

              return (
                <div
                  key={user.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Datos del Usuario */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 border ${
                        isOwner
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                          : isActivo
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {(user.nombre ? user.nombre.charAt(0) : 'P').toUpperCase()}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white truncate">{user.nombre || 'Profesor'}</h4>

                        {isOwner && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono font-bold tracking-wide">
                            PROPIETARIO TITULAR
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isActivo
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {isActivo ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Cuenta Habilitada</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>Cuenta Desactivada</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-300 font-mono text-[11px]">{user.email}</span>
                        </span>

                        {user.gym_name && (
                          <span className="inline-flex items-center gap-1.5 truncate">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{user.gym_name}</span>
                          </span>
                        )}

                        {user.created_at && (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <span>Registrado el {new Date(user.created_at).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones e Iconos con Modales */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800 w-full md:w-auto justify-end">
                    {isOwner ? (
                      <span className="text-[11px] text-slate-400 font-mono italic px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Cuenta Principal Protegida</span>
                      </span>
                    ) : (
                      <>
                        {/* BOTÓN ACTIVAR (Si está desactivada) */}
                        {!isActivo && (
                          <button
                            onClick={() => setUserToToggle({ user, targetStatus: true })}
                            className="px-3.5 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-700/60 hover:border-emerald-500 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                            title="Habilitar acceso a la plataforma"
                          >
                            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Activar Cuenta</span>
                          </button>
                        )}

                        {/* BOTÓN DESACTIVAR (Si está activa) */}
                        {isActivo && (
                          <button
                            onClick={() => setUserToToggle({ user, targetStatus: false })}
                            className="px-3.5 py-2 rounded-xl bg-amber-950/70 hover:bg-amber-900/90 text-amber-300 border border-amber-700/60 hover:border-amber-500 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                            title="Desactivar cuenta para bloquear ingreso"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Desactivar</span>
                          </button>
                        )}

                        {/* BOTÓN ELIMINAR DEFINITIVO */}
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="px-3.5 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-700/60 hover:border-rose-500 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                          title="Eliminar usuario definitivamente de la base de datos"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Eliminar</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL 1: CONFIRMAR ACTIVAR / DESACTIVAR CUENTA */}
      {userToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div
                className={`flex items-center gap-2 font-bold text-sm ${
                  userToToggle.targetStatus ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {userToToggle.targetStatus ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                <span>
                  {userToToggle.targetStatus ? 'Confirmar Activación de Cuenta' : 'Confirmar Desactivación de Cuenta'}
                </span>
              </div>
              <button
                onClick={() => setUserToToggle(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Deseas {userToToggle.targetStatus ? 'activar' : 'desactivar'} el acceso para el profesor{' '}
              <strong className="text-white font-bold">{userToToggle.user.nombre}</strong> (
              <span className="text-slate-300 font-mono">{userToToggle.user.email}</span>)?
            </p>

            <div
              className={`p-3.5 rounded-2xl text-xs space-y-1 border ${
                userToToggle.targetStatus
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              }`}
            >
              {userToToggle.targetStatus ? (
                <>
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Consecuencias de activar la cuenta:</span>
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    El usuario podrá volver a iniciar sesión con sus credenciales y gestionar normalmente sus alumnos y rutinas.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Consecuencias de desactivar la cuenta:</span>
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    El usuario ya no podrá ingresar a la aplicación. Sus datos y alumnos permanecerán guardados hasta que decidas reactivar la cuenta.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setUserToToggle(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmToggleStatus}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition disabled:opacity-50 text-white ${
                  userToToggle.targetStatus
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
                    : 'bg-amber-600 hover:bg-amber-500 shadow-amber-950'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : userToToggle.targetStatus ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Sí, Activar Cuenta</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sí, Desactivar Cuenta</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMAR ELIMINACIÓN PERMANENTE */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Confirmar Eliminación Definitiva</span>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Estás completamente seguro de que deseas eliminar la cuenta de{' '}
              <strong className="text-white font-bold">{userToDelete.nombre}</strong> (
              <span className="text-rose-300 font-mono">{userToDelete.email}</span>)?
            </p>

            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Esta acción es irreversible y permanente:</span>
              </p>
              <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-slate-300">
                <li>Se borrará el perfil del profesor de la base de datos.</li>
                <li>Se eliminarán todos sus grupos, turnos y alumnos vinculados.</li>
                <li>El usuario no podrá volver a iniciar sesión en la aplicación.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-950 transition"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, Eliminar Definitivamente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};