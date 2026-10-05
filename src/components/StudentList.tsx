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
      setFormCuotaAlDia(true);
    }
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const diff = Date.now() - new Date(birthDate).getTime();
    return Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
  };

  const filteredAlumnos = alumnos.filter((alumno) => {
    const matchesSearch =
      `${alumno.nombre} ${alumno.apellido} ${alumno.dni || ''} ${alumno.telefono}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alumno.alerta_lesion_activa && alumno.alerta_lesion_activa.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (alumno.direccion && alumno.direccion.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGroup = selectedGrupoId === 'todos' || alumno.grupo_id === selectedGrupoId;
    return matchesSearch && matchesGroup;
  });

  const totalActivos = alumnos.filter((a) => a.estado_activo).length;
  const conLesion = alumnos.filter((a) => a.alerta_lesion_activa || (a.dolor_eva_actual && a.dolor_eva_actual > 0)).length;
  const enSalaCount = activeDockIds.length;

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
    setFormFechaInicio(new Date().toISOString().split('T')[0]);
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
    setFormFechaPagoCuota(new Date().toISOString().split('T')[0]);
    setFormFechaVencimientoCuota(computeFullMonthExpiration(new Date().toISOString().split('T')[0]));
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

  return (
    <div className="w-full max-w-full space-y-5 pb-24 overflow-x-hidden">
      {/* Top Floor Summary & Actions */}
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

        <div className="p-2 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-center gap-1.5 shadow-sm">
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-950/50 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Nuevo Alumno</span>
          </button>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowGroupModal(true)}
              className="flex-1 py-1 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1 transition"
            >
              <FolderPlus className="w-3 h-3 text-slate-400" />
              <span>Nuevo Grupo</span>
            </button>
            {onClearAllStudents && alumnos.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('¿Deseas eliminar todos los alumnos de prueba para empezar de cero con tus alumnos reales?')) {
                    onClearAllStudents();
                  }
                }}
                className="py-1 px-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 text-[10px] font-semibold flex items-center justify-center gap-1 transition shrink-0"
                title="Vaciar alumnos de prueba y empezar de cero"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Vaciar Demo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters Bar (Zero horizontal scroll) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
        {/* Global Instant Search */}
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

        {/* Group Selector & Manager Link */}
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
              title="Ir al apartado de Grupos para editar nombres, cargar nuevos y ver los alumnos de cada grupo"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Apartado Grupos</span>
            </button>
          )}
        </div>
      </div>

      {/* Alumno Cards Grid (Adaptive, zero horizontal scroll) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredAlumnos.map((alumno) => {
          const isSelected = alumno.id === selectedStudentId;
          const isInDock = activeDockIds.includes(alumno.id);
          const hasAlert = !!alumno.alerta_lesion_activa || (alumno.dolor_eva_actual !== undefined && alumno.dolor_eva_actual > 0);
          const grupo = grupos.find((g) => g.id === alumno.grupo_id);
          const cuota = getCuotaInfo(alumno);

          return (
            <div
              key={alumno.id}
              className={`rounded-2xl border p-4 bg-slate-900/90 transition-all flex flex-col justify-between shadow-sm relative group hover:border-slate-700 ${
                isSelected
                  ? 'border-emerald-500/80 ring-1 ring-emerald-500/30'
                  : 'border-slate-800/80'
              }`}
            >
              <div>
                {/* Header Row: Name & Action Icons */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center text-sm font-bold text-emerald-400 shrink-0">
                      {alumno.nombre.charAt(0)}{alumno.apellido.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-bold text-white tracking-tight truncate">
                        {alumno.nombre} {alumno.apellido}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <p className="text-xs text-slate-400 truncate">
                          {grupo ? grupo.nombre_grupo : 'Turno General'}
                        </p>
                        {/* Cuota Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                            cuota.isAlDia
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cuota.isAlDia ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span>{cuota.statusText === 'ACTIVO' ? 'Activo' : 'Debe'}</span>
                        </span>
                        {alumno.fecha_vencimiento_cuota && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Vence: {alumno.fecha_vencimiento_cuota}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Action Icons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setDetailStudent(alumno);
                        setShowDetailModal(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                      title="Ver ficha completa de alumno"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => openEditModal(alumno, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Editar ficha"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(alumno.id, `${alumno.nombre} ${alumno.apellido}`, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Eliminar alumno"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Injury notice if applicable */}
                {hasAlert && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-xs">
                    <div className="flex items-center justify-between text-amber-300 font-semibold mb-0.5">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>Precaución Biomecánica</span>
                      </span>
                      {alumno.dolor_eva_actual !== undefined && alumno.dolor_eva_actual > 0 && (
                        <span className="font-mono text-[11px] text-amber-300">
                          EVA: {alumno.dolor_eva_actual}/10
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-[11px] line-clamp-2">
                      {alumno.alerta_lesion_activa || 'Monitoreo de tolerancia en sala.'}
                    </p>
                  </div>
                )}

                {/* Quick Info Grid: Teléfono, DNI, Ingreso, Emergencia */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between font-mono">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      {alumno.telefono}
                    </span>
                    {alumno.dni && (
                      <span className="text-slate-400">DNI: {alumno.dni}</span>
                    )}
                  </div>

                  {alumno.direccion && (
                    <div className="flex items-center gap-1 text-slate-400 truncate">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{alumno.direccion}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Inicio: {alumno.fecha_inicio || '2024-01-01'}
                    </span>
                    {alumno.contacto_emergencia_telefono ? (
                      <span className="text-rose-400/90 font-mono font-medium truncate max-w-[150px]">
                        SOS: {alumno.contacto_emergencia_telefono}
                      </span>
                    ) : (
                      <span className="text-slate-600">Sin SOS</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => onSelectStudent(alumno, 'rutina')}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                  title="Abrir planilla de rutina interactiva"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Ver Rutina</span>
                </button>

                <button
                  onClick={() => onSelectStudent(alumno, 'evaluacion')}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
                  title="Evaluación clínica biopsicosocial"
                >
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span>Clínica</span>
                </button>

                <button
                  onClick={() => onOpenDailyLog(alumno)}
                  className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition"
                  title="Registrar sesión RPE"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">RPE</span>
                </button>

                <button
                  onClick={() => onToggleDockStudent(alumno)}
                  className={`p-2 rounded-xl border text-xs font-medium transition ${
                    isInDock
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title={isInDock ? 'Quitar de sala activa' : 'Fijar en barra de sala activa'}
                >
                  <Zap className={`w-4 h-4 ${isInDock ? 'text-emerald-400 fill-emerald-400' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAlumnos.length === 0 && (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl p-8 bg-slate-900/30 max-w-xl mx-auto my-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-950/50">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg text-white font-bold tracking-tight">
            {alumnos.length === 0 ? '¡Tu espacio está listo y limpio!' : 'No se encontraron alumnos'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            {alumnos.length === 0
              ? 'La lista de alumnos está vacía. Ahora puedes registrar a los alumnos reales de tu gimnasio con sus datos clínicos y planificar sus rutinas.'
              : 'Prueba cambiando el término de búsqueda o seleccionando otro grupo.'}
          </p>
          <div className="mt-5">
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/50 transition active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Primer Alumno</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: VER FICHA COMPLETA DEL ALUMNO (CON BOTÓN VOLVER PROMINENTE) */}
      {showDetailModal && detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Top Navigation Bar with Back Button */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700 active:scale-95 group"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Volver a Alumnos</span>
                </button>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">
                    {detailStudent.nombre} {detailStudent.apellido}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ficha integral de admisión, emergencias y salud
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {/* Sección 1: Datos Personales & Domicilio */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <h4 className="font-bold text-emerald-400 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  <span>1. Datos Personales & Domicilio</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <p><strong className="text-slate-400">Nombre Completo:</strong> {detailStudent.nombre} {detailStudent.apellido}</p>
                  <p><strong className="text-slate-400">DNI / Documento:</strong> {detailStudent.dni || 'No registrado'}</p>
                  <p><strong className="text-slate-400">Teléfono / WhatsApp:</strong> {detailStudent.telefono}</p>
                  <p><strong className="text-slate-400">Correo Electrónico:</strong> {detailStudent.email || 'No registrado'}</p>
                  <p><strong className="text-slate-400">Fecha de Nacimiento:</strong> {detailStudent.fecha_nacimiento} ({calculateAge(detailStudent.fecha_nacimiento)} años)</p>
                  <p><strong className="text-slate-400">Género:</strong> {detailStudent.genero || 'No informado'}</p>
                  <p><strong className="text-slate-400">Ocupación / Profesión:</strong> {detailStudent.ocupacion || 'No informada'}</p>
                  <p className="sm:col-span-2"><strong className="text-slate-400">Dirección / Domicilio:</strong> {detailStudent.direccion || 'No registrada'}</p>
                </div>
              </div>

              {/* Sección 2: Contacto de Emergencia & Cobertura Médica */}
              <div className="p-4 rounded-xl bg-slate-950 border border-rose-900/30 space-y-2.5">
                <h4 className="font-bold text-rose-400 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  <span>2. Contacto de Emergencia (SOS) & Cobertura Médica</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <p><strong className="text-slate-400">Teléfono SOS Emergencias:</strong> <span className="font-mono text-rose-300 font-bold">{detailStudent.contacto_emergencia_telefono || 'No asignado'}</span></p>
                  <p><strong className="text-slate-400">Contacto de Emergencia:</strong> {detailStudent.contacto_emergencia_nombre || 'No asignado'}</p>
                  <p><strong className="text-slate-400">Parentesco:</strong> {detailStudent.contacto_emergencia_parentesco || '-'}</p>
                  <p><strong className="text-slate-400">Grupo Sanguíneo:</strong> {detailStudent.grupo_sanguineo || 'No informado'}</p>
                  <p><strong className="text-slate-400">Obra Social / Prepaga:</strong> {detailStudent.obra_social || 'Particular / Sin cobertura'}</p>
                  <p><strong className="text-slate-400">N° de Afiliado:</strong> {detailStudent.numero_afiliado || 'No registrado'}</p>
                </div>
              </div>

              {/* Sección 3: Gimnasio & Apto Médico */}
              <div className="p-4 rounded-xl bg-slate-950 border border-blue-900/30 space-y-2.5">
                <h4 className="font-bold text-blue-400 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <FileCheck className="w-4 h-4" />
                  <span>3. Membresía, Turno & Apto Médico</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <p><strong className="text-slate-400">Fecha de Inicio / Alta:</strong> {detailStudent.fecha_inicio || '2024-01-01'}</p>
                  <p><strong className="text-slate-400">Objetivo de Entrenamiento:</strong> {detailStudent.objetivo_principal || 'Acondicionamiento general'}</p>
                  <p><strong className="text-slate-400">Apto Médico:</strong> <span className="uppercase text-emerald-400 font-semibold">{detailStudent.apto_medico_estado || 'Pendiente'}</span></p>
                  <p><strong className="text-slate-400">Vencimiento Apto:</strong> {detailStudent.apto_medico_vencimiento || 'No indicada'}</p>
                  <div className="sm:col-span-2 flex items-center gap-2 pt-1.5 border-t border-slate-800/80 mt-1">
                    <strong className="text-slate-400">Cuota Mensual:</strong>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCuotaInfo(detailStudent).isAlDia ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                      {getCuotaInfo(detailStudent).statusText === 'ACTIVO' ? 'Activo (Al día)' : 'Debe cuota'}
                    </span>
                    {detailStudent.fecha_vencimiento_cuota && (
                      <span className="text-slate-300 font-mono text-[11px]">
                        • Vencimiento: {detailStudent.fecha_vencimiento_cuota}
                      </span>
                    )}
                    {detailStudent.fecha_pago_cuota && (
                      <span className="text-slate-500 font-mono text-[10px]">
                        (Abonó: {detailStudent.fecha_pago_cuota})
                      </span>
                    )}
                  </div>
                  {detailStudent.notas_admision && (
                    <p className="sm:col-span-2"><strong className="text-slate-400">Notas de Admisión:</strong> {detailStudent.notas_admision}</p>
                  )}
                </div>
              </div>

              {/* Sección 4: Antecedentes & Biomecánica */}
              {(detailStudent.alerta_lesion_activa || detailStudent.antecedentes_medicos) && (
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/30 space-y-2 text-xs">
                  <h4 className="font-bold text-amber-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>4. Antecedentes de Salud & Dolor</span>
                  </h4>
                  {detailStudent.antecedentes_medicos && (
                    <p><strong className="text-slate-400">Antecedentes Médicos / Alergias:</strong> {detailStudent.antecedentes_medicos}</p>
                  )}
                  {detailStudent.alerta_lesion_activa && (
                    <p><strong className="text-slate-400">Precaución Biomecánica:</strong> {detailStudent.alerta_lesion_activa}</p>
                  )}
                  {detailStudent.dolor_eva_actual !== undefined && detailStudent.dolor_eva_actual > 0 && (
                    <p><strong className="text-slate-400">Dolor EVA Actual:</strong> {detailStudent.dolor_eva_actual} / 10</p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => setShowDetailModal(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Alumnos</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    onSelectStudent(detailStudent, 'rutina');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <ClipboardList className="w-4 h-4 text-emerald-400" />
                  <span>Ver Rutina</span>
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(detailStudent);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Ficha</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COMPLETO: NUEVO / EDITAR ALUMNO (FORMULARIO ESTRUCTURADO Y VISIBLE) */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 max-h-[94vh] flex flex-col overflow-hidden">
            {/* Header with Back/Close button */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700 active:scale-95 group"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Cancelar / Volver</span>
                </button>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">
                    {showEditModal ? `Editar Alumno: ${formNombre} ${formApellido}` : 'Alta Integral de Alumno'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Todos los datos requeridos para gestión en sala, contacto y emergencias.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Section Navigation Bar */}
            <div className="flex items-center border-b border-slate-800 bg-slate-950/90 overflow-x-auto px-4 py-2 shrink-0 text-xs font-semibold gap-1.5 no-scrollbar">
              {[
                { id: 'todos', label: 'Ver Todo el Formulario', icon: FileText },
                { id: 'personal', label: '1. Contacto & Domicilio', icon: User },
                { id: 'emergencia', label: '2. Emergencias & Obra Social', icon: ShieldAlert },
                { id: 'gimnasio', label: '3. Ingreso & Membresía', icon: Briefcase },
                { id: 'salud', label: '4. Antecedentes & Dolor', icon: HeartPulse }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeModalSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveModalSection(tab.id as typeof activeModalSection)}
                    className={`py-1.5 px-3 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Body */}
            <form onSubmit={showEditModal ? handleSaveEdit : handleCreateStudent} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
              {/* SECCIÓN 1: DATOS PERSONALES, CONTACTO & DOMICILIO */}
              {(activeModalSection === 'todos' || activeModalSection === 'personal') && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <h4 className="font-bold text-emerald-400 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <User className="w-4 h-4" />
                      <span>1. Datos Personales, Contacto & Domicilio</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">* Campos esenciales</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Nombre *</label>
                      <input
                        type="text"
                        required
                        value={formNombre}
                        onChange={(e) => setFormNombre(e.target.value)}
                        placeholder="Ej. Lucas"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Apellido *</label>
                      <input
                        type="text"
                        required
                        value={formApellido}
                        onChange={(e) => setFormApellido(e.target.value)}
                        placeholder="Ej. Navarro"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Teléfono / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={formTelefono}
                        onChange={(e) => setFormTelefono(e.target.value.replace(/[^0-9+() -]/g, ''))}
                        placeholder="+54 9 11 1234-5678"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">DNI / Documento de Identidad</label>
                      <input
                        type="text"
                        value={formDni}
                        onChange={(e) => setFormDni(e.target.value)}
                        placeholder="Ej. 34.567.890"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Dirección / Domicilio Completo *</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Calle, número, piso/depto, localidad</span>
                    </label>
                    <input
                      type="text"
                      value={formDireccion}
                      onChange={(e) => setFormDireccion(e.target.value)}
                      placeholder="Ej. Av. Cabildo 2040, Piso 3 Depto B, Belgrano, CABA"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={formNacimiento}
                        onChange={(e) => setFormNacimiento(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                      <span className="block mt-1 text-[10px] text-slate-400 font-mono">
                        Edad calculada: {calculateAge(formNacimiento)} años
                      </span>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Género</label>
                      <select
                        value={formGenero}
                        onChange={(e) => setFormGenero(e.target.value as 'masculino' | 'femenino' | 'otro')}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                      >
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro / Prefiero no decir</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Ocupación / Trabajo</label>
                      <input
                        type="text"
                        value={formOcupacion}
                        onChange={(e) => setFormOcupacion(e.target.value)}
                        placeholder="Ej. Oficina / Chofer / Docente"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Correo Electrónico</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="nombre@ejemplo.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* SECCIÓN 2: CONTACTO DE EMERGENCIA & COBERTURA */}
              {(activeModalSection === 'todos' || activeModalSection === 'emergencia') && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-rose-950/60 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-rose-900/40 pb-2">
                    <h4 className="font-bold text-rose-400 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4" />
                      <span>2. Contacto de Emergencia (SOS) & Cobertura Médica</span>
                    </h4>
                    <span className="text-[10px] text-rose-300 font-mono">Protocolo de seguridad</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-rose-300 mb-1 font-semibold">Teléfono de Emergencia (SOS) *</label>
                      <input
                        type="tel"
                        required
                        value={formEmergenciaTelefono}
                        onChange={(e) => setFormEmergenciaTelefono(e.target.value.replace(/[^0-9+() -]/g, ''))}
                        placeholder="Ej. +54 9 11 9876-5432"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-rose-900/50 text-slate-100 focus:outline-none focus:border-rose-500 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Nombre del Contacto de Emergencia</label>
                      <input
                        type="text"
                        value={formEmergenciaNombre}
                        onChange={(e) => setFormEmergenciaNombre(e.target.value)}
                        placeholder="Ej. María Gómez"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Parentesco</label>
                      <select
                        value={formEmergenciaParentesco}
                        onChange={(e) => setFormEmergenciaParentesco(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                      >
                        <option value="Cónyuge">Cónyuge / Pareja</option>
                        <option value="Madre/Padre">Madre / Padre</option>
                        <option value="Hijo/a">Hijo / Hija</option>
                        <option value="Hermano/a">Hermano / Hermana</option>
                        <option value="Amigo/a">Amigo / Amiga</option>
                        <option value="Otro">Otro familiar / Tutor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Obra Social / Prepaga</label>
                      <input
                        type="text"
                        value={formObraSocial}
                        onChange={(e) => setFormObraSocial(e.target.value)}
                        placeholder="Ej. OSDE / Swiss Medical / Particular"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">N° de Afiliado</label>
                      <input
                        type="text"
                        value={formNumeroAfiliado}
                        onChange={(e) => setFormNumeroAfiliado(e.target.value)}
                        placeholder="Ej. 450982-01"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Grupo Sanguíneo</label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {['0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((gs) => (
                        <button
                          key={gs}
                          type="button"
                          onClick={() => setFormGrupoSanguineo(gs)}
                          className={`py-1.5 rounded-xl border text-xs font-mono font-bold transition ${
                            formGrupoSanguineo === gs
                              ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {gs}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 3: MEMBRESÍA EN GIMNASIO & APTO MÉDICO */}
              {(activeModalSection === 'todos' || activeModalSection === 'gimnasio') && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-blue-950/60 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-blue-900/40 pb-2">
                    <h4 className="font-bold text-blue-400 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <Briefcase className="w-4 h-4" />
                      <span>3. Membresía, Turno & Apto Médico</span>
                    </h4>
                    <span className="text-[10px] text-blue-300 font-mono">Control de sala</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Fecha de Inicio / Alta *</label>
                      <input
                        type="date"
                        required
                        value={formFechaInicio}
                        onChange={(e) => setFormFechaInicio(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Turno / Horario Asignado</label>
                      <select
                        value={formGrupoId}
                        onChange={(e) => setFormGrupoId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-semibold"
                      >
                        {grupos.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.nombre_grupo} ({g.horario})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Objetivo Principal</label>
                      <select
                        value={formObjetivoPrincipal}
                        onChange={(e) => setFormObjetivoPrincipal(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                      >
                        <option value="Salud & Readaptación Funcional">Salud & Readaptación Funcional</option>
                        <option value="Hipertrofia Muscular">Hipertrofia Muscular</option>
                        <option value="Fuerza Máxima">Fuerza Máxima</option>
                        <option value="Pérdida de Grasa & Metabólico">Pérdida de Grasa & Metabólico</option>
                        <option value="Rendimiento Deportivo / Atlética">Rendimiento Deportivo / Atlética</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Estado de Apto Médico</label>
                      <select
                        value={formAptoEstado}
                        onChange={(e) => setFormAptoEstado(e.target.value as 'aprobado' | 'pendiente' | 'vencido')}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-semibold"
                      >
                        <option value="aprobado">Aprobado / Al día</option>
                        <option value="pendiente">Pendiente de entrega</option>
                        <option value="vencido">Vencido</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Fecha de Vencimiento de Apto</label>
                      <input
                        type="date"
                        value={formAptoVencimiento}
                        onChange={(e) => setFormAptoVencimiento(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Cuota / Membresía Mensual */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="block text-emerald-400 font-bold mb-2 uppercase tracking-wider text-[11px]">
                      Estado de Cuota Mensual
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">Fecha de Pago de Cuota</label>
                        <input
                          type="date"
                          value={formFechaPagoCuota}
                          onChange={(e) => handlePagoDateChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Al abonar, vence a mes completo automáticamente.</span>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">Vencimiento (Mes Completo)</label>
                        <input
                          type="date"
                          value={formFechaVencimientoCuota}
                          onChange={(e) => setFormFechaVencimientoCuota(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">Condición de Cuota</label>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => setFormCuotaAlDia(true)}
                            className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition ${
                              formCuotaAlDia
                                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>Activo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormCuotaAlDia(false)}
                            className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition ${
                              !formCuotaAlDia
                                ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-400" />
                            <span>Debe</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 4: ANTECEDENTES DE SALUD, BIOMECÁNICA & NOTAS */}
              {(activeModalSection === 'todos' || activeModalSection === 'salud') && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-950/60 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                    <h4 className="font-bold text-amber-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <HeartPulse className="w-4 h-4" />
                      <span>4. Antecedentes de Salud, Dolencias & Criterio de Carga</span>
                    </h4>
                    <span className="text-[10px] text-amber-300 font-mono">Demanda vs Capacidad</span>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Antecedentes Médicos Relevantes / Alergias / Medicación</label>
                    <textarea
                      rows={2}
                      value={formAntecedentesMedicos}
                      onChange={(e) => setFormAntecedentesMedicos(e.target.value)}
                      placeholder="Ej. Hipertensión controlada, asma inducida por esfuerzo, alérgico a analgésicos..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Lesión, Cirugía o Precaución Biomecánica</label>
                    <input
                      type="text"
                      value={formAlerta}
                      onChange={(e) => setFormAlerta(e.target.value)}
                      placeholder="Ej. Discopatía L4-L5, evitar carga vertical axial pesada"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Zona Anatómica de Molestia</label>
                      <select
                        value={formZonaDolor}
                        onChange={(e) => setFormZonaDolor(e.target.value as ZonaDolor)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                      >
                        <option value="">Sin Zona Afectada</option>
                        <option value="lumbar">Zona Lumbar</option>
                        <option value="cervical">Zona Cervical</option>
                        <option value="dorsal">Zona Dorsal</option>
                        <option value="rodilla_der">Rodilla Derecha</option>
                        <option value="rodilla_izq">Rodilla Izquierda</option>
                        <option value="hombro_der">Hombro Derecho</option>
                        <option value="hombro_izq">Hombro Izquierdo</option>
                        <option value="cadera_der">Cadera Derecha</option>
                        <option value="cadera_izq">Cadera Izquierda</option>
                        <option value="tobillo_der">Tobillo Derecho</option>
                        <option value="tobillo_izq">Tobillo Izquierdo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Conducta Inicial</label>
                      <select
                        value={formDecision}
                        onChange={(e) => setFormDecision(e.target.value as DecisionTerapeutica)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs font-semibold"
                      >
                        <option value="ENTRENAR">ENTRENAR (Carga Regular Progresiva)</option>
                        <option value="DERIVAR">DERIVAR (Bandera Roja Médica)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-semibold text-slate-200">
                        Nivel de Dolor Inicial (Escala EVA: {formDolorEva} / 10)
                      </label>
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {formDolorEva === 0 ? 'Sin Dolor' : formDolorEva <= 3 ? 'Leve (1-3)' : formDolorEva <= 6 ? 'Moderado (4-6)' : 'Severo (7-10)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={formDolorEva}
                      onChange={(e) => setFormDolorEva(parseInt(e.target.value, 10))}
                      className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Notas de Admisión del Entrenador</label>
                    <textarea
                      rows={2}
                      value={formNotasAdmision}
                      onChange={(e) => setFormNotasAdmision(e.target.value)}
                      placeholder="Observaciones de postura, experiencia previa en levantamiento, preferencias personales..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Bottom Sticky Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 active:scale-95 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{showEditModal ? 'Guardar Cambios' : 'Registrar y Guardar Alumno'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Grupo/Turno */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 sm:p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                <span>Nuevo Grupo de Sala</span>
              </h3>
              <button
                onClick={() => setShowGroupModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Nombre del Grupo *</label>
                <input
                  type="text"
                  required
                  value={grpNombre}
                  onChange={(e) => setGrpNombre(e.target.value)}
                  placeholder="Ej. Grupo Tarde: Fuerza & Salud"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Horario</label>
                <input
                  type="text"
                  value={grpHorario}
                  onChange={(e) => setGrpHorario(e.target.value)}
                  placeholder="Ej. 17:00 - 19:00 hs"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Descripción / Enfoque</label>
                <textarea
                  rows={2}
                  value={grpDesc}
                  onChange={(e) => setGrpDesc(e.target.value)}
                  placeholder="Ej. Alumnos con foco en hipertrofia y descompresión articular."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                >
                  Crear Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN: ELIMINAR ALUMNO */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white">¿Eliminar alumno?</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Alumno a eliminar:</span>
              <p className="font-bold text-white text-sm">{studentToDelete.name}</p>
              <p className="text-[11px] text-slate-400 pt-1">
                Se eliminarán permanentemente su ficha personal, rutinas, bloques de ejercicios e historial de asistencia en sala.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Alumno</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};