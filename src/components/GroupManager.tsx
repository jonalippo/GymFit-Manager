import React, { useState } from 'react';
import { Alumno, Grupo } from '../types';
import {
  FolderPlus,
  Edit2,
  Trash2,
  Users,
  Clock,
  ClipboardList,
  UserPlus,
  ArrowRight,
  Search,
  Check,
  X,
  Phone,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';

interface GroupManagerProps {
  grupos: Grupo[];
  alumnos: Alumno[];
  onAddGrupo: (newGrupo: Omit<Grupo, 'id'>) => Promise<void>;
  onEditGrupo: (updatedGrupo: Grupo) => Promise<void>;
  onDeleteGrupo: (grupoId: string) => Promise<void>;
  onReassignStudentGroup: (alumnoId: string, newGrupoId: string) => Promise<void>;
  onSelectStudent: (alumno: Alumno, view: 'rutina' | 'evaluacion') => void;
  onBackToAlumnos: () => void;
}

export const GroupManager: React.FC<GroupManagerProps> = ({
  grupos,
  alumnos,
  onAddGrupo,
  onEditGrupo,
  onDeleteGrupo,
  onReassignStudentGroup,
  onSelectStudent,
  onBackToAlumnos,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(grupos[0]?.id || null);

  // Group Create/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formHorario, setFormHorario] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');

  // Delete Group Modal State
  const [groupToDelete, setGroupToDelete] = useState<{ id: string; name: string; count: number } | null>(null);

  // Move Student Modal State
  const [studentToMove, setStudentToMove] = useState<Alumno | null>(null);
  const [targetGrupoId, setTargetGrupoId] = useState<string>('');

  const openCreateModal = () => {
    setEditingGrupo(null);
    setFormNombre('');
    setFormHorario('');
    setFormDescripcion('');
    setShowModal(true);
  };

  const openEditModal = (grupo: Grupo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingGrupo(grupo);
    setFormNombre(grupo.nombre_grupo);
    setFormHorario(grupo.horario);
    setFormDescripcion(grupo.descripcion || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) return;

    if (editingGrupo) {
      await onEditGrupo({
        ...editingGrupo,
        nombre_grupo: formNombre.trim(),
        horario: formHorario.trim() || 'Horario Flexible',
        descripcion: formDescripcion.trim() || undefined,
      });
    } else {
      await onAddGrupo({
        profesor_id: 'prof-1',
        organizacion_id: 'org-1',
        nombre_grupo: formNombre.trim(),
        horario: formHorario.trim() || 'Horario Flexible',
        descripcion: formDescripcion.trim() || undefined,
      });
    }

    setShowModal(false);
    setEditingGrupo(null);
  };

  const handleDelete = (grupo: Grupo, e: React.MouseEvent) => {
    e.stopPropagation();
    const studentsInGroup = alumnos.filter((a) => a.grupo_id === grupo.id);
    setGroupToDelete({
      id: grupo.id,
      name: grupo.nombre_grupo,
      count: studentsInGroup.length
    });
  };

  const handleSaveStudentMove = async () => {
    if (!studentToMove) return;
    await onReassignStudentGroup(studentToMove.id, targetGrupoId);
    setStudentToMove(null);
  };

  const filteredGrupos = grupos.filter((g) =>
    g.nombre_grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.horario && g.horario.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full max-w-full space-y-5 pb-24 overflow-x-hidden">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToAlumnos}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition shrink-0 active:scale-95 group shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a Alumnos</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Gestión de Grupos de Entrenamiento</span>
            </h2>
            <p className="text-xs text-slate-400">
              Edita nombres, horarios y consulta los alumnos asignados a cada grupo.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Nuevo Grupo</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Grupos</p>
          <p className="text-2xl font-bold text-white font-mono mt-0.5">{grupos.length}</p>
          <span className="text-[10px] text-emerald-400 font-mono">Grupos activos</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Alumnos Asignados</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
            {alumnos.filter((a) => a.grupo_id).length} / {alumnos.length}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Con grupo asignado</span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Promedio por Grupo</p>
          <p className="text-2xl font-bold text-blue-400 font-mono mt-0.5">
            {grupos.length > 0 ? (alumnos.length / grupos.length).toFixed(1) : 0}
          </p>
          <span className="text-[10px] text-blue-300 font-mono">Alumnos / turno</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar turno por nombre u horario..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      {/* Group Cards Accordion */}
      <div className="space-y-4">
        {filteredGrupos.map((grupo) => {
          const groupStudents = alumnos.filter((a) => a.grupo_id === grupo.id);
          const isExpanded = expandedGroupId === grupo.id;

          return (
            <div
              key={grupo.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-sm transition hover:border-slate-700"
            >
              {/* Group Header Row */}
              <div
                onClick={() => setExpandedGroupId(isExpanded ? null : grupo.id)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-slate-950/40 select-none"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white truncate">
                        {grupo.nombre_grupo}
                      </h3>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-mono text-[10px] font-bold shrink-0">
                        {groupStudents.length} {groupStudents.length === 1 ? 'alumno' : 'alumnos'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1 font-mono text-emerald-300">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {grupo.horario}
                      </span>
                      {grupo.descripcion && (
                        <span className="truncate max-w-xs text-slate-500 hidden sm:inline">
                          • {grupo.descripcion}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions & Expand Chevron */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => openEditModal(grupo, e)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                    title="Editar nombre y horario del grupo"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={(e) => handleDelete(grupo, e)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 hover:border-rose-800"
                    title="Eliminar grupo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setExpandedGroupId(isExpanded ? null : grupo.id)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Group Students List (Accordion Body) */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Alumnos que integran este turno ({groupStudents.length})
                    </span>
                  </div>

                  {groupStudents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {groupStudents.map((alumno) => (
                        <div
                          key={alumno.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-2 shadow-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {alumno.nombre.charAt(0)}{alumno.apellido.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-white text-xs truncate">
                                {alumno.nombre} {alumno.apellido}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono truncate">
                                {alumno.telefono}
                              </p>
                            </div>
                          </div>

                          {alumno.alerta_lesion_activa && (
                            <p className="text-[10px] text-amber-300 bg-amber-950/40 p-1.5 rounded-lg border border-amber-900/40 truncate">
                              ⚠️ {alumno.alerta_lesion_activa}
                            </p>
                          )}

                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800 text-xs">
                            <button
                              onClick={() => onSelectStudent(alumno, 'rutina')}
                              className="flex-1 py-1 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition"
                            >
                              <ClipboardList className="w-3 h-3" />
                              <span>Ver Rutina</span>
                            </button>

                            <button
                              onClick={() => {
                                setStudentToMove(alumno);
                                setTargetGrupoId(grupo.id);
                              }}
                              className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                              title="Cambiar a otro turno"
                            >
                              Mover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center border border-dashed border-slate-800 rounded-xl p-4">
                      <p className="text-xs text-slate-400 font-medium">No hay alumnos asignados a este turno todavía.</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Puedes asignar alumnos editando su ficha en el listado de alumnos.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredGrupos.length === 0 && (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl p-6">
            <p className="text-base text-slate-300 font-semibold">No se encontraron turnos con ese criterio</p>
            <button
              onClick={openCreateModal}
              className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              Crear Nuevo Turno
            </button>
          </div>
        )}
      </div>

      {/* MODAL: CREAR / EDITAR GRUPO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 sm:p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-400" />
                <span>{editingGrupo ? 'Editar Nombre y Horario del Turno' : 'Crear Nuevo Turno / Grupo'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre del Grupo / Turno *</label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. Turno Mañana: Fuerza & Salud"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Horario de Sala *</label>
                <input
                  type="text"
                  required
                  value={formHorario}
                  onChange={(e) => setFormHorario(e.target.value)}
                  placeholder="Ej. Lunes, Miércoles y Viernes 08:00 - 09:30 hs"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Descripción / Enfoque</label>
                <textarea
                  rows={3}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Ej. Grupo orientado a entrenamiento de fuerza progresiva, adultos mayores o readaptación articular."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md transition"
                >
                  {editingGrupo ? 'Guardar Cambios' : 'Crear Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVER ALUMNO A OTRO GRUPO */}
      {studentToMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                Reasignar Turno a {studentToMove.nombre} {studentToMove.apellido}
              </h3>
              <button
                onClick={() => setStudentToMove(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-slate-300 font-semibold">Seleccionar Nuevo Turno:</label>
              <select
                value={targetGrupoId}
                onChange={(e) => setTargetGrupoId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre_grupo} ({g.horario})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
              <button
                onClick={() => setStudentToMove(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStudentMove}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm"
              >
                Confirmar Cambio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMACIÓN DE ELIMINACIÓN DE GRUPO */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-rose-800/80 p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar Grupo?</h3>
                <p className="text-xs text-rose-300">Acción permanente</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Estás seguro de eliminar el grupo <strong className="text-white font-bold">"{groupToDelete.name}"</strong>?
              {groupToDelete.count > 0 && (
                <span className="block mt-1 text-amber-300 font-medium">
                  ⚠️ Contiene {groupToDelete.count} alumno(s) asignado(s) que quedarán sin grupo.
                </span>
              )}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = groupToDelete.id;
                  setGroupToDelete(null);
                  await onDeleteGrupo(id);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-950/50 transition active:scale-95"
              >
                Sí, Eliminar Grupo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
