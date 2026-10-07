import React, { useState } from 'react';
import { Alumno, Grupo, ZonaDolor, DecisionTerapeutica } from '../types';
import { getCuotaInfo, computeFullMonthExpiration } from '../utils/cuotaUtils';
import {
  Search,
  Users,
  UserPlus,
  AlertTriangle,
  FolderPlus,
  Activity,
  ClipboardList,
  Flame,
  CheckCircle2,
  Calendar,
  X,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Phone,
  Zap,
  MapPin,
  ShieldAlert,
  HeartPulse,
  Briefcase,
  FileCheck,
  Eye,
  User,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Mail,
  Sparkles,
  HelpCircle,
  FileText,
  CreditCard
} from 'lucide-react';

interface StudentListProps {
  alumnos: Alumno[];
  grupos: Grupo[];
  selectedStudentId: string | null;
  activeDockIds: string[];
  onSelectStudent: (alumno: Alumno, view: 'rutina' | 'evaluacion') => void;
  onToggleDockStudent: (alumno: Alumno) => void;
  onOpenDailyLog: (alumno: Alumno) => void;
  onAddStudent: (newAlumno: Omit<Alumno, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onEditStudent: (alumno: Alumno) => Promise<void>;
  onDeleteStudent: (alumnoId: string) => Promise<void>;
  onAddGrupo: (newGrupo: Omit<Grupo, 'id'>) => Promise<void>;
  onClearAllStudents?: () => Promise<void>;
  onNavigateToGroups?: () => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  alumnos,
  grupos,
  selectedStudentId,
  activeDockIds,
  onSelectStudent,
  onToggleDockStudent,
  onOpenDailyLog,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onAddGrupo,
  onClearAllStudents,
  onNavigateToGroups,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>('todos');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeModalSection, setActiveModalSection] = useState<'todos' | 'personal' | 'emergencia' | 'gimnasio' | 'salud'>('todos');
  const [editingStudent, setEditingStudent] = useState<Alumno | null>(null);
  const [detailStudent, setDetailStudent] = useState<Alumno | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Form states (Comprehensive intake)
  // 1. Datos Personales & Domicilio
  const [formNombre, setFormNombre] = useState('');
  const [formApellido, setFormApellido] = useState('');
  const [formDni, setFormDni] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formNacimiento, setFormNacimiento] = useState('1994-06-15');
  const [formGenero, setFormGenero] = useState<'masculino' | 'femenino' | 'otro'>('masculino');
  const [formOcupacion, setFormOcupacion] = useState('');

  // 2. Ingreso & Membresía
  const [formFechaInicio, setFormFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [formGrupoId, setFormGrupoId] = useState(grupos[0]?.id || '');
  const [formObjetivoPrincipal, setFormObjetivoPrincipal] = useState('Salud & Readaptación Funcional');
  const [formAptoEstado, setFormAptoEstado] = useState<'aprobado' | 'pendiente' | 'vencido'>('pendiente');
  const [formAptoVencimiento, setFormAptoVencimiento] = useState('');

  // 3. Contacto de Emergencia & Cobertura
  const [formEmergenciaTelefono, setFormEmergenciaTelefono] = useState('');
  const [formEmergenciaNombre, setFormEmergenciaNombre] = useState('');
  const [formEmergenciaParentesco, setFormEmergenciaParentesco] = useState('Cónyuge');
  const [formObraSocial, setFormObraSocial] = useState('');
  const [formNumeroAfiliado, setFormNumeroAfiliado] = useState('');
  const [formGrupoSanguineo, setFormGrupoSanguineo] = useState('0+');

  // 4. Antecedentes de Salud & Biomecánica
  const [formAntecedentesMedicos, setFormAntecedentesMedicos] = useState('');
  const [formAlerta, setFormAlerta] = useState('');
  const [formZonaDolor, setFormZonaDolor] = useState<ZonaDolor | ''>('');
  const [formDolorEva, setFormDolorEva] = useState<number>(0);
  const [formDecision, setFormDecision] = useState<DecisionTerapeutica>('ENTRENAR');
  const [formNotasAdmision, setFormNotasAdmision] = useState('');

  // Group Form state
  const [grpNombre, setGrpNombre] = useState('');
  const [grpHorario, setGrpHorario] = useState('');
  const [grpDesc, setGrpDesc] = useState('');

  // Cuota / Membresía Form state
  const [formFechaPagoCuota, setFormFechaPagoCuota] = useState(new Date().toISOString().split('T')[0]);
  const [formFechaVencimientoCuota, setFormFechaVencimientoCuota] = useState(() => computeFullMonthExpiration(new Date().toISOString().split('T')[0]));
  const [formCuotaAlDia, setFormCuotaAlDia] = useState(true);

  // Student Delete Confirmation Modal state
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);

  const confirmDeleteStudent = async () => {
    if (studentToDelete) {
      await onDeleteStudent(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  const handlePagoDateChange = (val: string) => {
    setFormFechaPagoCuota(val);
    if (val) {
      const nextMonth = computeFullMonthExpiration(val);
      setFormFechaVencimientoCuota(nextMonth);
    }
  };

  const resetForm = () => {
    setFormNombre('');
    setFormApellido('');
    setFormDni('');
    setFormTelefono('');
    setFormEmail('');
    setFormDireccion('');
    setFormNacimiento('1994-06-15');
    setFormGenero('masculino');
    setFormOcupacion('');
    const today = new Date().toISOString().split('T')[0];
    setFormFechaInicio(today);
    setFormGrupoId(grupos[0]?.id || '');
    setFormObjetivoPrincipal('Salud & Readaptación Funcional');
    setFormAptoEstado('pendiente');
    setFormAptoVencimiento('');
    setFormEmergenciaTelefono('');
    setFormEmergenciaNombre('');
    setFormEmergenciaParentesco('Cónyuge');
    setFormObraSocial('');
    setFormNumeroAfiliado('');
    setFormGrupoSanguineo('0+');
    setFormAntecedentesMedicos('');
    setFormAlerta('');
    setFormZonaDolor('');
    setFormDolorEva(0);
    setFormDecision('ENTRENAR');
    setFormNotasAdmision('');
    setFormFechaPagoCuota(today);
    setFormFechaVencimientoCuota(computeFullMonthExpiration(today));
    setFormCuotaAlDia(true);
    setActiveModalSection('todos');
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formApellido.trim()) return;

    await onAddStudent({
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      grupo_id: formGrupoId || (grupos[0]?.id ?? 'grp-1'),
      nombre: formNombre.trim(),
      apellido: formApellido.trim(),
      dni: formDni.trim() || undefined,
      telefono: formTelefono.trim() || '+5491100000000',
      email: formEmail.trim() || undefined,
      direccion: formDireccion.trim() || undefined,
      fecha_nacimiento: formNacimiento,
      fecha_inicio: formFechaInicio || new Date().toISOString().split('T')[0],
      estado_activo: true,

      contacto_emergencia_nombre: formEmergenciaNombre.trim() || undefined,
      contacto_emergencia_telefono: formEmergenciaTelefono.trim() || undefined,
      contacto_emergencia_parentesco: formEmergenciaParentesco || undefined,
      obra_social: formObraSocial.trim() || undefined,
      numero_afiliado: formNumeroAfiliado.trim() || undefined,
      grupo_sanguineo: formGrupoSanguineo || undefined,
      genero: formGenero,
      objetivo_principal: formObjetivoPrincipal.trim() || undefined,
      antecedentes_medicos: formAntecedentesMedicos.trim() || undefined,

      apto_medico_estado: formAptoEstado,
      apto_medico_vencimiento: formAptoVencimiento || undefined,
      ocupacion: formOcupacion.trim() || undefined,
      notas_admision: formNotasAdmision.trim() || undefined,

      alerta_lesion_activa: formAlerta.trim() || undefined,
      zona_dolor_principal: (formZonaDolor as ZonaDolor) || undefined,
      dolor_eva_actual: formDolorEva,
      decision_actual: formDecision,

      fecha_pago_cuota: formFechaPagoCuota || undefined,
      fecha_vencimiento_cuota: formFechaVencimientoCuota || undefined,
      cuota_al_dia: formCuotaAlDia,
      ultimo_monto_pago: 0,
    });

    resetForm();
    setShowAddModal(false);
  };

  const openEditModal = (alumno: Alumno, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingStudent(alumno);
    setFormNombre(alumno.nombre);
    setFormApellido(alumno.apellido);
    setFormDni(alumno.dni || '');
    setFormTelefono(alumno.telefono);
    setFormEmail(alumno.email || '');
    setFormDireccion(alumno.direccion || '');
    setFormNacimiento(alumno.fecha_nacimiento);
    setFormGenero(alumno.genero || 'masculino');
    setFormOcupacion(alumno.ocupacion || '');
    setFormFechaInicio(alumno.fecha_inicio || new Date().toISOString().split('T')[0]);
    setFormGrupoId(alumno.grupo_id);
    setFormObjetivoPrincipal(alumno.objetivo_principal || 'Salud & Readaptación Funcional');
    setFormAptoEstado(alumno.apto_medico_estado || 'pendiente');
    setFormAptoVencimiento(alumno.apto_medico_vencimiento || '');
    setFormEmergenciaTelefono(alumno.contacto_emergencia_telefono || '');
    setFormEmergenciaNombre(alumno.contacto_emergencia_nombre || '');
    setFormEmergenciaParentesco(alumno.contacto_emergencia_parentesco || 'Cónyuge');
    setFormObraSocial(alumno.obra_social || '');
    setFormNumeroAfiliado(alumno.numero_afiliado || '');
    setFormGrupoSanguineo(alumno.grupo_sanguineo || '0+');
    setFormAntecedentesMedicos(alumno.antecedentes_medicos || '');
    setFormAlerta(alumno.alerta_lesion_activa || '');
    setFormZonaDolor(alumno.zona_dolor_principal || '');
    setFormDolorEva(alumno.dolor_eva_actual ?? 0);
    setFormDecision(alumno.decision_actual === 'DERIVAR' ? 'DERIVAR' : 'ENTRENAR');
    setFormNotasAdmision(alumno.notas_admision || '');
    setFormFechaPagoCuota(alumno.fecha_pago_cuota || alumno.fecha_inicio || new Date().toISOString().split('T')[0]);
    setFormFechaVencimientoCuota(alumno.fecha_vencimiento_cuota || computeFullMonthExpiration(alumno.fecha_pago_cuota || alumno.fecha_inicio || new Date().toISOString().split('T')[0]));
    setFormCuotaAlDia(alumno.cuota_al_dia !== false);
    setActiveModalSection('todos');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    await onEditStudent({
      ...editingStudent,
      nombre: formNombre.trim(),
      apellido: formApellido.trim(),
      dni: formDni.trim() || undefined,
      telefono: formTelefono.trim(),
      email: formEmail.trim() || undefined,
      direccion: formDireccion.trim() || undefined,
      fecha_nacimiento: formNacimiento,
      fecha_inicio: formFechaInicio,
      grupo_id: formGrupoId,

      contacto_emergencia_nombre: formEmergenciaNombre.trim() || undefined,
      contacto_emergencia_telefono: formEmergenciaTelefono.trim() || undefined,
      contacto_emergencia_parentesco: formEmergenciaParentesco || undefined,
      obra_social: formObraSocial.trim() || undefined,
      numero_afiliado: formNumeroAfiliado.trim() || undefined,
      grupo_sanguineo: formGrupoSanguineo || undefined,
      genero: formGenero,
      objetivo_principal: formObjetivoPrincipal.trim() || undefined,
      antecedentes_medicos: formAntecedentesMedicos.trim() || undefined,

      apto_medico_estado: formAptoEstado,
      apto_medico_vencimiento: formAptoVencimiento || undefined,
      ocupacion: formOcupacion.trim() || undefined,
      notas_admision: formNotasAdmision.trim() || undefined,

      alerta_lesion_activa: formAlerta.trim() || undefined,
      zona_dolor_principal: (formZonaDolor as ZonaDolor) || undefined,
      dolor_eva_actual: formDolorEva,
      decision_actual: formDecision,

      fecha_pago_cuota: formFechaPagoCuota || undefined,
      fecha_vencimiento_cuota: formFechaVencimientoCuota || undefined,
      cuota_al_dia: formCuotaAlDia,
      ultimo_monto_pago: editingStudent.ultimo_monto_pago,
    });

    setShowEditModal(false);
    setEditingStudent(null);
  };

  const handleDelete = (id: string, nombre: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStudentToDelete({ id, name: nombre });
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grpNombre) return;

    await onAddGrupo({
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      nombre_grupo: grpNombre.trim(),
      horario: grpHorario.trim() || 'Horario Flexible',
      descripcion: grpDesc.trim() || undefined,
    });

    setGrpNombre('');
    setGrpHorario('');
    setGrpDesc('');
    setShowGroupModal(false);
  };

  const filteredAlumnos = alumnos.filter((alumno) => {
    const matchesGroup = selectedGrupoId === 'todos' || alumno.grupo_id === selectedGrupoId;
    const q = searchTerm.toLowerCase();
    const fullName = `${alumno.nombre} ${alumno.apellido}`.toLowerCase();
    const dni = (alumno.dni || '').toLowerCase();
    const tel = alumno.telefono.toLowerCase();
    const dir = (alumno.direccion || '').toLowerCase();
    const matchesSearch = fullName.includes(q) || dni.includes(q) || tel.includes(q) || dir.includes(q);
    return matchesGroup && matchesSearch;
  });

  const totalActivos = alumnos.length;
  const enSalaCount = activeDockIds.length;
  const conLesion = alumnos.filter((a) => a.alerta_lesion_activa || (a.dolor_eva_actual && a.dolor_eva_actual > 0)).length;

  return (
    <div className="w-full max-w-full space-y-5 pb-24 overflow-x-hidden">
      {/* Top Floor Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Alumnos</p>
          <p className="text-xl sm:text-2xl font-bold text-white font-mono mt-0.5">{totalActivos}</p>
          <span className="text-[10px] text-emerald-400 font-mono">Activos en gimnasio</span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">En Sala Activa</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-0.5">{enSalaCount} / 8</p>
          <span className="text-[10px] text-slate-400 font-mono">Alumnos fijados</span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-amber-900/40 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Con Atención / Dolor</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-400 font-mono mt-0.5">{conLesion}</p>
          <span className="text-[10px] text-amber-400/80 font-mono">Seguimiento especial</span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cuotas al Día</p>
          <p className="text-xl sm:text-2xl font-bold text-teal-400 font-mono mt-0.5">
            {alumnos.filter((a) => a.cuota_al_dia !== false).length}
          </p>
          <span className="text-[10px] text-teal-400/80 font-mono">Membresía activa</span>
        </div>
      </div>

      {/* Action Bar (Nuevo Alumno, Nuevo Grupo, etc.) - Limpio y táctil */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-white">Gestión de Alumnos</span>
          <span className="text-xs text-slate-400">({alumnos.length} registrados)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/60 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Alumno</span>
          </button>

          <button
            onClick={() => setShowGroupModal(true)}
            className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-emerald-400" />
            <span>Nuevo Grupo</span>
          </button>

          {onClearAllStudents && alumnos.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('¿Deseas eliminar todos los alumnos de prueba para empezar de cero con tus alumnos reales?')) {
                  onClearAllStudents();
                }
              }}
              className="py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 text-xs font-medium flex items-center justify-center gap-1 transition shrink-0"
              title="Vaciar alumnos de prueba y empezar de cero"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Vaciar Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, DNI, teléfono, dirección..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <select
            value={selectedGrupoId}
            onChange={(e) => setSelectedGrupoId(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="todos">Todos los Grupos ({alumnos.length})</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre_grupo}
              </option>
            ))}
          </select>

          {onNavigateToGroups && (
            <button
              type="button"
              onClick={onNavigateToGroups}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shrink-0"
              title="Ir al apartado de Grupos"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Apartado Grupos</span>
            </button>
          )}
        </div>
      </div>

      {/* Alumno Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredAlumnos.map((alumno) => {
          const isSelected = alumno.id === selectedStudentId;
          const isInDock = activeDockIds.includes(alumno.id);
          const hasInjuryAlert = Boolean(alumno.alerta_lesion_activa);
          const hasPain = Boolean(alumno.dolor_eva_actual && alumno.dolor_eva_actual > 0);
          const isDerivar = alumno.decision_actual === 'DERIVAR';
          const grupo = grupos.find((g) => g.id === alumno.grupo_id);
          const cuota = getCuotaInfo(alumno);

          return (
            <div
              key={alumno.id}
              onClick={() => onSelectStudent(alumno, 'rutina')}
              className={`rounded-2xl border p-4 transition-all duration-150 cursor-pointer relative flex flex-col justify-between group overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500/80 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                        isDerivar
                          ? 'bg-rose-950 text-rose-300 border border-rose-700'
                          : hasInjuryAlert || hasPain
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {alumno.nombre.charAt(0)}{alumno.apellido.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-white truncate leading-tight group-hover:text-emerald-300 transition-colors">
                        {alumno.nombre} {alumno.apellido}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">
                          {grupo ? grupo.nombre_grupo : 'Sin Grupo'}
                        </span>
                        {alumno.dni && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            DNI {alumno.dni}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailStudent(alumno);
                        setShowDetailModal(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Ver Ficha Médica Completa"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => openEditModal(alumno, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Editar Alumno"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(alumno.id, `${alumno.nombre} ${alumno.apellido}`, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Eliminar Alumno"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  {hasInjuryAlert && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span className="truncate font-medium">{alumno.alerta_lesion_activa}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    {hasPain ? (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 font-semibold flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5 text-rose-400" />
                        EVA {alumno.dolor_eva_actual}/10 ({alumno.zona_dolor_principal || 'zona activa'})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                        EVA 0/10 (Sin dolor)
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 rounded-lg border font-bold ${
                        isDerivar
                          ? 'bg-rose-950 border-rose-600 text-rose-200'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {alumno.decision_actual || 'ENTRENAR'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-lg border ${
                        alumno.apto_medico_estado === 'aprobado'
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                          : alumno.apto_medico_estado === 'vencido'
                          ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                          : 'bg-amber-950/60 border-amber-800 text-amber-300'
                      }`}
                      title={alumno.apto_medico_vencimiento ? `Vence: ${alumno.apto_medico_vencimiento}` : 'Estado Apto Médico'}
                    >
                      Apto: {alumno.apto_medico_estado || 'pendiente'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-mono text-[11px] truncate">{alumno.telefono}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        cuota.status === 'al_dia'
                          ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                          : cuota.status === 'vence_pronto'
                          ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                          : 'bg-rose-950/80 border-rose-800 text-rose-300'
                      }`}
                    >
                      {cuota.badgeText}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStudent(alumno, 'rutina');
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-1 transition active:scale-95"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Ver Rutina</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDailyLog(alumno);
                  }}
                  className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1 transition"
                  title="Cargar Registro Diario (RPE / Dolor)"
                >
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">RPE</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleDockStudent(alumno);
                  }}
                  className={`py-1.5 px-2.5 rounded-xl border text-xs font-medium flex items-center gap-1 transition ${
                    isInDock
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title={isInDock ? 'Quitar de Sala Activa' : 'Fijar en Sala Activa'}
                >
                  <Zap className={`w-3.5 h-3.5 ${isInDock ? 'text-emerald-400' : ''}`} />
                  <span className="text-[11px]">{isInDock ? 'En Sala' : 'Fijar'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAlumnos.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 space-y-3">
          <Users className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">No se encontraron alumnos con los filtros actuales</p>
          <p className="text-xs text-slate-500">Prueba ajustando la búsqueda o seleccionando otro grupo.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-700 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">¿Eliminar alumno?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              ¿Estás seguro de que deseas eliminar a <strong className="text-white">{studentToDelete.name}</strong>? Esta acción borrará todas sus rutinas y evaluaciones clínicas.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm active:scale-95"
              >
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Intake Modal (Add Student) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[92vh] rounded-2xl bg-[#090D16] border border-slate-800 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Alta de Alumno - Ficha Completa</h3>
                  <p className="text-xs text-slate-400">Datos personales, emergencia, membresía y condición de salud</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-1 px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setActiveModalSection('todos')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                  activeModalSection === 'todos' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ver Todo
              </button>
              <button
                type="button"
                onClick={() => setActiveModalSection('personal')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                  activeModalSection === 'personal' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Datos Personales
              </button>
              <button
                type="button"
                onClick={() => setActiveModalSection('gimnasio')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                  activeModalSection === 'gimnasio' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Grupo & Membresía
              </button>
              <button
                type="button"
                onClick={() => setActiveModalSection('emergencia')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                  activeModalSection === 'emergencia' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3. Cobertura & Emergencia
              </button>
              <button
                type="button"
                onClick={() => setActiveModalSection('salud')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                  activeModalSection === 'salud' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                4. Salud & Biomecánica
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
              {(activeModalSection === 'todos' || activeModalSection === 'personal') && (
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <User className="w-3.5 h-3.5" /> 1. Datos Personales & Identificación
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Nombre *</label>
                      <input
                        type="text"
                        required
                        value={formNombre}
                        onChange={(e) => setFormNombre(e.target.value)}
                        placeholder="Ej: Marcos"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Apellido *</label>
                      <input
                        type="text"
                        required
                        value={formApellido}
                        onChange={(e) => setFormApellido(e.target.value)}
                        placeholder="Ej: Rossi"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">DNI / Pasaporte</label>
                      <input
                        type="text"
                        value={formDni}
                        onChange={(e) => setFormDni(e.target.value)}
                        placeholder="Ej: 38.450.920"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Teléfono Móvil (WhatsApp) *</label>
                      <input
                        type="text"
                        required
                        value={formTelefono}
                        onChange={(e) => setFormTelefono(e.target.value)}
                        placeholder="+54 9 11 5500-1122"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="marcos@email.com"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={formNacimiento}
                        onChange={(e) => setFormNacimiento(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Género</label>
                      <select
                        value={formGenero}
                        onChange={(e) => setFormGenero(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Ocupación / Trabajo</label>
                      <input
                        type="text"
                        value={formOcupacion}
                        onChange={(e) => setFormOcupacion(e.target.value)}
                        placeholder="Ej: Programador (8h sentado)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Dirección / Domicilio</label>
                      <input
                        type="text"
                        value={formDireccion}
                        onChange={(e) => setFormDireccion(e.target.value)}
                        placeholder="Calle, Número, Localidad"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(activeModalSection === 'todos' || activeModalSection === 'gimnasio') && (
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <Calendar className="w-3.5 h-3.5" /> 2. Membresía, Grupo & Cuota
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Grupo / Horario *</label>
                      <select
                        value={formGrupoId}
                        onChange={(e) => setFormGrupoId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      >
                        {grupos.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.nombre_grupo} ({g.horario})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Fecha de Ingreso / Inicio</label>
                      <input
                        type="date"
                        value={formFechaInicio}
                        onChange={(e) => setFormFechaInicio(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Objetivo Principal</label>
                      <input
                        type="text"
                        value={formObjetivoPrincipal}
                        onChange={(e) => setFormObjetivoPrincipal(e.target.value)}
                        placeholder="Ej: Alivio dolor lumbar y postura"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Fecha de Pago de Cuota</label>
                      <input
                        type="date"
                        value={formFechaPagoCuota}
                        onChange={(e) => handlePagoDateChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Fecha de Vencimiento (+1 Mes)</label>
                      <input
                        type="date"
                        value={formFechaVencimientoCuota}
                        onChange={(e) => setFormFechaVencimientoCuota(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Estado de la Cuota</label>
                      <select
                        value={formCuotaAlDia ? 'al_dia' : 'debe'}
                        onChange={(e) => setFormCuotaAlDia(e.target.value === 'al_dia')}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="al_dia">Cuota al Día / Pagada</option>
                        <option value="debe">Pendiente de Pago / Vencida</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Apto Médico Físico</label>
                      <select
                        value={formAptoEstado}
                        onChange={(e) => setFormAptoEstado(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="aprobado">Aprobado / Entregado</option>
                        <option value="pendiente">Pendiente de Entrega</option>
                        <option value="vencido">Vencido</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Vencimiento Apto Médico</label>
                      <input
                        type="date"
                        value={formAptoVencimiento}
                        onChange={(e) => setFormAptoVencimiento(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(activeModalSection === 'todos' || activeModalSection === 'emergencia') && (
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> 3. Contacto de Emergencia & Cobertura Médica
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Contacto de Emergencia (Nombre)</label>
                      <input
                        type="text"
                        value={formEmergenciaNombre}
                        onChange={(e) => setFormEmergenciaNombre(e.target.value)}
                        placeholder="Ej: Laura Rossi"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Teléfono de Emergencia</label>
                      <input
                        type="text"
                        value={formEmergenciaTelefono}
                        onChange={(e) => setFormEmergenciaTelefono(e.target.value)}
                        placeholder="Ej: +54 9 11 4455-9988"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Parentesco / Vínculo</label>
                      <input
                        type="text"
                        value={formEmergenciaParentesco}
                        onChange={(e) => setFormEmergenciaParentesco(e.target.value)}
                        placeholder="Cónyuge, Madre, Padre, Amigo"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Obra Social / Prepaga</label>
                      <input
                        type="text"
                        value={formObraSocial}
                        onChange={(e) => setFormObraSocial(e.target.value)}
                        placeholder="OSDE, Swiss Medical, Galeno, etc."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Número de Afiliado</label>
                      <input
                        type="text"
                        value={formNumeroAfiliado}
                        onChange={(e) => setFormNumeroAfiliado(e.target.value)}
                        placeholder="00-1234567-01"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Grupo Sanguíneo</label>
                      <select
                        value={formGrupoSanguineo}
                        onChange={(e) => setFormGrupoSanguineo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                      >
                        <option value="0+">0 Positivo (0+)</option>
                        <option value="0-">0 Negativo (0-)</option>
                        <option value="A+">A Positivo (A+)</option>
                        <option value="A-">A Negativo (A-)</option>
                        <option value="B+">B Positivo (B+)</option>
                        <option value="B-">B Negativo (B-)</option>
                        <option value="AB+">AB Positivo (AB+)</option>
                        <option value="AB-">AB Negativo (AB-)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {(activeModalSection === 'todos' || activeModalSection === 'salud') && (
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <HeartPulse className="w-3.5 h-3.5" /> 4. Salud, Dolor Actual & Advertencias Clínicas
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-medium mb-1">Alerta Lesión o Precaución en Sala (Tooltip rápido)</label>
                      <input
                        type="text"
                        value={formAlerta}
                        onChange={(e) => setFormAlerta(e.target.value)}
                        placeholder="Ej: Hernia discal L5-S1. Evitar carga axial compresiva."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Zona Principal de Molestia/Dolor</label>
                      <select
                        value={formZonaDolor}
                        onChange={(e) => setFormZonaDolor(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Ninguna / Asintomático</option>
                        <option value="lumbar">Lumbar</option>
                        <option value="cervical">Cervical</option>
                        <option value="dorsal">Dorsal</option>
                        <option value="hombro_der">Hombro Derecho</option>
                        <option value="hombro_izq">Hombro Izquierdo</option>
                        <option value="rodilla_der">Rodilla Derecha</option>
                        <option value="rodilla_izq">Rodilla Izquierda</option>
                        <option value="cadera_der">Cadera Derecha</option>
                        <option value="cadera_izq">Cadera Izquierda</option>
                        <option value="tobillo_der">Tobillo Derecho</option>
                        <option value="tobillo_izq">Tobillo Izquierdo</option>
                        <option value="codo_der">Codo Derecho</option>
                        <option value="codo_izq">Codo Izquierdo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Nivel Dolor EVA Actual (0 - 10)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={formDolorEva}
                          onChange={(e) => setFormDolorEva(parseFloat(e.target.value))}
                          className="flex-1 accent-emerald-500"
                        />
                        <span className="font-mono font-bold text-white w-8 text-right">{formDolorEva}/10</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Decisión Inicial</label>
                      <select
                        value={formDecision}
                        onChange={(e) => setFormDecision(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="ENTRENAR">ENTRENAR (Carga dosificada en sala)</option>
                        <option value="DERIVAR">DERIVAR (Derivación médica/fisio urgente)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Antecedentes Médicos / Cirugías</label>
                      <input
                        type="text"
                        value={formAntecedentesMedicos}
                        onChange={(e) => setFormAntecedentesMedicos(e.target.value)}
                        placeholder="Ej: Operación menisco 2021, asma controlado"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-medium mb-1">Notas de Admisión / Comentarios del Profesor</label>
                      <textarea
                        rows={2}
                        value={formNotasAdmision}
                        onChange={(e) => setFormNotasAdmision(e.target.value)}
                        placeholder="Observaciones de postura, motivación, disponibilidad..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm active:scale-95"
                >
                  Guardar y Dar de Alta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[92vh] rounded-2xl bg-[#090D16] border border-slate-800 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/40 flex items-center justify-center font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Editar Alumno: {editingStudent.nombre} {editingStudent.apellido}</h3>
                  <p className="text-xs text-slate-400">Modifica datos personales, grupo, membresía o estado clínico</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <User className="w-3.5 h-3.5" /> Datos Personales
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Apellido *</label>
                    <input
                      type="text"
                      required
                      value={formApellido}
                      onChange={(e) => setFormApellido(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">DNI</label>
                    <input
                      type="text"
                      value={formDni}
                      onChange={(e) => setFormDni(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Teléfono Móvil *</label>
                    <input
                      type="text"
                      required
                      value={formTelefono}
                      onChange={(e) => setFormTelefono(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      value={formNacimiento}
                      onChange={(e) => setFormNacimiento(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Ocupación</label>
                    <input
                      type="text"
                      value={formOcupacion}
                      onChange={(e) => setFormOcupacion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Dirección</label>
                    <input
                      type="text"
                      value={formDireccion}
                      onChange={(e) => setFormDireccion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Grupo & Membresía
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Grupo Asignado</label>
                    <select
                      value={formGrupoId}
                      onChange={(e) => setFormGrupoId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    >
                      {grupos.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nombre_grupo} ({g.horario})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Fecha de Ingreso</label>
                    <input
                      type="date"
                      value={formFechaInicio}
                      onChange={(e) => setFormFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Fecha de Pago de Cuota</label>
                    <input
                      type="date"
                      value={formFechaPagoCuota}
                      onChange={(e) => handlePagoDateChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Fecha de Vencimiento de Cuota</label>
                    <input
                      type="date"
                      value={formFechaVencimientoCuota}
                      onChange={(e) => setFormFechaVencimientoCuota(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Estado Cuota</label>
                    <select
                      value={formCuotaAlDia ? 'al_dia' : 'debe'}
                      onChange={(e) => setFormCuotaAlDia(e.target.value === 'al_dia')}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="al_dia">Al Día</option>
                      <option value="debe">Vencida / Debe</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <HeartPulse className="w-3.5 h-3.5" /> Estado Clínico & Biomecánico
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">Alerta Lesión o Precaución</label>
                    <input
                      type="text"
                      value={formAlerta}
                      onChange={(e) => setFormAlerta(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Nivel Dolor EVA Actual</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={formDolorEva}
                        onChange={(e) => setFormDolorEva(parseFloat(e.target.value))}
                        className="flex-1 accent-emerald-500"
                      />
                      <span className="font-mono font-bold text-white w-8 text-right">{formDolorEva}/10</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Decisión Inicial</label>
                    <select
                      value={formDecision}
                      onChange={(e) => setFormDecision(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ENTRENAR">ENTRENAR</option>
                      <option value="DERIVAR">DERIVAR</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition shadow-sm active:scale-95"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal (Full Clinical & Personal Dossier) */}
      {showDetailModal && detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-[#090D16] border border-slate-800 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-base">
                  {detailStudent.nombre.charAt(0)}{detailStudent.apellido.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                    Ficha Completa: {detailStudent.nombre} {detailStudent.apellido}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {grupos.find((g) => g.id === detailStudent.grupo_id)?.nombre_grupo || 'Sin Grupo'} • DNI: {detailStudent.dni || 'Sin DNI'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <User className="w-3.5 h-3.5" /> Datos Personales & Contacto
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300">
                  <p><strong className="text-slate-400">Teléfono:</strong> {detailStudent.telefono}</p>
                  <p><strong className="text-slate-400">Email:</strong> {detailStudent.email || 'No especificado'}</p>
                  <p><strong className="text-slate-400">Nacimiento:</strong> {detailStudent.fecha_nacimiento}</p>
                  <p><strong className="text-slate-400">Género:</strong> {detailStudent.genero || 'masculino'}</p>
                  <p><strong className="text-slate-400">Ocupación:</strong> {detailStudent.ocupacion || 'No especificada'}</p>
                  <p><strong className="text-slate-400">Dirección:</strong> {detailStudent.direccion || 'No especificada'}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5" /> Cobertura Médica & Emergencia
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300">
                  <p><strong className="text-slate-400">Contacto Emergencia:</strong> {detailStudent.contacto_emergencia_nombre || 'No asignado'}</p>
                  <p><strong className="text-slate-400">Tel. Emergencia:</strong> {detailStudent.contacto_emergencia_telefono || 'No asignado'}</p>
                  <p><strong className="text-slate-400">Vínculo:</strong> {detailStudent.contacto_emergencia_parentesco || '-'}</p>
                  <p><strong className="text-slate-400">Obra Social:</strong> {detailStudent.obra_social || 'No especificada'}</p>
                  <p><strong className="text-slate-400">Nº Afiliado:</strong> {detailStudent.numero_afiliado || '-'}</p>
                  <p><strong className="text-slate-400">Grupo Sanguíneo:</strong> <span className="font-mono text-emerald-300 font-bold">{detailStudent.grupo_sanguineo || '0+'}</span></p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <Calendar className="w-3.5 h-3.5" /> Membresía & Cuota
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300">
                  <p><strong className="text-slate-400">Fecha Ingreso:</strong> {detailStudent.fecha_inicio}</p>
                  <p><strong className="text-slate-400">Apto Médico:</strong> <span className="capitalize">{detailStudent.apto_medico_estado || 'pendiente'}</span></p>
                  <p><strong className="text-slate-400">Vence Apto:</strong> {detailStudent.apto_medico_vencimiento || 'No fijado'}</p>
                  <p><strong className="text-slate-400">Último Pago:</strong> {detailStudent.fecha_pago_cuota || 'Sin registro'}</p>
                  <p><strong className="text-slate-400">Vence Cuota:</strong> {detailStudent.fecha_vencimiento_cuota || 'No fijada'}</p>
                  <p><strong className="text-slate-400">Monto:</strong> <span className="font-mono font-bold text-white">{detailStudent.ultimo_monto_pago ? `$${detailStudent.ultimo_monto_pago}` : '--'}</span></p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <HeartPulse className="w-3.5 h-3.5" /> Estado Clínico Actual
                </h4>
                <div className="space-y-1.5 text-slate-300">
                  <p><strong className="text-slate-400">Alerta de Lesión:</strong> {detailStudent.alerta_lesion_activa || 'Ninguna alerta activa'}</p>
                  <p><strong className="text-slate-400">Dolor EVA Actual:</strong> {detailStudent.dolor_eva_actual ?? 0}/10 ({detailStudent.zona_dolor_principal || 'Asintomático'})</p>
                  <p><strong className="text-slate-400">Decisión Conducta:</strong> <strong className="text-emerald-400">{detailStudent.decision_actual || 'ENTRENAR'}</strong></p>
                  <p><strong className="text-slate-400">Antecedentes Médicos:</strong> {detailStudent.antecedentes_medicos || 'Sin antecedentes registrados'}</p>
                  <p><strong className="text-slate-400">Notas de Admisión:</strong> {detailStudent.notas_admision || 'Sin notas adicionales'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Group Quick Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#090D16] border border-slate-800 shadow-2xl p-5 text-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Crear Nuevo Grupo</h3>
              </div>
              <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nombre del Grupo *</label>
                <input
                  type="text"
                  required
                  value={grpNombre}
                  onChange={(e) => setGrpNombre(e.target.value)}
                  placeholder="Ej: Turno Mañana A"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Días y Horarios</label>
                <input
                  type="text"
                  value={grpHorario}
                  onChange={(e) => setGrpHorario(e.target.value)}
                  placeholder="Ej: Lun - Mié - Vie 08:00 a 09:30"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Descripción / Enfoque</label>
                <input
                  type="text"
                  value={grpDesc}
                  onChange={(e) => setGrpDesc(e.target.value)}
                  placeholder="Ej: Fuerza Funcional & Salud"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm"
                >
                  Crear Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};