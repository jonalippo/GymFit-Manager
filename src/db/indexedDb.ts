import {
  Alumno,
  EvaluacionClinica,
  Grupo,
  Organizacion,
  Profesor,
  Rutina,
  SeguimientoDiario,
  SyncStatus
} from '../types';

const DB_NAME = 'FitProManagerDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('organizaciones')) {
        db.createObjectStore('organizaciones', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('profesores')) {
        db.createObjectStore('profesores', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('grupos')) {
        const store = db.createObjectStore('grupos', { keyPath: 'id' });
        store.createIndex('profesor_id', 'profesor_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('alumnos')) {
        const store = db.createObjectStore('alumnos', { keyPath: 'id' });
        store.createIndex('profesor_id', 'profesor_id', { unique: false });
        store.createIndex('grupo_id', 'grupo_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('evaluaciones_clinicas')) {
        const store = db.createObjectStore('evaluaciones_clinicas', { keyPath: 'id' });
        store.createIndex('alumno_id', 'alumno_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('rutinas')) {
        const store = db.createObjectStore('rutinas', { keyPath: 'id' });
        store.createIndex('alumno_id', 'alumno_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('seguimiento_diario')) {
        const store = db.createObjectStore('seguimiento_diario', { keyPath: 'id' });
        store.createIndex('alumno_id', 'alumno_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// Initial Seed Data (Solo crea Organización y Grupos, CERO alumnos hardcodeados)
export async function seedInitialDataIfEmpty() {
  const db = await openDB();
  const tx = db.transaction(['organizaciones', 'grupos'], 'readonly');
  const gruposStore = tx.objectStore('grupos');
  const countReq = gruposStore.count();

  const count = await new Promise<number>((res) => {
    countReq.onsuccess = () => res(countReq.result);
    countReq.onerror = () => res(0);
  });

  if (count > 0) return; // ya inicializado

  const writeTx = db.transaction(
    ['organizaciones', 'profesores', 'grupos'],
    'readwrite'
  );

  const org: Organizacion = {
    id: 'org-1',
    nombre: 'Centro de Entrenamiento & Salud',
    plan_suscripcion: 'pro',
    max_profesores: 8,
    created_at: new Date().toISOString()
  };

  const prof1: Profesor = {
    id: 'prof-1',
    auth_user_id: 'auth-user-admin',
    organizacion_id: 'org-1',
    rol: 'admin_gimnasio',
    nombre: 'Profesor Principal',
    email: 'entrenador@gymfit.com'
  };

  const grupos: Grupo[] = [
    {
      id: 'grp-1',
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      nombre_grupo: 'Turno Mañana',
      horario: '08:00 - 10:00 hs',
      descripcion: 'Entrenamiento general y readaptación.'
    },
    {
      id: 'grp-2',
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      nombre_grupo: 'Turno Tarde',
      horario: '16:00 - 18:00 hs',
      descripcion: 'Fuerza, hipertrofia y acondicionamiento.'
    },
    {
      id: 'grp-3',
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      nombre_grupo: 'Turno Noche',
      horario: '19:00 - 21:00 hs',
      descripcion: 'Potencia y rendimiento físico.'
    }
  ];

  writeTx.objectStore('organizaciones').put(org);
  writeTx.objectStore('profesores').put(prof1);
  grupos.forEach((g) => writeTx.objectStore('grupos').put(g));

  return new Promise<void>((resolve, reject) => {
    writeTx.oncomplete = () => resolve();
    writeTx.onerror = () => reject(writeTx.error);
  });
}

// Limpiar todos los alumnos y datos locales para comenzar desde cero
export async function clearAllLocalAlumnos(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['alumnos', 'evaluaciones_clinicas', 'rutinas', 'seguimiento_diario'], 'readwrite');
  tx.objectStore('alumnos').clear();
  tx.objectStore('evaluaciones_clinicas').clear();
  tx.objectStore('rutinas').clear();
  tx.objectStore('seguimiento_diario').clear();

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

// Event Dispatcher for instantaneous reactive multi-view updates
type DBListener = () => void;
const listeners: Set<DBListener> = new Set();

export function subscribeToDBChanges(listener: DBListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyDBChanged() {
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      console.error('Error notifying DB listener', e);
    }
  });
}

// Data Access Methods
export async function getAlumnos(): Promise<Alumno[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('alumnos', 'readonly');
    const store = tx.objectStore('alumnos');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getAlumnoById(id: string): Promise<Alumno | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('alumnos', 'readonly');
    const store = tx.objectStore('alumnos');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAlumno(alumno: Alumno): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['alumnos', 'sync_queue'], 'readwrite');
  alumno.updated_at = new Date().toISOString();
  tx.objectStore('alumnos').put(alumno);
  tx.objectStore('sync_queue').add({
    table: 'alumnos',
    action: 'upsert',
    record_id: alumno.id,
    timestamp: new Date().toISOString(),
    payload: alumno
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getGrupos(): Promise<Grupo[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('grupos', 'readonly');
    const store = tx.objectStore('grupos');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveGrupo(grupo: Grupo): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('grupos', 'readwrite');
  tx.objectStore('grupos').put(grupo);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteGrupo(grupoId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['grupos', 'alumnos'], 'readwrite');
  tx.objectStore('grupos').delete(grupoId);

  // Reassign or clear group for affected students
  const alumnosStore = tx.objectStore('alumnos');
  const req = alumnosStore.getAll();
  req.onsuccess = () => {
    const list = req.result as Alumno[];
    list.forEach((alm) => {
      if (alm.grupo_id === grupoId) {
        alm.grupo_id = '';
        alumnosStore.put(alm);
      }
    });
  };

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getRutinasByAlumno(alumnoId: string): Promise<Rutina[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rutinas', 'readonly');
    const store = tx.objectStore('rutinas');
    const index = store.index('alumno_id');
    const req = index.getAll(alumnoId);
    req.onsuccess = () => {
      const results = (req.result || []) as Rutina[];
      results.sort((a, b) => (b.activa ? 1 : 0) - (a.activa ? 1 : 0));
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveRutina(rutina: Rutina): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['rutinas', 'sync_queue'], 'readwrite');
  rutina.updated_at = new Date().toISOString();
  tx.objectStore('rutinas').put(rutina);
  tx.objectStore('sync_queue').add({
    table: 'rutinas',
    action: 'upsert',
    record_id: rutina.id,
    timestamp: new Date().toISOString(),
    payload: rutina
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getEvaluacionClinica(alumnoId: string): Promise<EvaluacionClinica | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('evaluaciones_clinicas', 'readonly');
    const store = tx.objectStore('evaluaciones_clinicas');
    const index = store.index('alumno_id');
    const req = index.getAll(alumnoId);
    req.onsuccess = () => {
      const items = req.result || [];
      if (items.length > 0) {
        items.sort((a: EvaluacionClinica, b: EvaluacionClinica) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        resolve(items[0]);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveEvaluacionClinica(evaluacion: EvaluacionClinica): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['evaluaciones_clinicas', 'alumnos', 'sync_queue'], 'readwrite');
  tx.objectStore('evaluaciones_clinicas').put(evaluacion);

  // Sync back to student top-level badges for instant floor visibility
  const alumnoReq = tx.objectStore('alumnos').get(evaluacion.alumno_id);
  alumnoReq.onsuccess = () => {
    const alumno = alumnoReq.result as Alumno | undefined;
    if (alumno) {
      alumno.dolor_eva_actual = evaluacion.dolor_eva;
      alumno.zona_dolor_principal = evaluacion.zonas_dolor[0];
      alumno.decision_actual = evaluacion.decision_conducta;
      if (evaluacion.alertas_biomecanicas_clave.length > 0) {
        alumno.alerta_lesion_activa = evaluacion.alertas_biomecanicas_clave[0];
      }
      alumno.updated_at = new Date().toISOString();
      tx.objectStore('alumnos').put(alumno);
    }
  };

  tx.objectStore('sync_queue').add({
    table: 'evaluaciones_clinicas',
    action: 'upsert',
    record_id: evaluacion.id,
    timestamp: new Date().toISOString(),
    payload: evaluacion
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSeguimientoDiario(alumnoId: string): Promise<SeguimientoDiario[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('seguimiento_diario', 'readonly');
    const store = tx.objectStore('seguimiento_diario');
    const index = store.index('alumno_id');
    const req = index.getAll(alumnoId);
    req.onsuccess = () => {
      const items = (req.result || []) as SeguimientoDiario[];
      items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveSeguimientoDiario(seg: SeguimientoDiario): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['seguimiento_diario', 'alumnos', 'sync_queue'], 'readwrite');
  tx.objectStore('seguimiento_diario').put(seg);

  const alumnoReq = tx.objectStore('alumnos').get(seg.alumno_id);
  alumnoReq.onsuccess = () => {
    const alumno = alumnoReq.result as Alumno | undefined;
    if (alumno) {
      alumno.dolor_eva_actual = seg.nivel_dolor;
      alumno.updated_at = new Date().toISOString();
      tx.objectStore('alumnos').put(alumno);
    }
  };

  tx.objectStore('sync_queue').add({
    table: 'seguimiento_diario',
    action: 'insert',
    record_id: seg.id,
    timestamp: new Date().toISOString(),
    payload: seg
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteAlumno(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['alumnos', 'rutinas', 'evaluaciones_clinicas', 'seguimiento_diario', 'sync_queue'], 'readwrite');
  tx.objectStore('alumnos').delete(id);

  // Borrar en cascada rutinas asociadas
  const rutStore = tx.objectStore('rutinas');
  const rutIdx = rutStore.index('alumno_id');
  const rutReq = rutIdx.getAllKeys(id);
  rutReq.onsuccess = () => {
    (rutReq.result || []).forEach((k) => rutStore.delete(k));
  };

  // Borrar en cascada evaluaciones clínicas asociadas
  const evalStore = tx.objectStore('evaluaciones_clinicas');
  const evalIdx = evalStore.index('alumno_id');
  const evalReq = evalIdx.getAllKeys(id);
  evalReq.onsuccess = () => {
    (evalReq.result || []).forEach((k) => evalStore.delete(k));
  };

  // Borrar en cascada seguimientos diarios asociados
  const segStore = tx.objectStore('seguimiento_diario');
  const segIdx = segStore.index('alumno_id');
  const segReq = segIdx.getAllKeys(id);
  segReq.onsuccess = () => {
    (segReq.result || []).forEach((k) => segStore.delete(k));
  };

  tx.objectStore('sync_queue').add({
    table: 'alumnos',
    action: 'delete',
    record_id: id,
    timestamp: new Date().toISOString()
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteRutina(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['rutinas', 'sync_queue'], 'readwrite');
  tx.objectStore('rutinas').delete(id);
  tx.objectStore('sync_queue').add({
    table: 'rutinas',
    action: 'delete',
    record_id: id,
    timestamp: new Date().toISOString()
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingMutationsCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const req = store.count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => resolve(0);
  });
}

export async function clearSyncQueue(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  tx.objectStore('sync_queue').clear();
  return new Promise((resolve) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
  });
}