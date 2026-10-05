import React, { useState, useEffect, useCallback } from 'react';
import { Alumno, Grupo, Rutina, EvaluacionClinica, RolProfesor } from './types';
import {
  openDB,
  seedInitialDataIfEmpty,
  getAlumnos,
  getGrupos,
  getRutinasByAlumno,
  getEvaluacionClinica,
  saveAlumno,
  deleteAlumno,
  saveGrupo,
  deleteGrupo,
  saveRutina,
  deleteRutina,
  saveEvaluacionClinica,
  subscribeToDBChanges
} from './db/indexedDb';

import { Header } from './components/Header';
import { BottomDock } from './components/BottomDock';
import { StudentList } from './components/StudentList';
import { GroupManager } from './components/GroupManager';
import { RoutineSpreadsheet } from './components/RoutineSpreadsheet';
import { ClinicalEvaluationModal } from './components/ClinicalEvaluationModal';
import { DailyTrackingModal } from './components/DailyTrackingModal';
import { AuthScreen } from './components/AuthScreen';
import { SupabaseSqlModal } from './components/SupabaseSqlModal';
import {
  isSupabaseConfigured,
  fetchStudentsFromSupabase,
  saveStudentToSupabase,
  deleteStudentFromSupabase,
  fetchGroupsFromSupabase,
  saveGroupToSupabase,
  deleteGroupFromSupabase,
  saveRoutineToSupabase,
  deleteRoutineFromSupabase
} from './db/supabaseClient';

import {
  Users,
  ClipboardList,
  Activity,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Brain,
  Layers,
  LogOut
} from 'lucide-react';

interface AuthUser {
  name: string;
  email: string;
  role: 'admin_gimnasio' | 'profesor';
}

