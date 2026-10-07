import React, { useState, useEffect, useCallback } from 'react';
import { Alumno, Grupo, Rutina, EvaluacionClinica, RolProfesor } from './types';
import { DashboardHome } from './components/DashboardHome';
import {
  openDB,
  seedInitialDataIfEmpty,
  getAlumnos,
  getGrupos,
  getRutinasByAlumno,
  getEvaluacionClinica,
  saveAlumno,
  deleteAlumno,
  clearAllLocalAlumnos,
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
import { PaymentsManager } from './components/PaymentsManager';
import {
  isSupabaseConfigured,
  fetchStudentsFromSupabase,
  fetchRoutinesFromSupabase,
  saveStudentToSupabase,
  deleteStudentFromSupabase,
  clearAllStudentsFromSupabase,
  fetchGroupsFromSupabase,
  saveGroupToSupabase,
  deleteGroupFromSupabase,
  saveRoutineToSupabase,
  deleteRoutineFromSupabase
} from './db/supabaseClient';

import {
  Home,
  Users,
  ClipboardList,
  Activity,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Brain,
  Layers,
  DollarSign,
  LogOut,
  X
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

interface AuthUser {
  name: string;
  email: string;
  role: 'admin_gimnasio' | 'profesor';
}

export default function App() {
  const [loading, setLoading] = useState(true);

  // Authentication State: Inicia siempre desde Login al recargar la app
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
  
  // Pagos en memoria y persistencia local sin requerir cambios en indexedDb
  const [pagos, setPagos] = useState<PagoCuota[]>(() => {
    try {
      const saved = localStorage.getItem('fitpro_local_pagos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Modo Sala: Atletas fijados en el dock inferior (hasta 8)
  const [activeDockStudents, setActiveDockStudents] = useState<Alumno[]>([]);

  // Navigation View (Alumnos, Grupos, Pagos, Rutina, Evaluacion)
  const [activeView, setActiveView] = useState<'home' |'alumnos' | 'grupos' | 'pagos' | 'rutina' | 'evaluacion'>(() => {
    try {
      const saved = localStorage.getItem('fitpro_active_view');
      if (saved && ['alumnos', 'alumnos', 'grupos', 'pagos', 'rutina', 'evaluacion'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'home';
  });

  // Guarda automáticamente la pantalla actual al navegar
  useEffect(() => {
    try {
      localStorage.setItem('fitpro_active_view', activeView);
    } catch {}
  }, [activeView]);

  // Recuerda el alumno seleccionado al recargar
  useEffect(() => {
    try {
      if (selectedStudentId) {
        localStorage.setItem('fitpro_selected_student_id', selectedStudentId);
      }
    } catch {}
  }, [selectedStudentId]);

  // Selected Student Routines & Evaluation
  const [currentRutinas, setCurrentRutinas] = useState<Rutina[]>([]);
  const [currentEvaluacion, setCurrentEvaluacion] = useState<EvaluacionClinica | null>(null);

  // Caché de rutinas por alumno para cambio instantáneo de pestañas sin recargar pantalla
  const [routinesByStudent, setRoutinesByStudent] = useState<Record<string, Rutina[]>>({});
  // Memoria del Día/Bloque (Día 1, Día 2, etc.) y rutina activa para cada alumno
  const [studentActiveDays, setStudentActiveDays] = useState<Record<string, string>>({});
  const [studentActiveRoutines, setStudentActiveRoutines] = useState<Record<string, string>>({});
  const isSavingRef = React.useRef(false);

  // Modals
  const [isDailyLogOpen, setIsDailyLogOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [dailyLogStudent, setDailyLogStudent] = useState<Alumno | null>(null);
  const initialCloudSyncDone = React.useRef(false);

  // Cloud connection status & real-time toast feedback
  const [isCloudConnected, setIsCloudConnected] = useState(() => isSupabaseConfigured());
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  // Initialize DB and load data
  const loadData = useCallback(async () => {
    try {
      await seedInitialDataIfEmpty();
      const allAlumnos = await getAlumnos();
      const allGrupos = await getGrupos();

      setAlumnos(allAlumnos);
      setGrupos(allGrupos);

      // Cloud sync con Supabase ÚNICAMENTE en el arranque inicial para no resucitar alumnos borrados
      if (isSupabaseConfigured() && !initialCloudSyncDone.current) {
        initialCloudSyncDone.current = true;
        try {
          const cloudAlumnos = await fetchStudentsFromSupabase();
          if (cloudAlumnos && cloudAlumnos.length > 0) {
            setAlumnos(cloudAlumnos);
            for (const a of cloudAlumnos) {
              await saveAlumno(a);
              const cloudRuts = await fetchRoutinesFromSupabase(a.id);
              if (cloudRuts && cloudRuts.length > 0) {
                for (const r of cloudRuts) {
                  await saveRutina(r);
                }
              }
            }
          }

          const cloudGrupos = await fetchGroupsFromSupabase();
          if (cloudGrupos && cloudGrupos.length > 0) {
            setGrupos(cloudGrupos);
            for (const g of cloudGrupos) {
              await saveGrupo(g);
            }
          }
        } catch (e) {
          console.warn('[Supabase Initial Sync]', e);
        }
      }

      // Pre-cargar rutinas en memoria caché
      const routinesCacheMap: Record<string, Rutina[]> = {};
      await Promise.all(
        allAlumnos.map(async (a) => {
          try {
            const ruts = await getRutinasByAlumno(a.id);
            if (ruts.length > 0) {
              routinesCacheMap[a.id] = ruts;
            }
          } catch (e) {
            console.warn('[Cache routine]', e);
          }
        })
      );
      setRoutinesByStudent((prev) => ({ ...prev, ...routinesCacheMap }));

      // Default selected student if none
      if (!selectedStudentId && allAlumnos.length > 0) {
        const first = allAlumnos[0];
        setSelectedStudentId(first.id);
        setActiveDockStudents(allAlumnos.slice(0, 4));
        const ruts = routinesCacheMap[first.id] || (await getRutinasByAlumno(first.id));
        const ev = await getEvaluacionClinica(first.id);
        setCurrentRutinas(ruts);
        setCurrentEvaluacion(ev);
      } else if (selectedStudentId) {
        setActiveDockStudents((prev) =>
          prev.map((docAlm) => allAlumnos.find((a) => a.id === docAlm.id) || docAlm)
        );
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to load local DB:', err);
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

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('fitpro_auth_user', JSON.stringify(user));
    } catch {}
    showToast('success', `Bienvenido, ${user.name}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('fitpro_auth_user');
      localStorage.removeItem('fitpro_active_view');
      localStorage.removeItem('fitpro_selected_student_id');
    } catch {}
    showToast('info', 'Sesión cerrada');
  };

  const selectedStudent = alumnos.find((a) => a.id === selectedStudentId) || null;

  const handleSelectStudent = async (alumno: Alumno, view: 'rutina' | 'evaluacion') => {
    setSelectedStudentId(alumno.id);
    setActiveView(view);

    if (!activeDockStudents.some((a) => a.id === alumno.id)) {
      if (activeDockStudents.length < 8) {
        setActiveDockStudents((prev) => [...prev, alumno]);
      } else {
        setActiveDockStudents((prev) => [...prev.slice(1), alumno]);
      }
    }

    // Carga de rutinas y evaluación
    try {
      const [ruts, evalClinica] = await Promise.all([
        getRutinasByAlumno(alumno.id),
        getEvaluacionClinica(alumno.id)
      ]);
      setCurrentRutinas(ruts);
      setCurrentEvaluacion(evalClinica);
      setRoutinesByStudent((prev) => ({ ...prev, [alumno.id]: ruts }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleDock = (alumno: Alumno) => {
    const isDocked = activeDockStudents.some((a) => a.id === alumno.id);
    if (isDocked) {
      setActiveDockStudents((prev) => prev.filter((a) => a.id !== alumno.id));
    } else {
      if (activeDockStudents.length < 8) {
        setActiveDockStudents((prev) => [...prev, alumno]);
      } else {
        setActiveDockStudents((prev) => [...prev.slice(1), alumno]);
      }
    }
  };

  const handleRemoveFromDock = (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDockStudents((prev) => prev.filter((a) => a.id !== studentId));
  };

  const handleCreateNewRoutine = async (alumnoId: string): Promise<Rutina> => {
    const studentRoutines = await getRutinasByAlumno(alumnoId);
    const routineNum = studentRoutines.length + 1;
    const newRoutineId = 'rut-' + alumnoId + '-' + Date.now();
    const newRoutine: Rutina = {
      id: newRoutineId,
      alumno_id: alumnoId,
      nombre_rutina: `Rutina ${routineNum}: Fase Inicial`,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_cambio: new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0],
      activa: true,
      orden: routineNum,
      notas_generales: 'Planificación personalizada.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      bloques: [
        {
          id: 'blk-' + alumnoId + '-' + Date.now(),
          rutina_id: newRoutineId,
          nombre_sub_pestana: 'Día 1: Principal',
          orden: 1,
          ejercicios: [
            {
              id: 'ej-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              bloque_id: 'blk-' + alumnoId + '-' + Date.now(),
              orden: 1,
              ejercicio: 'Sentadilla Goblet con Mancuerna',
              series: '3',
              repeticiones: '10',
              carga: '14 kg',
              pausa: '60s',
              observaciones_dosificacion: 'Mantener tronco vertical y control excéntrico.'
            }
          ]
        }
      ]
    };

    await saveRutina(newRoutine);
    if (isSupabaseConfigured()) {
      saveRoutineToSupabase(newRoutine).catch((err) => console.warn('[Supabase]', err));
    }
    setRoutinesByStudent((prev) => {
      const list = prev[alumnoId] || [];
      return { ...prev, [alumnoId]: [...list.filter((r) => r.id !== newRoutine.id), newRoutine] };
    });
    setCurrentRutinas((prev) => {
      const filtered = prev.filter((r) => r.id !== newRoutine.id);
      return [...filtered, newRoutine];
    });
    return newRoutine;
  };

  const handleSaveRoutine = async (rutina: Rutina) => {
    isSavingRef.current = true;
    try {
      setRoutinesByStudent((prev) => {
        const list = prev[rutina.alumno_id] || [];
        const idx = list.findIndex((r) => r.id === rutina.id);
        const updated = idx >= 0 ? list.map((r) => (r.id === rutina.id ? rutina : r)) : [...list, rutina];
        return { ...prev, [rutina.alumno_id]: updated };
      });
      setCurrentRutinas((prev) => {
        const idx = prev.findIndex((r) => r.id === rutina.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = rutina;
          return copy;
        }
        return [...prev, rutina];
      });

      await saveRutina(rutina);

      if (isSupabaseConfigured()) {
        saveRoutineToSupabase(rutina).catch((err) => console.warn('[Supabase]', err));
      }
    } finally {
      setTimeout(() => {
        isSavingRef.current = false;
      }, 500);
    }
  };

  const handleDeleteRoutine = async (routineId: string) => {
    await deleteRutina(routineId);
    if (isSupabaseConfigured()) {
      deleteRoutineFromSupabase(routineId).catch((err) => console.warn('[Supabase]', err));
    }
    setRoutinesByStudent((prev) => {
      const copy: Record<string, Rutina[]> = {};
      for (const [k, v] of Object.entries(prev)) {
        copy[k] = v.filter((r) => r.id !== routineId);
      }
      return copy;
    });
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
      const res = await saveStudentToSupabase(created);
      if (res.success) {
        showToast('success', `✓ Alumno "${created.nombre} ${created.apellido}" guardado y sincronizado`);
      } else {
        showToast('error', `⚠️ Guardado localmente, error en nube: ${res.error || 'Error'}`);
      }
    } else {
      showToast('success', `Alumno guardado en este dispositivo`);
    }

    const newRoutine = await handleCreateNewRoutine(created.id);
    setRoutinesByStudent((prev) => ({ ...prev, [created.id]: [newRoutine] }));
    setCurrentRutinas([newRoutine]);
    setAlumnos((prev) => [...prev, created]);
    setSelectedStudentId(created.id);
    setActiveDockStudents((prev) => [created, ...prev.slice(0, 7)]);
  };

  const handleEditStudent = async (updatedAlumno: Alumno) => {
    await saveAlumno(updatedAlumno);
    if (isSupabaseConfigured()) {
      const res = await saveStudentToSupabase(updatedAlumno);
      if (res.success) {
        showToast('success', `✓ Alumno "${updatedAlumno.nombre}" actualizado`);
      } else {
        showToast('error', `⚠️ Error en Supabase: ${res.error || 'Error'}`);
      }
    }
    await loadData();
  };

  const handleDeleteStudent = async (studentId: string) => {
    setAlumnos((prev) => prev.filter((a) => a.id !== studentId));
    setActiveDockStudents((prev) => prev.filter((a) => a.id !== studentId));
    setRoutinesByStudent((prev) => {
      const copy = { ...prev };
      delete copy[studentId];
      return copy;
    });
    setStudentActiveDays((prev) => {
      const copy = { ...prev };
      delete copy[studentId];
      return copy;
    });
    setStudentActiveRoutines((prev) => {
      const copy = { ...prev };
      delete copy[studentId];
      return copy;
    });

    if (selectedStudentId === studentId) {
      setSelectedStudentId((prev) => {
        const remaining = alumnos.filter((a) => a.id !== studentId);
        return remaining[0]?.id || null;
      });
    }

    if (isSupabaseConfigured()) {
      await deleteStudentFromSupabase(studentId);
    }

    await deleteAlumno(studentId);
  };

  const handleClearAllStudents = async () => {
    setAlumnos([]);
    setActiveDockStudents([]);
    setSelectedStudentId(null);
    setCurrentRutinas([]);
    setCurrentEvaluacion(null);
    setRoutinesByStudent({});
    setStudentActiveDays({});
    setStudentActiveRoutines({});

    if (isSupabaseConfigured()) {
      await clearAllStudentsFromSupabase();
    }

    await clearAllLocalAlumnos();
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

  // Payment Handlers (Guarda en localStorage y actualiza el alumno)
  const handleSavePayment = async (pagoData: Omit<PagoCuota, 'id' | 'created_at'>) => {
    try {
      const newPago: PagoCuota = {
        ...pagoData,
        id: `pago-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        created_at: new Date().toISOString(),
      };

      setPagos((prev) => {
        const updated = [newPago, ...prev.filter((p) => p.id !== newPago.id)];
        try {
          localStorage.setItem('fitpro_local_pagos', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      const target = alumnos.find((a) => a.id === pagoData.alumno_id);
      if (target) {
        const updatedAlumno: Alumno = {
          ...target,
          fecha_pago_cuota: pagoData.fecha_pago,
          fecha_vencimiento_cuota: pagoData.fecha_vencimiento,
          cuota_al_dia: true,
          ultimo_monto_pago: pagoData.monto,
          updated_at: new Date().toISOString(),
        };
        await handleEditStudent(updatedAlumno);
      }

      showToast('success', `Pago de $${pagoData.monto} registrado exitosamente`);
    } catch (err) {
      console.error('Error registrando pago:', err);
      showToast('error', 'Error al registrar el pago');
    }
  };

  const handleDeletePayment = async (pagoId: string) => {
    setPagos((prev) => {
      const updated = prev.filter((p) => p.id !== pagoId);
      try {
        localStorage.setItem('fitpro_local_pagos', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('info', 'Pago anulado correctamente');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-display font-bold text-white text-base">Iniciando FitPro Manager...</p>
          <span className="text-xs text-slate-500 font-mono">Cargando base de datos local</span>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, muestra la pantalla de login
  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} defaultEmail="jonalippo@gmail.com" />;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Header
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        userName={currentUser.name}
        onLogout={handleLogout}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-0 pt-5 pb-24 overflow-x-hidden">
        <div className="md:hidden flex items-center gap-1.5 mb-4 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs shadow-sm">
          <button
            onClick={() => setActiveView('home')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeView === 'home' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Inicio</span>
          </button>
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
          <button
            onClick={() => setActiveView('pagos')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeView === 'pagos' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Pagos</span>
          </button>
        </div>

        {/* Vista 0: Dashboard Home */}
        {activeView === 'home' && (
          <DashboardHome
            alumnos={alumnos}
            grupos={grupos}
            pagos={pagos}
            userName={currentUser.name}
            onNavigate={(view) => setActiveView(view)}
            onSelectStudent={(alm, view) => handleSelectStudent(alm, view)}
          />
        )}

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
            onClearAllStudents={handleClearAllStudents}
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
        {activeView === 'rutina' && (
          <div>
            {activeDockStudents.map((dockAlm) => {
              const isSelected = dockAlm.id === selectedStudentId;
              const studentRuts =
                routinesByStudent[dockAlm.id] ||
                (isSelected ? currentRutinas.filter((r) => r.alumno_id === dockAlm.id) : []);

              return (
                <div key={dockAlm.id} className={isSelected ? 'block' : 'hidden'}>
                  <RoutineSpreadsheet
                    alumno={dockAlm}
                    rutinas={studentRuts}
                    evaluacion={isSelected ? currentEvaluacion : null}
                    allAlumnos={alumnos}
                    savedActiveBlockId={studentActiveDays[dockAlm.id]}
                    onActiveBlockChange={(blockId) =>
                      setStudentActiveDays((prev) => ({ ...prev, [dockAlm.id]: blockId }))
                    }
                    savedActiveRoutineId={studentActiveRoutines[dockAlm.id]}
                    onActiveRoutineChange={(routineId) =>
                      setStudentActiveRoutines((prev) => ({ ...prev, [dockAlm.id]: routineId }))
                    }
                    onSaveRoutine={handleSaveRoutine}
                    onCreateNewRoutine={handleCreateNewRoutine}
                    onDeleteRoutine={handleDeleteRoutine}
                    onBackToAlumnos={() => setActiveView('alumnos')}
                    onSwitchStudent={(alm) => handleSelectStudent(alm, 'rutina')}
                    onOpenEvaluation={() => setActiveView('evaluacion')}
                  />
                </div>
              );
            })}

            {selectedStudent && !activeDockStudents.some((a) => a.id === selectedStudent.id) && (
              <RoutineSpreadsheet
                alumno={selectedStudent}
                rutinas={
                  routinesByStudent[selectedStudent.id] ||
                  currentRutinas.filter((r) => r.alumno_id === selectedStudent.id)
                }
                evaluacion={currentEvaluacion}
                allAlumnos={alumnos}
                savedActiveBlockId={studentActiveDays[selectedStudent.id]}
                onActiveBlockChange={(blockId) =>
                  setStudentActiveDays((prev) => ({ ...prev, [selectedStudent.id]: blockId }))
                }
                savedActiveRoutineId={studentActiveRoutines[selectedStudent.id]}
                onActiveRoutineChange={(routineId) =>
                  setStudentActiveRoutines((prev) => ({ ...prev, [selectedStudent.id]: routineId }))
                }
                onSaveRoutine={handleSaveRoutine}
                onCreateNewRoutine={handleCreateNewRoutine}
                onDeleteRoutine={handleDeleteRoutine}
                onBackToAlumnos={() => setActiveView('alumnos')}
                onSwitchStudent={(alm) => handleSelectStudent(alm, 'rutina')}
                onOpenEvaluation={() => setActiveView('evaluacion')}
              />
            )}
          </div>
        )}

        {/* View 4: Evaluación Clínica "El Iceberg" */}
        {activeView === 'evaluacion' && selectedStudent && (
          <div className="space-y-4 pb-24">
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

        {/* View 5: Pantalla de Pagos & Métricas Financieras */}
        {activeView === 'pagos' && (
          <PaymentsManager
            alumnos={alumnos}
            grupos={grupos}
            pagos={pagos}
            onSavePayment={handleSavePayment}
            onDeletePayment={handleDeletePayment}
          />
        )}
      </main>

      {/* Modo Sala: Fixed Bottom Dock */}
      <BottomDock
        activeStudents={activeDockStudents}
        selectedStudentId={selectedStudentId}
        onSelectStudent={(alm) => {
          handleSelectStudent(alm, 'rutina');
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
          onSaveEvaluacion={async (evalData: EvaluacionClinica) => {
            await handleSaveEvaluacion(evalData);
            setIsEvalModalOpen(false);
            showToast('success', 'Evaluación guardada');
          }}
        />
      )}

      {/* Supabase SQL Config Modal */}
      {isSupabaseModalOpen && (
        <SupabaseSqlModal
          isOpen={isSupabaseModalOpen}
          onClose={() => {
            setIsSupabaseModalOpen(false);
            setIsCloudConnected(isSupabaseConfigured());
          }}
        />
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-slate-800 text-white text-xs font-semibold shadow-2xl backdrop-blur animate-in slide-in-from-bottom-2">
          <span
            className={`w-2 h-2 rounded-full ${
              toastMessage.type === 'success'
                ? 'bg-emerald-400'
                : toastMessage.type === 'error'
                ? 'bg-rose-400'
                : toastMessage.type === 'warning'
                ? 'bg-amber-400'
                : 'bg-blue-400'
            }`}
          />
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}