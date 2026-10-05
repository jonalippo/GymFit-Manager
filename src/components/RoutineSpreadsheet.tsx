import React, { useState, useEffect } from 'react';
import { Alumno, Rutina, BloqueRutina, EjercicioRutina, EvaluacionClinica, LibraryExercise } from '../types';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { exportRoutineToPDF, shareRoutineViaWhatsApp } from '../utils/exportUtils';
import {
  FileDown,
  Share2,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Calendar,
  Check,
  X,
  Sparkles,
  ArrowLeft,
  Edit2,
  Settings,
  Table as TableIcon,
  LayoutGrid,
  AlertTriangle
} from 'lucide-react';

interface RoutineSpreadsheetProps {
  alumno: Alumno;
  rutinas: Rutina[];
  evaluacion?: EvaluacionClinica | null;
  allAlumnos?: Alumno[];
  onSaveRoutine: (rutina: Rutina) => Promise<void>;
  onCreateNewRoutine: (alumnoId: string) => Promise<Rutina | void>;
  onDeleteRoutine?: (rutinaId: string) => Promise<void>;
  onBackToAlumnos: () => void;
  onSwitchStudent?: (alumno: Alumno) => void;
  onOpenEvaluation?: () => void;
}

export const RoutineSpreadsheet: React.FC<RoutineSpreadsheetProps> = ({
  alumno,
  rutinas,
  evaluacion,
  allAlumnos = [],
  onSaveRoutine,
  onCreateNewRoutine,
  onDeleteRoutine,
  onBackToAlumnos,
  onSwitchStudent,
}) => {
  // Active Routine
  const [activeRoutineId, setActiveRoutineId] = useState<string>(
    rutinas.find((r) => r.activa)?.id || rutinas[0]?.id || ''
  );

  const currentRoutine = rutinas.find((r) => r.id === activeRoutineId) || rutinas[0];
  const [activeBlockId, setActiveBlockId] = useState<string>(
    currentRoutine?.bloques[0]?.id || ''
  );

  // View mode for desktop (cards vs table)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Exercise Delete Confirmation Modal
  const [exerciseToDelete, setExerciseToDelete] = useState<{ rowIdx: number; name: string } | null>(null);

  // Routine Delete Confirmation Modal
  const [showDeleteRoutineModal, setShowDeleteRoutineModal] = useState(false);

  // Biomechanical library picker
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState('');
  const [targetRowForLibrary, setTargetRowForLibrary] = useState<number | null>(null);

  // Routine Meta Editor Modal
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [editRoutineName, setEditRoutineName] = useState('');
  const [editFechaInicio, setEditFechaInicio] = useState('');
  const [editFechaCambio, setEditFechaCambio] = useState('');
  const [editNotasGenerales, setEditNotasGenerales] = useState('');

  // Inline Routine Name Editor
  const [isEditingRoutineName, setIsEditingRoutineName] = useState(false);
  const [inlineRoutineName, setInlineRoutineName] = useState('');

  // Day Rename state
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockNameInput, setBlockNameInput] = useState('');

  // Local state
  const [localRoutine, setLocalRoutine] = useState<Rutina | null>(currentRoutine || null);

  useEffect(() => {
    if (currentRoutine) {
      setLocalRoutine(currentRoutine);
      setEditRoutineName(currentRoutine.nombre_rutina);
      setInlineRoutineName(currentRoutine.nombre_rutina);
      setEditFechaInicio(currentRoutine.fecha_inicio);
      setEditFechaCambio(currentRoutine.fecha_cambio);
      setEditNotasGenerales(currentRoutine.notas_generales || '');
      if (!currentRoutine.bloques.some((b) => b.id === activeBlockId)) {
        setActiveBlockId(currentRoutine.bloques[0]?.id || '');
      }
    }
  }, [activeRoutineId, currentRoutine]);

  const activeBlock = localRoutine?.bloques.find((b) => b.id === activeBlockId) || localRoutine?.bloques[0];
  const activeBlockIndex = localRoutine?.bloques.findIndex((b) => b.id === activeBlock?.id) ?? 0;

  const handleSaveInlineRoutineName = () => {
    if (!localRoutine || !inlineRoutineName.trim()) {
      setIsEditingRoutineName(false);
      return;
    }
    const updated: Rutina = {
      ...localRoutine,
      nombre_rutina: inlineRoutineName.trim(),
      updated_at: new Date().toISOString()
    };
    setLocalRoutine(updated);
    onSaveRoutine(updated);
    setIsEditingRoutineName(false);
  };

  const handleCreateNewRoutineInstant = async () => {
    const created = await onCreateNewRoutine(alumno.id);
    if (created) {
      setActiveRoutineId(created.id);
      setActiveBlockId(created.bloques[0]?.id || '');
      setLocalRoutine(created);
    }
  };

  const handleUpdateExercise = (rowIdx: number, field: keyof EjercicioRutina, value: string) => {
    if (!localRoutine || !activeBlock) return;

    const updatedExercises = [...activeBlock.ejercicios];
    updatedExercises[rowIdx] = {
      ...updatedExercises[rowIdx],
      [field]: value
    };

    const updatedBlocks = localRoutine.bloques.map((b) =>
      b.id === activeBlock.id ? { ...b, ejercicios: updatedExercises } : b
    );

    const updatedRoutine: Rutina = {
      ...localRoutine,
      bloques: updatedBlocks,
      updated_at: new Date().toISOString()
    };

    setLocalRoutine(updatedRoutine);
    onSaveRoutine(updatedRoutine);
  };

  const handleInsertRow = (atIndex: number) => {
    if (!localRoutine || !activeBlock) return;
    const newEx: EjercicioRutina = {
      id: 'ej-' + Date.now() + Math.random().toString(36).substr(2, 4),
      bloque_id: activeBlock.id,
      orden: atIndex + 1,
      ejercicio: 'Nuevo Ejercicio',
      series: '3',
      repeticiones: '10',
      carga: '10 kg',
      pausa: '60s',
      observaciones_dosificacion: 'Mantener control motor sin compensaciones.'
    };

    const newExs = [...activeBlock.ejercicios];
    newExs.splice(atIndex, 0, newEx);
    newExs.forEach((e, idx) => (e.orden = idx + 1));

    const updatedBlocks = localRoutine.bloques.map((b) =>
      b.id === activeBlock.id ? { ...b, ejercicios: newExs } : b
    );

    const updatedRoutine = { ...localRoutine, bloques: updatedBlocks, updated_at: new Date().toISOString() };
    setLocalRoutine(updatedRoutine);
    onSaveRoutine(updatedRoutine);
  };

  const handleDeleteRow = (rowIdx: number) => {
    if (!localRoutine || !activeBlock) return;

    let newExs: EjercicioRutina[];
    if (activeBlock.ejercicios.length <= 1) {
      newExs = [
        {
          id: 'ej-' + Date.now(),
          bloque_id: activeBlock.id,
          orden: 1,
          ejercicio: 'Nuevo Ejercicio',
          series: '3',
          repeticiones: '10',
          carga: '',
          pausa: '60s',
          observaciones_dosificacion: ''
        }
      ];
    } else {
      newExs = activeBlock.ejercicios.filter((_, idx) => idx !== rowIdx);
      newExs.forEach((e, idx) => (e.orden = idx + 1));
    }

    const updatedBlocks = localRoutine.bloques.map((b) =>
      b.id === activeBlock.id ? { ...b, ejercicios: newExs } : b
    );

    const updatedRoutine = { ...localRoutine, bloques: updatedBlocks, updated_at: new Date().toISOString() };
    setLocalRoutine(updatedRoutine);
    onSaveRoutine(updatedRoutine);
  };

  const confirmDeleteExercise = () => {
    if (exerciseToDelete !== null) {
      handleDeleteRow(exerciseToDelete.rowIdx);
      setExerciseToDelete(null);
    }
  };

  const handleDuplicateRow = (rowIdx: number) => {
    if (!localRoutine || !activeBlock) return;
    const source = activeBlock.ejercicios[rowIdx];
    const cloned: EjercicioRutina = {
      ...source,
      id: 'ej-' + Date.now() + Math.random().toString(36).substr(2, 4),
      ejercicio: `${source.ejercicio} (Variante)`
    };

    const newExs = [...activeBlock.ejercicios];
    newExs.splice(rowIdx + 1, 0, cloned);
    newExs.forEach((e, idx) => (e.orden = idx + 1));

    const updatedBlocks = localRoutine.bloques.map((b) =>
      b.id === activeBlock.id ? { ...b, ejercicios: newExs } : b
    );

    const updatedRoutine = { ...localRoutine, bloques: updatedBlocks, updated_at: new Date().toISOString() };
    setLocalRoutine(updatedRoutine);
    onSaveRoutine(updatedRoutine);
  };

  const handleMoveRow = (rowIdx: number, direction: 'up' | 'down') => {
    if (!localRoutine || !activeBlock) return;
    const targetIdx = direction === 'up' ? rowIdx - 1 : rowIdx + 1;
    if (targetIdx < 0 || targetIdx >= activeBlock.ejercicios.length) return;

    const newExs = [...activeBlock.ejercicios];
    const temp = newExs[rowIdx];
    newExs[rowIdx] = newExs[targetIdx];
    newExs[targetIdx] = temp;
    newExs.forEach((e, idx) => (e.orden = idx + 1));

    const updatedBlocks = localRoutine.bloques.map((b) =>
      b.id === activeBlock.id ? { ...b, ejercicios: newExs } : b
    );

    const updatedRoutine = { ...localRoutine, bloques: updatedBlocks, updated_at: new Date().toISOString() };
    setLocalRoutine(updatedRoutine);
    onSaveRoutine(updatedRoutine);
  };

  const handleAddBlock = () => {
    if (!localRoutine) return;
    const blockNum = localRoutine.bloques.length + 1;
    const newBlock: BloqueRutina = {
      id: 'blk-' + Date.now(),
      rutina_id: localRoutine.id,
      nombre_sub_pestana: `Día ${blockNum}: Bloque de Entrenamiento`,
      orden: blockNum,
      ejercicios: [
        {
          id: 'ej-' + Date.now(),
          bloque_id: 'blk-' + Date.now(),
          orden: 1,
          ejercicio: 'Sentadilla Goblet con Talones Elevados',
          series: '3',
          repeticiones: '10-12',
          carga: '12 kg',
          pausa: '75s',
          observaciones_dosificacion: 'Mantener tronco vertical y control excéntrico.'
        }
      ]
    };

    const updatedRoutine = {
      ...localRoutine,
      bloques: [...localRoutine.bloques, newBlock],
      updated_at: new Date().toISOString()
    };
    setLocalRoutine(updatedRoutine);
    setActiveBlockId(newBlock.id);
    onSaveRoutine(updatedRoutine);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!localRoutine || localRoutine.bloques.length <= 1) return;
    const updatedBlocks = localRoutine.bloques.filter((b) => b.id !== blockId);
    updatedBlocks.forEach((b, idx) => (b.orden = idx + 1));
    const nextActive = updatedBlocks[0]?.id || '';
    const updatedRoutine = {
      ...localRoutine,
      bloques: updatedBlocks,
      updated_at: new Date().toISOString()
    };
    setLocalRoutine(updatedRoutine);
    setActiveBlockId(nextActive);
    onSaveRoutine(updatedRoutine);
  };

  const handleSaveBlockName = (blockId: string) => {
    if (!localRoutine || !blockNameInput.trim()) {
      setEditingBlockId(null);
      return;
    }
    const updatedBlocks = localRoutine.bloques.map((b) =>
      b.id === blockId ? { ...b, nombre_sub_pestana: blockNameInput.trim() } : b
    );
    const updatedRoutine = {
      ...localRoutine,
      bloques: updatedBlocks,
      updated_at: new Date().toISOString()
    };
    setLocalRoutine(updatedRoutine);
    onSaveRoutine(updatedRoutine);
    setEditingBlockId(null);
  };

  const handleSaveRoutineMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localRoutine) return;
    const updatedRoutine: Rutina = {
      ...localRoutine,
      nombre_rutina: editRoutineName.trim() || localRoutine.nombre_rutina,
      fecha_inicio: editFechaInicio || localRoutine.fecha_inicio,
      fecha_cambio: editFechaCambio || localRoutine.fecha_cambio,
      notas_generales: editNotasGenerales.trim() || undefined,
      updated_at: new Date().toISOString()
    };
    setLocalRoutine(updatedRoutine);
    onSaveRoutine(updatedRoutine);
    setShowMetaModal(false);
  };

  const handleSelectExerciseFromLibrary = (libEx: LibraryExercise) => {
    if (targetRowForLibrary === null || !localRoutine || !activeBlock) return;

    const updatedExercises = [...activeBlock.ejercicios];
    updatedExercises[targetRowForLibrary] = {
      ...updatedExercises[targetRowForLibrary],
      ejercicio: libEx.nombre,
      observaciones_dosificacion: libEx.ajuste_biomecanico_sugerido
    };

    const updatedBlocks = localRoutine.bloques.map((b) =>
      b.id === activeBlock.id ? { ...b, ejercicios: updatedExercises } : b
    );

    const updatedRoutine = { ...localRoutine, bloques: updatedBlocks, updated_at: new Date().toISOString() };
    setLocalRoutine(updatedRoutine);
    onSaveRoutine(updatedRoutine);
    setShowLibrary(false);
    setTargetRowForLibrary(null);
  };

  if (!localRoutine) {
    return (
      <div className="space-y-4 w-full max-w-full overflow-x-hidden">
        <button
          onClick={onBackToAlumnos}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Volver a Alumnos</span>
        </button>
        <div className="text-center py-16 p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-base text-slate-300 font-semibold">No hay rutinas creadas para este alumno</p>
          <button
            onClick={handleCreateNewRoutineInstant}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
          >
            Crear Primera Rutina
          </button>
        </div>
      </div>
    );
  }

  const filteredLibrary = EXERCISE_LIBRARY.filter((ex) =>
    ex.nombre.toLowerCase().includes(libraryFilter.toLowerCase()) ||
    ex.patron.toLowerCase().includes(libraryFilter.toLowerCase()) ||
    ex.musculos_principales.toLowerCase().includes(libraryFilter.toLowerCase())
  );

  return (
    <div className="w-full max-w-full space-y-4 pb-28 overflow-x-hidden">
      {/* 0. TOP ACTION BAR WITH PROMINENT BACK BUTTON */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={onBackToAlumnos}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition shrink-0 active:scale-95 group shadow-sm"
            title="Volver a la lista principal de alumnos"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a Alumnos</span>
          </button>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white truncate">
              {alumno.nombre} {alumno.apellido}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono truncate">
              {alumno.telefono}
            </p>
          </div>
        </div>

        {/* Export & Switcher Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => exportRoutineToPDF(alumno, localRoutine, evaluacion)}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => shareRoutineViaWhatsApp(alumno, localRoutine)}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {allAlumnos.length > 1 && (
            <select
              value={alumno.id}
              onChange={(e) => {
                const target = allAlumnos.find((a) => a.id === e.target.value);
                if (target && onSwitchStudent) onSwitchStudent(target);
              }}
              className="hidden lg:block px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-none"
            >
              {allAlumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} {a.apellido}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 1. SELECCIÓN DE RUTINA, NOMBRE EDITABLE EN LÍNEA & CONFIGURACIÓN */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3">
        {/* Routine Name (Editable like days) & Dates Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isEditingRoutineName ? (
              <div className="flex items-center gap-1.5 w-full max-w-md">
                <input
                  type="text"
                  value={inlineRoutineName}
                  onChange={(e) => setInlineRoutineName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveInlineRoutineName();
                    if (e.key === 'Escape') setIsEditingRoutineName(false);
                  }}
                  autoFocus
                  placeholder="Nombre de la rutina..."
                  className="w-full bg-slate-950 text-white font-bold text-sm px-2.5 py-1 rounded-xl border border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveInlineRoutineName}
                  className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingRoutineName(false)}
                  className="p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:text-white shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                  {localRoutine.nombre_rutina}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setInlineRoutineName(localRoutine.nombre_rutina);
                    setIsEditingRoutineName(true);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
                  title="Editar nombre de la rutina directamente"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowMetaModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono hover:border-slate-700 transition"
              title="Configurar ciclo de fechas"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{localRoutine.fecha_inicio} al {localRoutine.fecha_cambio}</span>
              <Settings className="w-3 h-3 text-slate-400" />
            </button>

            {rutinas.length > 1 && (
              <div className="flex items-center gap-1">
                <select
                  value={activeRoutineId}
                  onChange={(e) => setActiveRoutineId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold"
                >
                  {rutinas.map((r, i) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre_rutina || `Rutina ${i + 1}`}
                    </option>
                  ))}
                </select>
                {onDeleteRoutine && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteRoutineModal(true)}
                    className="p-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-400 transition"
                    title="Eliminar esta fase de rutina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateNewRoutineInstant}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="Crear nueva rutina para este alumno"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nueva Rutina</span>
            </button>
          </div>
        </div>

        {/* 2. DÍAS DE RUTINA: DISEÑO MODERNO Y ELEGANTE (CERO SCROLL HORIZONTAL) */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Días / Bloques de Entrenamiento
            </label>
          </div>

          {/* Day Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center gap-2">
            {localRoutine.bloques.map((b, idx) => {
              const isActive = b.id === activeBlockId;
              const count = b.ejercicios.length;

              return (
                <button
                  key={b.id}
                  onClick={() => setActiveBlockId(b.id)}
                  className={`p-2.5 sm:px-4 sm:py-2.5 rounded-xl text-left transition-all active:scale-95 border flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-3 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/80 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-500'}`} />
                    <span className="font-extrabold text-xs sm:text-sm tracking-tight">Día {idx + 1}</span>
                  </div>
                  <span className={`text-[10px] sm:text-[11px] font-mono ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {count} {count === 1 ? 'ejer.' : 'ejer.'}
                  </span>
                </button>
              );
            })}

            <button
              onClick={handleAddBlock}
              className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 hover:bg-slate-900 hover:border-emerald-500/60 text-slate-400 hover:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nuevo Día</span>
            </button>
          </div>

          {/* Active Day Header Banner */}
          {activeBlock && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                {editingBlockId === activeBlock.id ? (
                  <div className="flex items-center gap-1.5 w-full max-w-sm">
                    <input
                      type="text"
                      value={blockNameInput}
                      onChange={(e) => setBlockNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveBlockName(activeBlock.id);
                        if (e.key === 'Escape') setEditingBlockId(null);
                      }}
                      autoFocus
                      className="w-full bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg border border-emerald-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveBlockName(activeBlock.id)}
                      className="p-1.5 bg-emerald-600 text-white rounded-lg"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingBlockId(null)}
                      className="p-1.5 bg-slate-800 text-slate-300 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-400">
                      Día {activeBlockIndex + 1}:
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white truncate">
                      {activeBlock.nombre_sub_pestana.replace(/^Día \d+:\s*/, '')}
                    </span>
                    <button
                      onClick={() => {
                        setEditingBlockId(activeBlock.id);
                        setBlockNameInput(activeBlock.nombre_sub_pestana);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white transition"
                      title="Renombrar este día"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {localRoutine.bloques.length > 1 && (
                      <button
                        onClick={() => handleDeleteBlock(activeBlock.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                        title="Eliminar este día"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Actions for active day */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => {
                    setTargetRowForLibrary(0);
                    setShowLibrary(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Banco de Ejercicios</span>
                </button>

                {/* View switcher for desktop */}
                <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${viewMode === 'table' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400'}`}
                    title="Vista planilla horizontal fluida"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Planilla</span>
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${viewMode === 'cards' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400'}`}
                    title="Vista tarjetas táctiles"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Tarjetas</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. LISTA DE EJERCICIOS (MOBILE: TARJETAS GRANDES | DESKTOP: PLANILLA FLUIDA SIN SCROLL HORIZONTAL) */}
      {activeBlock && (
        <div className="space-y-3.5 w-full max-w-full overflow-x-hidden">
          {/* MOBILE VIEW (< md): TARJETAS TÁCTILES GRANDES */}
          <div className="block md:hidden space-y-3.5">
            {activeBlock.ejercicios.map((ej, rowIdx) => (
              <div
                key={ej.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3"
              >
                {/* Header: Número de Ejercicio, Nombre en Grande y Acciones */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-emerald-400 font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
                      #{ej.orden || rowIdx + 1}
                    </span>
                      <div className="min-w-0 flex-1">
                        <textarea
                          rows={ej.ejercicio.length > 20 ? 2 : 1}
                          value={ej.ejercicio}
                          onChange={(e) => handleUpdateExercise(rowIdx, 'ejercicio', e.target.value)}
                          placeholder="Nombre del ejercicio..."
                          className="w-full bg-slate-950/80 font-bold text-white text-sm sm:text-base px-2.5 py-1.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none resize-none overflow-hidden leading-snug break-words min-h-[42px]"
                        />
                      </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetRowForLibrary(rowIdx);
                        setShowLibrary(true);
                      }}
                      className="p-1.5 rounded-lg text-emerald-400 bg-slate-950 border border-slate-800 hover:bg-slate-800"
                      title="Sustituir desde banco biomecánico"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateRow(rowIdx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-950 border border-slate-800"
                      title="Duplicar"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExerciseToDelete({ rowIdx, name: ej.ejercicio || `Ejercicio #${rowIdx + 1}` })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-950 border border-slate-800 active:scale-95 transition"
                      title="Eliminar ejercicio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 4 Cajas Grandes Táctiles: Series, Reps, Carga (Kg), Pausa */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-0.5">Series</span>
                    <input
                      type="text"
                      value={ej.series}
                      onChange={(e) => handleUpdateExercise(rowIdx, 'series', e.target.value)}
                      className="w-full bg-transparent text-center font-extrabold text-white text-base sm:text-lg font-mono focus:outline-none"
                    />
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-0.5">Reps</span>
                    <input
                      type="text"
                      value={ej.repeticiones}
                      onChange={(e) => handleUpdateExercise(rowIdx, 'repeticiones', e.target.value)}
                      className="w-full bg-transparent text-center font-extrabold text-white text-base sm:text-lg font-mono focus:outline-none"
                    />
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="block text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider mb-0.5">Carga (Kg)</span>
                    <input
                      type="text"
                      value={ej.carga || ''}
                      placeholder="-"
                      onChange={(e) => handleUpdateExercise(rowIdx, 'carga', e.target.value)}
                      className="w-full bg-transparent text-center font-extrabold text-emerald-400 text-base sm:text-lg font-mono focus:outline-none"
                    />
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-0.5">Pausa</span>
                    <input
                      type="text"
                      value={ej.pausa}
                      onChange={(e) => handleUpdateExercise(rowIdx, 'pausa', e.target.value)}
                      className="w-full bg-transparent text-center font-extrabold text-slate-200 text-base sm:text-lg font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Observaciones */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] text-slate-400 font-semibold">
                    Observaciones:
                  </label>
                  <input
                    type="text"
                    value={ej.observaciones_dosificacion}
                    onChange={(e) => handleUpdateExercise(rowIdx, 'observaciones_dosificacion', e.target.value)}
                    placeholder="Instrucción de ejecución, tempo o criterio..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />

                  {/* Move Up/Down Controls for Mobile */}
                  <div className="flex items-center justify-end gap-2 pt-1 text-[11px] text-slate-400">
                    <button
                      type="button"
                      disabled={rowIdx === 0}
                      onClick={() => handleMoveRow(rowIdx, 'up')}
                      className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 flex items-center gap-1 hover:text-white"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>Subir</span>
                    </button>
                    <button
                      type="button"
                      disabled={rowIdx === activeBlock.ejercicios.length - 1}
                      onClick={() => handleMoveRow(rowIdx, 'down')}
                      className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 flex items-center gap-1 hover:text-white"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>Bajar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW (>= md): TABLE (CERO HORIZONTAL SCROLL) OR CARDS BASED ON TOGGLE */}
          {viewMode === 'table' ? (
            <div className="hidden md:block rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-sm w-full">
              <table className="w-full table-fixed text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-2 w-9 text-center">#</th>
                    <th className="py-3 px-3 w-[30%]">Ejercicio</th>
                    <th className="py-3 px-2 w-16 text-center">Series</th>
                    <th className="py-3 px-2 w-20 text-center">Reps</th>
                    <th className="py-3 px-2 w-24 text-center">Carga (Kg)</th>
                    <th className="py-3 px-2 w-20 text-center">Pausa</th>
                    <th className="py-3 px-3 w-[28%]">Observaciones</th>
                    <th className="py-3 px-2 w-20 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {activeBlock.ejercicios.map((ej, rowIdx) => (
                    <tr key={ej.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 px-2 text-center text-slate-500 font-bold text-xs">
                        {ej.orden || rowIdx + 1}
                      </td>

                      <td className="py-1 px-2.5">
                        <div className="flex items-center gap-1.5">
                          <textarea
                            rows={ej.ejercicio.length > 20 ? 2 : 1}
                            value={ej.ejercicio}
                            onChange={(e) => handleUpdateExercise(rowIdx, 'ejercicio', e.target.value)}
                            placeholder="Nombre del ejercicio..."
                            className="w-full px-2 py-1.5 rounded-lg bg-transparent hover:bg-slate-900 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white font-sans font-bold text-xs sm:text-sm resize-none overflow-hidden leading-snug break-words min-h-[38px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setTargetRowForLibrary(rowIdx);
                              setShowLibrary(true);
                            }}
                            title="Seleccionar del banco biomecánico"
                            className="p-1 rounded text-slate-500 hover:text-emerald-400 shrink-0"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-1 px-1">
                        <input
                          type="text"
                          value={ej.series}
                          onChange={(e) => handleUpdateExercise(rowIdx, 'series', e.target.value)}
                          className="w-full px-1 py-1 rounded bg-transparent hover:bg-slate-900 text-center text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="py-1 px-1">
                        <input
                          type="text"
                          value={ej.repeticiones}
                          onChange={(e) => handleUpdateExercise(rowIdx, 'repeticiones', e.target.value)}
                          className="w-full px-1 py-1 rounded bg-transparent hover:bg-slate-900 text-center text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="py-1 px-1">
                        <input
                          type="text"
                          value={ej.carga || ''}
                          placeholder="-"
                          onChange={(e) => handleUpdateExercise(rowIdx, 'carga', e.target.value)}
                          className="w-full px-1 py-1 rounded bg-transparent hover:bg-slate-900 text-center text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="py-1 px-1">
                        <input
                          type="text"
                          value={ej.pausa}
                          onChange={(e) => handleUpdateExercise(rowIdx, 'pausa', e.target.value)}
                          className="w-full px-1 py-1 rounded bg-transparent hover:bg-slate-900 text-center text-xs font-mono font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="py-1 px-2.5">
                        <input
                          type="text"
                          value={ej.observaciones_dosificacion}
                          onChange={(e) => handleUpdateExercise(rowIdx, 'observaciones_dosificacion', e.target.value)}
                          placeholder="Observaciones de ejecución o criterio..."
                          className="w-full px-2 py-1.5 rounded-lg bg-transparent hover:bg-slate-900 text-xs text-slate-200 font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="py-1 px-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleInsertRow(rowIdx + 1)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-400"
                            title="Insertar debajo"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateRow(rowIdx)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="Duplicar"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExerciseToDelete({ rowIdx, name: ej.ejercicio || `Ejercicio #${rowIdx + 1}` })}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
                            title="Eliminar ejercicio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Desktop Grid Cards */
            <div className="hidden md:grid md:grid-cols-2 gap-3.5">
              {activeBlock.ejercicios.map((ej, rowIdx) => (
                <div key={ej.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-7 h-7 rounded-xl bg-slate-800 text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                        #{ej.orden || rowIdx + 1}
                      </span>
                      <textarea
                        rows={ej.ejercicio.length > 20 ? 2 : 1}
                        value={ej.ejercicio}
                        onChange={(e) => handleUpdateExercise(rowIdx, 'ejercicio', e.target.value)}
                        placeholder="Nombre del ejercicio..."
                        className="w-full bg-transparent font-bold text-white text-sm focus:outline-none resize-none overflow-hidden leading-snug break-words min-h-[40px]"
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setTargetRowForLibrary(rowIdx); setShowLibrary(true); }} className="p-1 text-emerald-400">
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDuplicateRow(rowIdx)} className="p-1 text-slate-400 hover:text-white">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExerciseToDelete({ rowIdx, name: ej.ejercicio || `Ejercicio #${rowIdx + 1}` })}
                        className="p-1 text-slate-400 hover:text-rose-400 transition"
                        title="Eliminar ejercicio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-2 rounded-xl bg-slate-950 text-center border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Series</span>
                      <input
                        type="text"
                        value={ej.series}
                        onChange={(e) => handleUpdateExercise(rowIdx, 'series', e.target.value)}
                        className="w-full bg-transparent text-center font-bold text-white text-sm font-mono focus:outline-none"
                      />
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 text-center border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Reps</span>
                      <input
                        type="text"
                        value={ej.repeticiones}
                        onChange={(e) => handleUpdateExercise(rowIdx, 'repeticiones', e.target.value)}
                        className="w-full bg-transparent text-center font-bold text-white text-sm font-mono focus:outline-none"
                      />
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 text-center border border-slate-800/80">
                      <span className="text-[10px] text-emerald-400 block font-semibold uppercase">Carga (Kg)</span>
                      <input
                        type="text"
                        value={ej.carga || ''}
                        placeholder="-"
                        onChange={(e) => handleUpdateExercise(rowIdx, 'carga', e.target.value)}
                        className="w-full bg-transparent text-center font-bold text-emerald-400 text-sm font-mono focus:outline-none"
                      />
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 text-center border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Pausa</span>
                      <input
                        type="text"
                        value={ej.pausa}
                        onChange={(e) => handleUpdateExercise(rowIdx, 'pausa', e.target.value)}
                        className="w-full bg-transparent text-center font-bold text-slate-200 text-sm font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={ej.observaciones_dosificacion}
                    onChange={(e) => handleUpdateExercise(rowIdx, 'observaciones_dosificacion', e.target.value)}
                    placeholder="Observaciones..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Add Exercise Button below list */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleInsertRow(activeBlock.ejercicios.length)}
              className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Agregar Ejercicio al Día {activeBlockIndex + 1}</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAR FECHAS DE RUTINA */}
      {showMetaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Configurar Ciclo de Rutina</span>
              </h3>
              <button
                onClick={() => setShowMetaModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoutineMeta} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre de la Rutina / Fase</label>
                <input
                  type="text"
                  required
                  value={editRoutineName}
                  onChange={(e) => setEditRoutineName(e.target.value)}
                  placeholder="Ej. Rutina 1: Adaptación Anatómica"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Fecha de Inicio</label>
                  <input
                    type="date"
                    required
                    value={editFechaInicio}
                    onChange={(e) => setEditFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Fecha de Cambio</label>
                  <input
                    type="date"
                    required
                    value={editFechaCambio}
                    onChange={(e) => setEditFechaCambio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Pautas Generales de la Rutina</label>
                <textarea
                  rows={3}
                  value={editNotasGenerales}
                  onChange={(e) => setEditNotasGenerales(e.target.value)}
                  placeholder="Ej. Calentar 8 min movilidad articular. Cuidar pausas y técnica."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMetaModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                >
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BANCO DE EJERCICIOS */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Banco de Ejercicios
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selecciona un ejercicio para transferirlo a la rutina.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLibrary(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Search Input */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={libraryFilter}
                  onChange={(e) => setLibraryFilter(e.target.value)}
                  placeholder="Filtrar por nombre, patrón (sentadilla, empuje) o músculo..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Exercises List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredLibrary.map((libEx, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectExerciseFromLibrary(libEx)}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/80 hover:bg-slate-900 cursor-pointer transition flex flex-col gap-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm group-hover:text-emerald-400 transition-colors">
                      {libEx.nombre}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {libEx.patron}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    <strong className="text-slate-300">Foco:</strong> {libEx.musculos_principales}
                  </p>

                  <p className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/40">
                    💡 {libEx.ajuste_biomecanico_sugerido}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end shrink-0">
              <button
                onClick={() => setShowLibrary(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN: ELIMINAR EJERCICIO */}
      {exerciseToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white">¿Eliminar este ejercicio?</h3>
                <p className="text-xs text-slate-400">Se quitará de la rutina actual del alumno.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <span className="text-slate-500 block text-[10px] uppercase font-mono mb-0.5">Ejercicio seleccionado:</span>
              <p className="font-bold text-white break-words">{exerciseToDelete.name}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setExerciseToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteExercise}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN: ELIMINAR RUTINA */}
      {showDeleteRoutineModal && localRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white">¿Eliminar esta rutina?</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer y borrará todos sus bloques de ejercicios.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <span className="text-slate-500 block text-[10px] uppercase font-mono mb-0.5">Rutina a eliminar:</span>
              <p className="font-bold text-white break-words">{localRoutine.nombre_rutina}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteRoutineModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onDeleteRoutine) {
                    await onDeleteRoutine(localRoutine.id);
                  }
                  setShowDeleteRoutineModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Rutina</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
