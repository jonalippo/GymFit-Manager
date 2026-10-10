import React, { useState, useEffect } from 'react';
import { Alumno, Rutina, BloqueRutina, EjercicioRutina, EvaluacionClinica, LibraryExercise } from '../types';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { exportRoutineToPDF, shareRoutineViaWhatsApp } from '../utils/exportUtils';
import { sortRoutineBloquesAndEjercicios } from '../db/indexedDb';
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
  AlertTriangle,
  Minus
} from 'lucide-react';

interface RoutineSpreadsheetProps {
  alumno: Alumno;
  rutinas: Rutina[];
  evaluacion?: EvaluacionClinica | null;
  allAlumnos?: Alumno[];
  savedActiveBlockId?: string;
  onActiveBlockChange?: (blockId: string) => void;
  savedActiveRoutineId?: string;
  onActiveRoutineChange?: (routineId: string) => void;
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
  savedActiveBlockId,
  onActiveBlockChange,
  savedActiveRoutineId,
  onActiveRoutineChange,
  onSaveRoutine,
  onCreateNewRoutine,
  onDeleteRoutine,
  onBackToAlumnos,
  onSwitchStudent,
}) => {
  // Filtrar rutinas pertenecientes a este alumno
  const studentRoutines = rutinas.filter((r) => String(r.alumno_id) === String(alumno.id));

  // Rutina activa inicial
  const [activeRoutineId, setActiveRoutineId] = useState<string>(() => {
    if (savedActiveRoutineId && studentRoutines.some((r) => r.id === savedActiveRoutineId)) {
      return savedActiveRoutineId;
    }
    try {
      const saved = localStorage.getItem(`fitpro_active_routine_${alumno.id}`);
      if (saved && studentRoutines.some((r) => r.id === saved)) {
        return saved;
      }
    } catch {}
    return studentRoutines.find((r) => r.activa)?.id || studentRoutines[0]?.id || '';
  });

  const initialTarget =
    studentRoutines.find((r) => r.id === activeRoutineId) ||
    studentRoutines.find((r) => r.activa) ||
    studentRoutines[0] ||
    null;

  // Estado local único y autoritativo de la rutina actual
  const [localRoutine, setLocalRoutine] = useState<Rutina | null>(() => {
    return initialTarget ? sortRoutineBloquesAndEjercicios(initialTarget) : null;
  });

  // Bloque / Día activo con persistencia (Día 1, Día 2, Día 3...)
  const [activeBlockId, setActiveBlockId] = useState<string>(() => {
    const candidateRoutine = initialTarget;
    if (savedActiveBlockId && candidateRoutine?.bloques.some((b) => b.id === savedActiveBlockId)) {
      return savedActiveBlockId;
    }
    try {
      const saved = localStorage.getItem(`fitpro_active_block_${alumno.id}`);
      if (saved && candidateRoutine?.bloques.some((b) => b.id === saved)) {
        return saved;
      }
    } catch {}
    return candidateRoutine?.bloques[0]?.id || '';
  });

  // Sincronizar ÚNICAMENTE cuando no hay rutina cargada o cuando cambia el alumno
  useEffect(() => {
    const validRoutines = rutinas.filter((r) => String(r.alumno_id) === String(alumno.id));
    if (validRoutines.length === 0) {
      if (!localRoutine) {
        setActiveRoutineId('');
        setActiveBlockId('');
      }
      return;
    }

    // Solo inicializar si no hay rutina local o si la rutina local pertenece a OTRO alumno
    if (!localRoutine || String(localRoutine.alumno_id) !== String(alumno.id)) {
      const target =
        validRoutines.find((r) => r.id === activeRoutineId) ||
        validRoutines.find((r) => r.activa) ||
        validRoutines[0];

      if (target) {
        const sorted = sortRoutineBloquesAndEjercicios(target);
        setActiveRoutineId(sorted.id);
        setLocalRoutine(sorted);
        setEditRoutineName(sorted.nombre_rutina);
        setInlineRoutineName(sorted.nombre_rutina);
        setEditFechaInicio(sorted.fecha_inicio);
        setEditFechaCambio(sorted.fecha_cambio);
        setEditNotasGenerales(sorted.notas_generales || '');

        const savedBlock = savedActiveBlockId || localStorage.getItem(`fitpro_active_block_${alumno.id}`);
        if (savedBlock && sorted.bloques.some((b) => b.id === savedBlock)) {
          setActiveBlockId(savedBlock);
        } else {
          setActiveBlockId(sorted.bloques[0]?.id || '');
        }
      }
    }
  }, [alumno.id, rutinas]);

  // Selección de día / bloque (NO sobreescribe ni resetea la rutina)
  const handleSelectBlock = (blockId: string) => {
    setActiveBlockId(blockId);
    try {
      localStorage.setItem(`fitpro_active_block_${alumno.id}`, blockId);
    } catch {}
    if (onActiveBlockChange) {
      onActiveBlockChange(blockId);
    }
  };

  // Cambio de rutina / fase
  const handleSelectRoutine = (routineId: string) => {
    setActiveRoutineId(routineId);
    try {
      localStorage.setItem(`fitpro_active_routine_${alumno.id}`, routineId);
    } catch {}
    const validRoutines = rutinas.filter((r) => String(r.alumno_id) === String(alumno.id));
    const target = validRoutines.find((r) => r.id === routineId);
    if (target) {
      const sortedTarget = sortRoutineBloquesAndEjercicios(target);
      setLocalRoutine(sortedTarget);
      setEditRoutineName(sortedTarget.nombre_rutina);
      setInlineRoutineName(sortedTarget.nombre_rutina);
      setEditFechaInicio(sortedTarget.fecha_inicio);
      setEditFechaCambio(sortedTarget.fecha_cambio);
      setEditNotasGenerales(sortedTarget.notas_generales || '');
      setActiveBlockId(sortedTarget.bloques[0]?.id || '');
    }
    if (onActiveRoutineChange) {
      onActiveRoutineChange(routineId);
    }
  };

  // Modo de vista en planilla (tabla) vs tarjetas
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Modales
  const [exerciseToDelete, setExerciseToDelete] = useState<{ rowIdx: number; name: string } | null>(null);
  const [showDeleteRoutineModal, setShowDeleteRoutineModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState('');
  const [targetRowForLibrary, setTargetRowForLibrary] = useState<number | null>(null);

  const [showMetaModal, setShowMetaModal] = useState(false);
  const [editRoutineName, setEditRoutineName] = useState('');
  const [editFechaInicio, setEditFechaInicio] = useState('');
  const [editFechaCambio, setEditFechaCambio] = useState('');
  const [editNotasGenerales, setEditNotasGenerales] = useState('');

  const [isEditingRoutineName, setIsEditingRoutineName] = useState(false);
  const [inlineRoutineName, setInlineRoutineName] = useState('');

  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockNameInput, setBlockNameInput] = useState('');

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
      handleSelectRoutine(created.id);
      handleSelectBlock(created.bloques[0]?.id || '');
      setLocalRoutine(created);
    }
  };

  // Modificación de ejercicios (actualiza local y guarda de forma segura)
  const handleUpdateExerciseFields = (rowIdx: number, fields: Partial<EjercicioRutina>) => {
    if (!localRoutine || !activeBlock) return;

    const updatedExercises = [...activeBlock.ejercicios];
    updatedExercises[rowIdx] = {
      ...updatedExercises[rowIdx],
      ...fields
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

  const handleUpdateExercise = (rowIdx: number, field: keyof EjercicioRutina, value: string) => {
    handleUpdateExerciseFields(rowIdx, { [field]: value });
  };

  const handleInsertRow = (atIndex: number) => {
    if (!localRoutine || !activeBlock) return;
    const newEx: EjercicioRutina = {
      id: 'ej-' + Date.now() + Math.random().toString(36).substr(2, 4),
      bloque_id: activeBlock.id,
      orden: atIndex + 1,
      ejercicio: '',
      series: '3',
      repeticiones: '10',
      carga: '',
      carga_p2: '',
      pausa: '60s',
      observaciones_dosificacion: ''
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

  const handleInsertSeparatorRow = (atIndex: number) => {
    if (!localRoutine || !activeBlock) return;
    const newSep: EjercicioRutina = {
      id: 'sep-' + Date.now() + Math.random().toString(36).substr(2, 4),
      bloque_id: activeBlock.id,
      orden: atIndex + 1,
      ejercicio: '— SEPARADOR —',
      series: '',
      repeticiones: '',
      carga: '',
      carga_p2: '',
      pausa: '',
      observaciones_dosificacion: '',
      es_separador: true,
      subtitulo_bloque: ''
    };

    const newExs = [...activeBlock.ejercicios];
    newExs.splice(atIndex, 0, newSep);
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
          id: 'ej-' + Date.now() + Math.random().toString(36).substr(2, 4),
          bloque_id: activeBlock.id,
          orden: 1,
          ejercicio: '',
          series: '3',
          repeticiones: '10',
          carga: '',
          carga_p2: '',
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
      ejercicio: source.ejercicio
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
    const newBlockId = 'blk-' + Date.now() + Math.random().toString(36).substr(2, 4);
    const newBlock: BloqueRutina = {
      id: newBlockId,
      rutina_id: localRoutine.id,
      nombre_sub_pestana: `Día ${blockNum}: Bloque de Entrenamiento`,
      orden: blockNum,
      ejercicios: [
        {
          id: 'ej-' + Date.now() + Math.random().toString(36).substr(2, 4),
          bloque_id: newBlockId,
          orden: 1,
          ejercicio: '',
          series: '3',
          repeticiones: '10',
          carga: '',
          carga_p2: '',
          pausa: '60s',
          observaciones_dosificacion: ''
        }
      ]
    };

    const updatedRoutine: Rutina = {
      ...localRoutine,
      bloques: [...localRoutine.bloques, newBlock],
      updated_at: new Date().toISOString()
    };
    setLocalRoutine(updatedRoutine);
    handleSelectBlock(newBlock.id);
    onSaveRoutine(updatedRoutine);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!localRoutine || localRoutine.bloques.length <= 1) return;
    const updatedBlocks = localRoutine.bloques.filter((b) => b.id !== blockId);
    updatedBlocks.forEach((b, idx) => (b.orden = idx + 1));
    const nextActive = updatedBlocks[0]?.id || '';
    const updatedRoutine: Rutina = {
      ...localRoutine,
      bloques: updatedBlocks,
      updated_at: new Date().toISOString()
    };
    setLocalRoutine(updatedRoutine);
    handleSelectBlock(nextActive);
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
    const updatedRoutine: Rutina = {
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
      observaciones_dosificacion: ''
    };

    const updatedBlocks = localRoutine.bloques.map((b) =>
      b.id === activeBlock.id ? { ...b, ejercicios: updatedExercises } : b
    );

    const updatedRoutine: Rutina = { ...localRoutine, bloques: updatedBlocks, updated_at: new Date().toISOString() };
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
    <div className="w-full max-w-full space-y-2.5 sm:space-y-4 pb-28 overflow-x-hidden">
      {/* 0. Barra superior con navegación */}
      <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={onBackToAlumnos}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition shrink-0 active:scale-95 group shadow-sm"
            title="Volver a la lista principal de alumnos"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
            <span>Volver<span className="hidden sm:inline"> a Alumnos</span></span>
          </button>

          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-base font-bold text-white truncate leading-tight">
              {alumno.nombre} {alumno.apellido}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate leading-none mt-0.5">
              {alumno.telefono}
            </p>
          </div>
        </div>

        {/* Botones de Exportación & Switcher de Alumnos */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => exportRoutineToPDF(alumno, localRoutine, evaluacion)}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition active:scale-95"
            title="Descargar PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => shareRoutineViaWhatsApp(alumno, localRoutine, evaluacion)}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition active:scale-95 shadow-sm"
            title="Compartir por WhatsApp"
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
              className="hidden lg:block px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-none"
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

      {/* 1. Selección de Rutina & Pestañas de Días */}
      <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0b101b] border border-slate-800 shadow-sm space-y-2.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 min-w-0">
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
                  className="w-full bg-slate-950 text-white font-bold text-xs sm:text-sm px-2.5 py-1 rounded-xl border border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveInlineRoutineName}
                  className="p-1 sm:p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingRoutineName(false)}
                  className="p-1 sm:p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:text-white shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400/50" />
                <h2 className="text-sm sm:text-lg font-bold sm:font-black text-white tracking-tight truncate">
                  {localRoutine.nombre_rutina}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setInlineRoutineName(localRoutine.nombre_rutina);
                    setIsEditingRoutineName(true);
                  }}
                  className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-slate-800 transition shrink-0"
                  title="Editar nombre de la rutina directamente"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowMetaModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-950 border border-slate-800 text-[11px] sm:text-xs text-slate-300 font-mono hover:border-slate-700 transition"
              title="Configurar ciclo de fechas"
            >
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
              <span>{localRoutine.fecha_inicio} al {localRoutine.fecha_cambio}</span>
              <Settings className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
            </button>

            {rutinas.length > 1 && (
              <div className="flex items-center gap-1">
                <select
                  value={activeRoutineId}
                  onChange={(e) => handleSelectRoutine(e.target.value)}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-950 border border-slate-800 text-[11px] sm:text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
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
                    className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-400 transition"
                    title="Eliminar esta fase de rutina"
                  >
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateNewRoutineInstant}
              className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500 text-emerald-400 font-bold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition active:scale-95 shadow-sm"
              title="Crear nueva rutina para este alumno"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Nueva Rutina</span>
            </button>
          </div>
        </div>

        {/* Sección: DÍAS / BLOQUES DE ENTRENAMIENTO */}
        <div className="space-y-1.5 sm:space-y-2 pt-0.5 sm:pt-1">
          <label className="block text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            DÍAS / BLOQUES DE ENTRENAMIENTO
          </label>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {localRoutine.bloques.map((b, idx) => {
              const isActive = b.id === activeBlockId;
              const count = b.ejercicios.length;

              return (
                <button
                  key={b.id}
                  onClick={() => handleSelectBlock(b.id)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-left transition-all active:scale-95 border flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow-md shadow-emerald-950/40'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900 font-semibold'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-500'}`} />
                  <span>Día {idx + 1}</span>
                  <span className={`text-[10px] sm:text-[11px] font-mono ${isActive ? 'text-emerald-100 font-normal' : 'text-slate-400'}`}>
                    {count} ejer.
                  </span>
                </button>
              );
            })}

            <button
              onClick={handleAddBlock}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl border border-dashed border-slate-700 bg-slate-950/60 hover:bg-slate-900 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition active:scale-95"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
              <span>Nuevo Día</span>
            </button>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL DEL DÍA ACTIVO */}
        {activeBlock && (
          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-[#070b14] overflow-hidden shadow-xl mt-2 sm:mt-3">
            <div className="p-2.5 sm:px-4 sm:py-3 border-b border-slate-800/80 bg-slate-950/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
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
                      className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingBlockId(null)}
                      className="p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm sm:text-base font-extrabold text-emerald-400">
                      Día {activeBlockIndex + 1}:
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-white truncate">
                      {activeBlock.nombre_sub_pestana.replace(/^Día \d+:\s*/, '')}
                    </span>
                    <button
                      onClick={() => {
                        setEditingBlockId(activeBlock.id);
                        setBlockNameInput(activeBlock.nombre_sub_pestana);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-emerald-400 transition shrink-0"
                      title="Renombrar este día"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {localRoutine.bloques.length > 1 && (
                      <button
                        onClick={() => handleDeleteBlock(activeBlock.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition shrink-0"
                        title="Eliminar este día"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Lado derecho: Banco de Ejercicios + Switcher Planilla / Tarjetas */}
              <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                <button
                  onClick={() => {
                    setTargetRowForLibrary(0);
                    setShowLibrary(true);
                  }}
                  className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl border border-emerald-500/40 bg-slate-900/90 hover:bg-slate-850 text-emerald-400 text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                  <span>Banco de Ejercicios</span>
                </button>

                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg sm:rounded-xl p-0.5">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition ${
                      viewMode === 'table'
                        ? 'bg-slate-900 text-emerald-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <TableIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Planilla</span>
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition ${
                      viewMode === 'cards'
                        ? 'bg-slate-900 text-emerald-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Tarjetas</span>
                  </button>
                </div>
              </div>
            </div>

            {/* TABLA ESTILO PLANILLA EXACTA */}
            {viewMode === 'table' ? (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800/80 uppercase tracking-wider text-[11px] font-mono">
                      <th className="py-2 sm:py-3 px-2 w-9 text-center">#</th>
                      <th className="py-2 sm:py-3 px-2.5 sm:px-3 min-w-[180px]">EJERCICIO</th>
                      <th className="py-2 sm:py-3 px-2 w-24 sm:w-28 min-w-[85px] text-center">SERIES</th>
                      <th className="py-2 sm:py-3 px-2 w-28 sm:w-36 min-w-[105px] text-center">REPS</th>
                      <th className="py-1.5 sm:py-2.5 px-1 w-16 text-center text-emerald-400" title="Carga P1 (Semana 1-2 / Fase Inicial)">
                        <div className="flex flex-col items-center leading-none gap-0.5">
                          <span className="font-bold text-[11px] font-mono">P1</span>
                          <span className="text-[9px] text-slate-500 font-medium tracking-normal font-sans">CARGA</span>
                        </div>
                      </th>
                      <th className="py-1.5 sm:py-2.5 px-1 w-16 text-center text-emerald-400" title="Carga P2 (Semana 3-4 / Progresión)">
                        <div className="flex flex-col items-center leading-none gap-0.5">
                          <span className="font-bold text-[11px] font-mono">P2</span>
                          <span className="text-[9px] text-slate-500 font-medium tracking-normal font-sans">CARGA</span>
                        </div>
                      </th>
                      <th className="py-2 sm:py-3 px-1 w-16 text-center">PAUSA</th>
                      <th className="py-2 sm:py-3 px-2 w-28 sm:w-36 max-w-[130px]" title="Observaciones de dosificación">OBS.</th>
                      <th className="py-2 sm:py-3 px-1.5 sm:px-2 w-24 text-center">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {activeBlock.ejercicios.map((ej, rowIdx) => {
                      if (ej.es_separador) {
                        return (
                          <tr
                            key={ej.id}
                            className="bg-slate-900/90 border-y-2 border-emerald-500/40 hover:bg-slate-850 transition group"
                          >
                            <td className="py-2 sm:py-2.5 px-2 text-center text-emerald-400 font-bold">
                              <Minus className="w-4 h-4 mx-auto text-emerald-400" />
                            </td>
                            <td colSpan={7} className="py-1.5 sm:py-2 px-2.5 sm:px-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 font-sans">
                                  Separador de Bloque
                                </span>
                                <input
                                  type="text"
                                  value={ej.subtitulo_bloque || (ej.ejercicio && !ej.ejercicio.includes('SEPARADOR') ? ej.ejercicio : '')}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    handleUpdateExerciseFields(rowIdx, {
                                      subtitulo_bloque: val,
                                      ejercicio: val.trim() ? `— SEPARADOR: ${val.trim()} —` : '— SEPARADOR —'
                                    });
                                  }}
                                  placeholder="Ej: BLOQUE 2: ZONA MEDIA / MIEMBRO INFERIOR..."
                                  className="w-full bg-transparent font-sans font-extrabold text-white text-xs sm:text-sm uppercase tracking-wide focus:outline-none focus:bg-slate-950 px-2 py-1 rounded border border-transparent focus:border-emerald-500/50"
                                />
                              </div>
                            </td>
                            <td className="py-1.5 sm:py-2 px-1.5 text-center">
                              <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-slate-400">
                                <button
                                  type="button"
                                  onClick={() => handleInsertRow(rowIdx + 1)}
                                  className="p-1 rounded hover:text-emerald-400 transition"
                                  title="Insertar ejercicio debajo"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInsertSeparatorRow(rowIdx + 1)}
                                  className="p-1 rounded hover:text-emerald-400 transition"
                                  title="Insertar otro separador debajo"
                                >
                                  <Minus className="w-3.5 h-3.5 text-emerald-400" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExerciseToDelete({ rowIdx, name: ej.subtitulo_bloque || 'Separador de Bloque' })}
                                  className="p-1 rounded hover:text-rose-400 transition"
                                  title="Eliminar separador"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={ej.id} className="hover:bg-slate-900/60 transition group">
                          {/* # */}
                          <td className="py-2 sm:py-3 px-2 text-center text-slate-400 font-bold text-xs">
                            {ej.orden || rowIdx + 1}
                          </td>

                          {/* EJERCICIO */}
                          <td className="py-1.5 sm:py-2.5 px-2.5 sm:px-3">
                            <div className="flex items-center justify-between gap-1.5">
                              <textarea
                                rows={ej.ejercicio.length > 25 ? 2 : 1}
                                value={ej.ejercicio}
                                onChange={(e) => handleUpdateExercise(rowIdx, 'ejercicio', e.target.value)}
                                placeholder="Nombre del ejercicio..."
                                className="w-full bg-transparent font-sans font-bold text-white text-xs sm:text-sm resize-none focus:outline-none focus:bg-slate-900/80 px-1 py-0.5 rounded leading-snug"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetRowForLibrary(rowIdx);
                                  setShowLibrary(true);
                                }}
                                className="p-1 rounded text-slate-500 hover:text-emerald-400 shrink-0 transition"
                                title="Banco de ejercicios"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* SERIES */}
                          <td className="py-1.5 sm:py-2 px-1.5 sm:px-2 w-24 sm:w-28 text-center">
                            <input
                              type="text"
                              value={ej.series}
                              onChange={(e) => handleUpdateExercise(rowIdx, 'series', e.target.value)}
                              className="w-full bg-transparent text-center font-bold text-white text-xs sm:text-base font-mono focus:outline-none focus:bg-slate-900/80 py-1 rounded"
                            />
                          </td>

                          {/* REPETICIONES */}
                          <td className="py-1.5 sm:py-2 px-1.5 sm:px-2 w-28 sm:w-36 text-center">
                            <input
                              type="text"
                              value={ej.repeticiones}
                              onChange={(e) => handleUpdateExercise(rowIdx, 'repeticiones', e.target.value)}
                              className="w-full bg-transparent text-center font-bold text-white text-xs sm:text-base font-mono focus:outline-none focus:bg-slate-900/80 py-1 rounded"
                            />
                          </td>

                          {/* P1 (CARGA 1) */}
                          <td className="py-1.5 sm:py-2 px-1 text-center">
                            <input
                              type="text"
                              value={ej.carga || ''}
                              placeholder="-"
                              title="Carga P1"
                              onChange={(e) => handleUpdateExercise(rowIdx, 'carga', e.target.value)}
                              className="w-full bg-transparent text-center font-bold text-emerald-400 text-xs sm:text-sm font-mono focus:outline-none focus:bg-slate-900/80 py-1 rounded"
                            />
                          </td>

                          {/* P2 (CARGA 2 / PROGRESIÓN) */}
                          <td className="py-1.5 sm:py-2 px-1 text-center">
                            <input
                              type="text"
                              value={ej.carga_p2 || ''}
                              placeholder="-"
                              title="Carga P2 (Progresión)"
                              onChange={(e) => handleUpdateExercise(rowIdx, 'carga_p2', e.target.value)}
                              className="w-full bg-transparent text-center font-bold text-emerald-400 text-xs sm:text-sm font-mono focus:outline-none focus:bg-slate-900/80 py-1 rounded"
                            />
                          </td>

                          {/* PAUSA */}
                          <td className="py-1.5 sm:py-2 px-1 text-center">
                            <input
                              type="text"
                              value={ej.pausa}
                              onChange={(e) => handleUpdateExercise(rowIdx, 'pausa', e.target.value)}
                              className="w-full bg-transparent text-center font-bold text-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:bg-slate-900/80 py-1 rounded"
                            />
                          </td>

                          {/* OBSERVACIONES */}
                          <td className="py-1.5 sm:py-2 px-1.5 sm:px-2 w-28 sm:w-36 max-w-[130px]">
                            <input
                              type="text"
                              value={ej.observaciones_dosificacion || ''}
                              onChange={(e) => handleUpdateExercise(rowIdx, 'observaciones_dosificacion', e.target.value)}
                              placeholder="Notas..."
                              title={ej.observaciones_dosificacion || 'Sin observaciones'}
                              className="w-full bg-transparent text-slate-400 text-xs font-sans focus:outline-none focus:bg-slate-900/80 px-1 py-0.5 rounded truncate focus:truncate-none"
                            />
                          </td>

                          {/* ACCIONES */}
                          <td className="py-1.5 sm:py-2.5 px-1.5 text-center">
                            <div className="flex items-center justify-center gap-0.5 sm:gap-1 text-slate-400">
                              <button
                                type="button"
                                onClick={() => handleMoveRow(rowIdx, 'up')}
                                disabled={rowIdx === 0}
                                className="p-1 rounded hover:text-emerald-400 disabled:opacity-20 transition"
                                title="Subir ejercicio"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveRow(rowIdx, 'down')}
                                disabled={rowIdx === activeBlock.ejercicios.length - 1}
                                className="p-1 rounded hover:text-emerald-400 disabled:opacity-20 transition"
                                title="Bajar ejercicio"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateRow(rowIdx)}
                                className="p-1 rounded hover:text-emerald-400 transition"
                                title="Duplicar fila"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInsertSeparatorRow(rowIdx + 1)}
                                className="p-1 rounded hover:text-emerald-400 transition"
                                title="Insertar separador debajo"
                              >
                                <Minus className="w-3.5 h-3.5 text-emerald-400" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setExerciseToDelete({ rowIdx, name: ej.ejercicio || 'Ejercicio' })}
                                className="p-1 rounded hover:text-rose-400 transition"
                                title="Eliminar fila"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* VISTA EN TARJETAS */
              <div className="p-2 sm:p-4 space-y-2.5 sm:space-y-3">
                {activeBlock.ejercicios.map((ej, rowIdx) => {
                  if (ej.es_separador) {
                    return (
                      <div
                        key={ej.id}
                        className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300">
                            Separador
                          </span>
                          <input
                            type="text"
                            value={ej.subtitulo_bloque || (ej.ejercicio && !ej.ejercicio.includes('SEPARADOR') ? ej.ejercicio : '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateExerciseFields(rowIdx, {
                                subtitulo_bloque: val,
                                ejercicio: val.trim() ? `— SEPARADOR: ${val.trim()} —` : '— SEPARADOR —'
                              });
                            }}
                            placeholder="Ej: BLOQUE 2: ZONA MEDIA..."
                            className="w-full bg-transparent font-bold text-white text-xs sm:text-sm focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => setExerciseToDelete({ rowIdx, name: ej.subtitulo_bloque || 'Separador' })}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={ej.id}
                      className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 space-y-2 sm:space-y-2.5 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-5 h-5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center shrink-0">
                            {ej.orden || rowIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={ej.ejercicio}
                            onChange={(e) => handleUpdateExercise(rowIdx, 'ejercicio', e.target.value)}
                            placeholder="Nombre del ejercicio..."
                            className="w-full bg-transparent font-bold text-white text-xs sm:text-sm focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setTargetRowForLibrary(rowIdx);
                              setShowLibrary(true);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-400"
                            title="Banco de ejercicios"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateRow(rowIdx)}
                            className="p-1 text-slate-400 hover:text-emerald-400"
                            title="Duplicar"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setExerciseToDelete({ rowIdx, name: ej.ejercicio || 'Ejercicio' })}
                            className="p-1 text-slate-400 hover:text-rose-400"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center text-xs">
                        <div className="py-0.5 px-0.5 sm:py-1.5 sm:px-1 rounded-md sm:rounded-lg bg-slate-900 border border-slate-800">
                          <span className="block text-[8px] sm:text-[10px] text-slate-400 uppercase font-mono leading-none mb-0.5">Series</span>
                          <input
                            type="text"
                            value={ej.series}
                            onChange={(e) => handleUpdateExercise(rowIdx, 'series', e.target.value)}
                            className="w-full text-center bg-transparent font-bold text-white focus:outline-none text-[11px] sm:text-sm font-mono py-0 leading-tight"
                          />
                        </div>
                        <div className="py-0.5 px-0.5 sm:py-1.5 sm:px-1 rounded-md sm:rounded-lg bg-slate-900 border border-slate-800">
                          <span className="block text-[8px] sm:text-[10px] text-slate-400 uppercase font-mono leading-none mb-0.5">Reps</span>
                          <input
                            type="text"
                            value={ej.repeticiones}
                            onChange={(e) => handleUpdateExercise(rowIdx, 'repeticiones', e.target.value)}
                            className="w-full text-center bg-transparent font-bold text-white focus:outline-none text-[11px] sm:text-sm font-mono py-0 leading-tight"
                          />
                        </div>
                        <div className="py-0.5 px-0.5 sm:py-1.5 sm:px-1 rounded-md sm:rounded-lg bg-slate-900 border border-slate-800">
                          <span className="block text-[8px] sm:text-[10px] text-emerald-400 uppercase font-mono leading-none mb-0.5">P1</span>
                          <input
                            type="text"
                            value={ej.carga || ''}
                            placeholder="-"
                            onChange={(e) => handleUpdateExercise(rowIdx, 'carga', e.target.value)}
                            className="w-full text-center bg-transparent font-bold text-emerald-400 focus:outline-none text-[11px] sm:text-sm font-mono py-0 leading-tight"
                          />
                        </div>
                        <div className="py-0.5 px-0.5 sm:py-1.5 sm:px-1 rounded-md sm:rounded-lg bg-slate-900 border border-slate-800">
                          <span className="block text-[8px] sm:text-[10px] text-emerald-400 uppercase font-mono leading-none mb-0.5">P2</span>
                          <input
                            type="text"
                            value={ej.carga_p2 || ''}
                            placeholder="-"
                            onChange={(e) => handleUpdateExercise(rowIdx, 'carga_p2', e.target.value)}
                            className="w-full text-center bg-transparent font-bold text-emerald-400 focus:outline-none text-[11px] sm:text-sm font-mono py-0 leading-tight"
                          />
                        </div>
                        <div className="py-0.5 px-0.5 sm:py-1.5 sm:px-1 rounded-md sm:rounded-lg bg-slate-900 border border-slate-800">
                          <span className="block text-[8px] sm:text-[10px] text-slate-400 uppercase font-mono leading-none mb-0.5">Pausa</span>
                          <input
                            type="text"
                            value={ej.pausa}
                            onChange={(e) => handleUpdateExercise(rowIdx, 'pausa', e.target.value)}
                            className="w-full text-center bg-transparent font-bold text-slate-200 focus:outline-none text-[11px] sm:text-sm font-mono py-0 leading-tight"
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        value={ej.observaciones_dosificacion || ''}
                        onChange={(e) => handleUpdateExercise(rowIdx, 'observaciones_dosificacion', e.target.value)}
                        placeholder="Observaciones de dosificación (opcional)..."
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs text-slate-300 focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* BOTONES INFERIORES: Agregar Ejercicio & Separador de Bloque */}
            <div className="p-2.5 sm:p-3 border-t border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => handleInsertRow(activeBlock.ejercicios.length)}
                className="w-full sm:flex-1 py-2 sm:py-2.5 px-4 rounded-xl border border-slate-800 hover:border-emerald-500/60 bg-slate-950 hover:bg-slate-900 text-slate-200 hover:text-emerald-400 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition active:scale-98 shadow-sm"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Agregar Ejercicio al Día {activeBlockIndex + 1}</span>
              </button>
              <button
                type="button"
                onClick={() => handleInsertSeparatorRow(activeBlock.ejercicios.length)}
                className="w-full sm:w-auto py-2 sm:py-2.5 px-4 rounded-xl border border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition active:scale-98 shadow-sm shrink-0"
                title="Inserta una fila vacía / separador para dividir bloques (ej: Zona Media vs Miembro Inferior)"
              >
                <span>+ Separador de Bloque</span>
              </button>
            </div>
          </div>
        )}
      </div>

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

            <div className="p-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
              <input
                type="text"
                value={libraryFilter}
                onChange={(e) => setLibraryFilter(e.target.value)}
                placeholder="Filtrar por nombre, patrón (sentadilla, empuje) o músculo..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

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