export default function App() {
  const [loading, setLoading] = useState(true);

  // Authentication State (Saved to localStorage)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('fitpro_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Modo Sala: Active Athletes pinned to bottom dock (up to 8)
  const [activeDockStudents, setActiveDockStudents] = useState<Alumno[]>([]);

  // Navigation View
  const [activeView, setActiveView] = useState<'alumnos' | 'grupos' | 'rutina' | 'evaluacion'>('alumnos');

  // Selected Student Routines & Evaluation
  const [currentRutinas, setCurrentRutinas] = useState<Rutina[]>([]);
  const [currentEvaluacion, setCurrentEvaluacion] = useState<EvaluacionClinica | null>(null);

  // Modals
  const [isDailyLogOpen, setIsDailyLogOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [dailyLogStudent, setDailyLogStudent] = useState<Alumno | null>(null);

  // Initialize DB and load data
  const loadData = useCallback(async () => {
    try {
      await seedInitialDataIfEmpty();
      const allAlumnos = await getAlumnos();
      const allGrupos = await getGrupos();

      setAlumnos(allAlumnos);
      setGrupos(allGrupos);

      // Cloud sync with Supabase if credentials are provided in .env
      if (isSupabaseConfigured()) {
        fetchStudentsFromSupabase().then((cloudAlumnos) => {
          if (cloudAlumnos && cloudAlumnos.length > 0) {
            setAlumnos(cloudAlumnos);
            cloudAlumnos.forEach((a) => saveAlumno(a));
          }
        }).catch((e) => console.warn('[Supabase Sync]', e));

        fetchGroupsFromSupabase().then((cloudGrupos) => {
          if (cloudGrupos && cloudGrupos.length > 0) {
            setGrupos(cloudGrupos);
            cloudGrupos.forEach((g) => saveGrupo(g));
          }
        }).catch((e) => console.warn('[Supabase Sync]', e));
      }

      // Default selected student if none
      if (!selectedStudentId && allAlumnos.length > 0) {
        const first = allAlumnos[0];
        setSelectedStudentId(first.id);
        setActiveDockStudents(allAlumnos.slice(0, 4)); // Pre-pin 4 athletes to gym floor dock
        const [ruts, ev] = await Promise.all([
          getRutinasByAlumno(first.id),
          getEvaluacionClinica(first.id)
        ]);
        setCurrentRutinas(ruts);
        setCurrentEvaluacion(ev);
      } else if (selectedStudentId) {
        // Refresh active dock students with updated records
        setActiveDockStudents((prev) =>
          prev.map((docAlm) => allAlumnos.find((a) => a.id === docAlm.id) || docAlm)
        );
        const [ruts, ev] = await Promise.all([
          getRutinasByAlumno(selectedStudentId),
          getEvaluacionClinica(selectedStudentId)
        ]);
        setCurrentRutinas(ruts);
        setCurrentEvaluacion(ev);
      }
    } catch (err) {
      console.error('Error loading DB data', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDBChanges(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // Load routines & clinical evaluation whenever selected student changes
  useEffect(() => {
    if (!selectedStudentId) return;

    let isMounted = true;
    Promise.all([
      getRutinasByAlumno(selectedStudentId),
      getEvaluacionClinica(selectedStudentId)
    ]).then(([ruts, ev]) => {
      if (isMounted) {
        setCurrentRutinas(ruts);
        setCurrentEvaluacion(ev);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedStudentId]);

  const selectedStudent = alumnos.find((a) => a.id === selectedStudentId) || alumnos[0];

  // Auth Handlers
  const handleLogin = (userData: AuthUser) => {
    setCurrentUser(userData);
    localStorage.setItem('fitpro_auth_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fitpro_auth_user');
  };

  // Handlers for Selecting & Docking Students
  const handleSelectStudent = (alumno: Alumno, targetView: 'rutina' | 'evaluacion' = 'rutina') => {
    setSelectedStudentId(alumno.id);
    setActiveView(targetView);

    // If not in dock, add it (if < 8)
    if (!activeDockStudents.some((a) => a.id === alumno.id)) {
      if (activeDockStudents.length < 8) {
        setActiveDockStudents((prev) => [...prev, alumno]);
      }
    }
  };

  const handleToggleDock = (alumno: Alumno) => {
    if (activeDockStudents.some((a) => a.id === alumno.id)) {
      setActiveDockStudents((prev) => prev.filter((a) => a.id !== alumno.id));
    } else {
      if (activeDockStudents.length < 8) {
        setActiveDockStudents((prev) => [...prev, alumno]);
      }
    }
  };

  const handleRemoveFromDock = (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDockStudents((prev) => prev.filter((a) => a.id !== studentId));
  };

  const handleCreateNewRoutine = async (alumnoId: string): Promise<Rutina> => {
    const routineNum = currentRutinas.length + 1;
    const newRoutineId = 'rut-' + Date.now();
    const newRoutine: Rutina = {
      id: newRoutineId,
      alumno_id: alumnoId,
      nombre_rutina: `Rutina ${routineNum}: Nueva Fase`,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_cambio: new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0],
      activa: true,
      orden: routineNum,
      notas_generales: 'Cuidar progresión de carga y técnica.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      bloques: [
        {
          id: 'blk-' + Date.now(),
          rutina_id: newRoutineId,
          nombre_sub_pestana: 'Día 1: Principal',
          orden: 1,
          ejercicios: [
            {
              id: 'ej-' + Date.now(),
              bloque_id: 'blk-' + Date.now(),
              orden: 1,
              ejercicio: 'Sentadilla Goblet con Mancuerna',
              series: '3',
              repeticiones: '10',
              carga: '16 kg',
              pausa: '60s',
              observaciones_dosificacion: 'Mantener tronco vertical y control excéntrico.'
            }
          ]
        }
      ]
    };

    await saveRutina(newRoutine);
    setCurrentRutinas((prev) => [...prev, newRoutine]);
    return newRoutine;
  };

  const handleSaveRoutine = async (rutina: Rutina) => {
    await saveRutina(rutina);
    if (isSupabaseConfigured()) {
      saveRoutineToSupabase(rutina).catch((err) => console.warn('[Supabase]', err));
    }
    setCurrentRutinas((prev) => {
      const idx = prev.findIndex((r) => r.id === rutina.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = rutina;
        return copy;
      }
      return [...prev, rutina];
    });
  };

  const handleDeleteRoutine = async (routineId: string) => {
    await deleteRutina(routineId);
    if (isSupabaseConfigured()) {
      deleteRoutineFromSupabase(routineId).catch((err) => console.warn('[Supabase]', err));
    }
    setCurrentRutinas((prev) => prev.filter((r) => r.id !== routineId));
  };

  const handleSaveEvaluacion = async (evaluacion: EvaluacionClinica) => {
    await saveEvaluacionClinica(evaluacion);
    setCurrentEvaluacion(evaluacion);
  };

  const handleAddStudent = async (newAlumno: Omit<Alumno, 'id' | 'created_at' | 'updated_at'>) => {
    const created: Alumno = {
      ...newAlumno,
      id: 'alm-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await saveAlumno(created);
    if (isSupabaseConfigured()) {
      saveStudentToSupabase(created).catch((err) => console.warn('[Supabase]', err));
    }
    setSelectedStudentId(created.id);
  };

  const handleEditStudent = async (updatedAlumno: Alumno) => {
    await saveAlumno(updatedAlumno);
    if (isSupabaseConfigured()) {
      saveStudentToSupabase(updatedAlumno).catch((err) => console.warn('[Supabase]', err));
    }
    await loadData();
  };

  const handleDeleteStudent = async (studentId: string) => {
    await deleteAlumno(studentId);
    if (isSupabaseConfigured()) {
      deleteStudentFromSupabase(studentId).catch((err) => console.warn('[Supabase]', err));
    }
    setActiveDockStudents((prev) => prev.filter((a) => a.id !== studentId));
    if (selectedStudentId === studentId) {
      const remaining = alumnos.filter((a) => a.id !== studentId);
      setSelectedStudentId(remaining[0]?.id || null);
    }
    await loadData();
  };

  const handleAddGrupo = async (newGrupo: Omit<Grupo, 'id'>) => {
    const created: Grupo = {
      ...newGrupo,
      id: 'grp-' + Date.now()
    };
    await saveGrupo(created);
    if (isSupabaseConfigured()) {
      saveGroupToSupabase(created).catch((err) => console.warn('[Supabase]', err));
    }
    await loadData();
  };

  const handleEditGrupo = async (updatedGrupo: Grupo) => {
    await saveGrupo(updatedGrupo);
    if (isSupabaseConfigured()) {
      saveGroupToSupabase(updatedGrupo).catch((err) => console.warn('[Supabase]', err));
    }
    await loadData();
  };

  const handleDeleteGrupo = async (grupoId: string) => {
    await deleteGrupo(grupoId);
    if (isSupabaseConfigured()) {
      deleteGroupFromSupabase(grupoId).catch((err) => console.warn('[Supabase]', err));
    }
    await loadData();
  };

  const handleReassignStudentGroup = async (alumnoId: string, newGrupoId: string) => {
    const target = alumnos.find((a) => a.id === alumnoId);
    if (target) {
      await saveAlumno({
        ...target,
        grupo_id: newGrupoId,
        updated_at: new Date().toISOString()
      });
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-display font-bold text-white text-base">Iniciando FitPro Manager...</p>
          <span className="text-xs text-slate-500 font-mono">Cargando base de datos IndexedDB offline</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show the Auth Login / Register Screen!
  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} defaultEmail="jonalippo@gmail.com" />;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        userName={currentUser.name}
        onLogout={handleLogout}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Viewport Container (Zero horizontal scroll) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-5 pb-24 overflow-x-hidden">
        {/* Mobile user status and logout bar */}
        <div className="md:hidden flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs mb-3 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-xs truncate leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-emerald-400 font-mono leading-none">Profesor Titular</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 text-[11px] font-bold flex items-center gap-1 shrink-0 active:scale-95 transition"
            title="Cerrar sesión"
          >
            <LogOut className="w-3 h-3 text-rose-400" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Mobile quick tabs (Only Alumnos, Grupos, and Rutina if active) */}
        <div className="md:hidden flex items-center gap-1.5 mb-4 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveView('alumnos')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeView === 'alumnos' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Alumnos</span>
          </button>
          <button
            onClick={() => setActiveView('grupos')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeView === 'grupos' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Grupos</span>
          </button>
          {selectedStudent && activeView === 'rutina' && (
            <button
              onClick={() => setActiveView('rutina')}
              className="flex-1 py-2 rounded-xl font-bold transition bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 truncate px-2"
            >
              Rutina: {selectedStudent.nombre}
            </button>
          )}
        </div>

        {/* View 1: Alumnos Directory & Gym Floor Hub */}
        {activeView === 'alumnos' && (
          <StudentList
            alumnos={alumnos}
            grupos={grupos}
            selectedStudentId={selectedStudentId}
            activeDockIds={activeDockStudents.map((a) => a.id)}
            onSelectStudent={(alm, view) => handleSelectStudent(alm, view)}
            onToggleDockStudent={handleToggleDock}
            onOpenDailyLog={(alm) => {
              setDailyLogStudent(alm);
              setIsDailyLogOpen(true);
            }}
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
            onAddGrupo={handleAddGrupo}
            onNavigateToGroups={() => setActiveView('grupos')}
          />
        )}

        {/* View 2: Grupos & Turnos Management */}
        {activeView === 'grupos' && (
          <GroupManager
            grupos={grupos}
            alumnos={alumnos}
            onAddGrupo={handleAddGrupo}
            onEditGrupo={handleEditGrupo}
            onDeleteGrupo={handleDeleteGrupo}
            onReassignStudentGroup={handleReassignStudentGroup}
            onSelectStudent={(alm, view) => handleSelectStudent(alm, view)}
            onBackToAlumnos={() => setActiveView('alumnos')}
          />
        )}

        {/* View 3: Rutina Interactive Spreadsheet */}
        {activeView === 'rutina' && selectedStudent && (
          <RoutineSpreadsheet
            alumno={selectedStudent}
            rutinas={currentRutinas}
            evaluacion={currentEvaluacion}
            allAlumnos={alumnos}
            onSaveRoutine={handleSaveRoutine}
            onCreateNewRoutine={handleCreateNewRoutine}
            onDeleteRoutine={handleDeleteRoutine}
            onBackToAlumnos={() => setActiveView('alumnos')}
            onSwitchStudent={(alm) => handleSelectStudent(alm, 'rutina')}
            onOpenEvaluation={() => setActiveView('evaluacion')}
          />
        )}

        {/* View 4: Evaluación Clínica "El Iceberg" */}
        {activeView === 'evaluacion' && selectedStudent && (
          <div className="space-y-4 pb-24">
            {/* Top Action Bar with Back Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 px-3.5 py-2.5 rounded-2xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveView('alumnos')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 text-xs font-bold transition group shadow-sm active:scale-95"
                  title="Volver a la lista de todos los alumnos"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
                  <span>Volver a Alumnos</span>
                </button>

                {/* Breadcrumbs */}
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                  <button onClick={() => setActiveView('alumnos')} className="hover:text-slate-200 transition">
                    Alumnos
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="font-semibold text-white">
                    {selectedStudent.nombre} {selectedStudent.apellido}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-emerald-400 font-medium">Evaluación Clínica</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                {alumnos.length > 1 && (
                  <select
                    value={selectedStudent.id}
                    onChange={(e) => {
                      const target = alumnos.find((a) => a.id === e.target.value);
                      if (target) handleSelectStudent(target, 'evaluacion');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    {alumnos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre} {a.apellido} {a.alerta_lesion_activa ? '⚠️' : ''}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => setActiveView('rutina')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Ver Rutina</span>
                </button>
              </div>
            </div>

            {/* Header Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-emerald-400 font-bold text-lg flex items-center justify-center border border-emerald-500/30">
                  {selectedStudent.nombre.charAt(0)}{selectedStudent.apellido.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {selectedStudent.nombre} {selectedStudent.apellido}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Historial biopsicosocial y evaluación física según Demanda vs. Capacidad.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEvalModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Editar Evaluación (5 Pilares)</span>
              </button>
            </div>

            {currentEvaluacion ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Pilar 1 & 5 */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>Presentación Actual & Conducta</span>
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 text-amber-400 font-bold border border-slate-800">
                      EVA: {currentEvaluacion.dolor_eva}/10
                    </span>
                  </div>
                  <p><strong className="text-slate-300">Objetivos:</strong> {currentEvaluacion.objetivos_principales}</p>
                  <p><strong className="text-slate-300">Síntomas:</strong> {currentEvaluacion.sintomas_relevantes}</p>
                  <p><strong className="text-slate-300">Zonas Afectadas:</strong> {currentEvaluacion.zonas_dolor.join(', ')}</p>
                  <p><strong className="text-slate-300">Decisión Clínica:</strong> <span className="font-bold text-emerald-400">{currentEvaluacion.decision_conducta}</span></p>
                  <p><strong className="text-slate-300">Justificación:</strong> {currentEvaluacion.justificacion_clinica}</p>
                </div>

                {/* Pilar 2, 3, 4 */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-blue-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Brain className="w-4 h-4" />
                      <span>Capacidad Física & Biopsicosocial</span>
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      Tolerancia: {currentEvaluacion.tolerancia_carga_estimada}
                    </span>
                  </div>
                  <p><strong className="text-slate-300">Lesiones Previas:</strong> {currentEvaluacion.lesiones_previas}</p>
                  <p><strong className="text-slate-300">Movilidad Articular:</strong> {currentEvaluacion.movilidad_articular}</p>
                  <p><strong className="text-slate-300">Control Cadena:</strong> CCC: <span className="text-emerald-400 font-semibold">{currentEvaluacion.control_motor_cadena.ccc_score}</span> · CCA: <span className="text-blue-400 font-semibold">{currentEvaluacion.control_motor_cadena.cca_score}</span></p>
                  <p><strong className="text-slate-300">Sueño & Estrés:</strong> Sueño {currentEvaluacion.calidad_sueno}/5 · Estrés {currentEvaluacion.nivel_estres}/10</p>
                  <p><strong className="text-slate-300">Kinesiofobia:</strong> {currentEvaluacion.kinesiofobia_nivel}</p>
                  <p><strong className="text-slate-300">Barreras / Adherencia:</strong> {currentEvaluacion.expectativas_barreras}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 p-6 rounded-2xl bg-slate-900 border border-dashed border-slate-800 shadow-md">
                <p className="text-sm font-semibold text-slate-300">No se ha cargado la evaluación clínica aún</p>
                <button
                  onClick={() => setIsEvalModalOpen(true)}
                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
                >
                  Cargar Evaluación Ahora
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modo Sala: Fixed Bottom Dock */}
      <BottomDock
        activeStudents={activeDockStudents}
        selectedStudentId={selectedStudentId}
        onSelectStudent={(alm) => {
          setSelectedStudentId(alm.id);
          setActiveView('rutina');
        }}
        onRemoveFromDock={handleRemoveFromDock}
        onOpenStudentDirectory={() => setActiveView('alumnos')}
      />

      {/* Daily Session Log Modal (RPE & EVA) */}
      {dailyLogStudent && (
        <DailyTrackingModal
          alumno={dailyLogStudent}
          isOpen={isDailyLogOpen}
          onClose={() => {
            setIsDailyLogOpen(false);
            setDailyLogStudent(null);
          }}
          onSessionLogged={() => {
            loadData();
          }}
        />
      )}

      {/* Clinical 5-Pillar Modal */}
      {selectedStudent && isEvalModalOpen && (
        <ClinicalEvaluationModal
          alumno={selectedStudent}
          evaluacionActual={currentEvaluacion}
          isOpen={isEvalModalOpen}
          onClose={() => setIsEvalModalOpen(false)}
          onSaveEvaluacion={handleSaveEvaluacion}
        />
      )}

      {/* Supabase Architecture & SQL Script Modal */}
      <SupabaseSqlModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}
