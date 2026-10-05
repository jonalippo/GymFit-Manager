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

// Initial Seed Data
export async function seedInitialDataIfEmpty() {
  const db = await openDB();
  const tx = db.transaction(['organizaciones', 'alumnos'], 'readonly');
  const alumnosStore = tx.objectStore('alumnos');
  const countReq = alumnosStore.count();

  const count = await new Promise<number>((res) => {
    countReq.onsuccess = () => res(countReq.result);
    countReq.onerror = () => res(0);
  });

  if (count > 0) return; // already populated

  const writeTx = db.transaction(
    ['organizaciones', 'profesores', 'grupos', 'alumnos', 'evaluaciones_clinicas', 'rutinas', 'seguimiento_diario'],
    'readwrite'
  );

  const org: Organizacion = {
    id: 'org-1',
    nombre: 'FitPro Centro de Biomecánica & Rendimiento',
    plan_suscripcion: 'pro',
    max_profesores: 8,
    created_at: new Date().toISOString()
  };

  const prof1: Profesor = {
    id: 'prof-1',
    auth_user_id: 'auth-user-marcos',
    organizacion_id: 'org-1',
    rol: 'admin_gimnasio',
    nombre: 'Jonatan Lippo',
    email: 'marcos@fitpro.io'
  };

  const grupos: Grupo[] = [
    {
      id: 'grp-1',
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      nombre_grupo: 'Turno Mañana: Readaptación Biomecánica',
      horario: '08:00 - 10:00 hs',
      descripcion: 'Enfoque en dolor lumbar, control motor y descompresión raquídea.'
    },
    {
      id: 'grp-2',
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      nombre_grupo: 'Turno Tarde: Fuerza & Salud Articular',
      horario: '16:00 - 18:00 hs',
      descripcion: 'Fuerza hipertrofia con ajustes en rangos angulares seguros.'
    },
    {
      id: 'grp-3',
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      nombre_grupo: 'Turno Noche: Atletas & Acondicionamiento',
      horario: '19:00 - 21:00 hs',
      descripcion: 'Potencia y cadena cinética cerrada con alta demanda metabólica.'
    }
  ];

  const alumnos: Alumno[] = [
    {
      id: 'alm-1',
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      grupo_id: 'grp-1',
      nombre: 'María',
      apellido: 'Gómez',
      dni: '33.842.119',
      telefono: '+5491145678901',
      email: 'maria.gomez@email.com',
      direccion: 'Av. Cabildo 2450, Piso 4 B, CABA',
      fecha_nacimiento: '1988-04-12',
      fecha_inicio: '2024-03-01',
      estado_activo: true,
      contacto_emergencia_nombre: 'Mariano Torres (Esposo)',
      contacto_emergencia_telefono: '+5491145678999',
      contacto_emergencia_parentesco: 'Cónyuge',
      obra_social: 'OSDE 310 - N° 45892110',
      grupo_sanguineo: 'A+',
      apto_medico_estado: 'aprobado',
      apto_medico_vencimiento: '2027-02-28',
      ocupacion: 'Contadora (8 hrs sentada / oficina)',
      notas_admision: 'Prioridad de readaptación funcional lumbar y descompresión raquídea.',
      alerta_lesion_activa: 'Discopatía L4-L5 (protrusión focal). Evitar compresión axial con carga vertical.',
      zona_dolor_principal: 'lumbar',
      dolor_eva_actual: 3,
      decision_actual: 'ENTRENAR',
      created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'alm-2',
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      grupo_id: 'grp-1',
      nombre: 'Carlos',
      apellido: 'Rossi',
      dni: '29.410.874',
      telefono: '+5491133221100',
      email: 'carlos.rossi@email.com',
      direccion: 'Juramento 1840, CABA',
      fecha_nacimiento: '1982-11-20',
      fecha_inicio: '2024-04-10',
      estado_activo: true,
      contacto_emergencia_nombre: 'Laura Rossi (Hermana)',
      contacto_emergencia_telefono: '+5491133221155',
      contacto_emergencia_parentesco: 'Hermana',
      obra_social: 'Swiss Medical SMG20',
      grupo_sanguineo: '0+',
      apto_medico_estado: 'aprobado',
      apto_medico_vencimiento: '2027-04-10',
      ocupacion: 'Arquitecto de obra',
      notas_admision: 'Evaluación de control de valgo de rodilla y estabilización de cadera.',
      alerta_lesion_activa: 'Condropatía rotuliana rodilla derecha grado II. Priorizar CCC y ángulo tibia vertical.',
      zona_dolor_principal: 'rodilla_der',
      dolor_eva_actual: 2,
      decision_actual: 'ENTRENAR',
      created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'alm-3',
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      grupo_id: 'grp-2',
      nombre: 'Valentina',
      apellido: 'Paz',
      dni: '38.991.205',
      telefono: '+5491177889944',
      email: 'valentina.paz@email.com',
      direccion: 'Amenábar 920, Belgrano, CABA',
      fecha_nacimiento: '1995-07-08',
      fecha_inicio: '2024-05-15',
      estado_activo: true,
      contacto_emergencia_nombre: 'Esteban Paz (Padre)',
      contacto_emergencia_telefono: '+5491177889900',
      contacto_emergencia_parentesco: 'Padre',
      obra_social: 'Medifé Plata',
      grupo_sanguineo: 'B+',
      apto_medico_estado: 'aprobado',
      apto_medico_vencimiento: '2027-05-15',
      ocupacion: 'Diseñadora UX / Runner amateur',
      notas_admision: 'Planificación de fuerza para media maratón sin sobrecarga en sóleo/aquiles.',
      alerta_lesion_activa: 'Sobrecarga tríceps sural / tendón de Aquiles izquierdo. Kinesiofobia moderada.',
      zona_dolor_principal: 'tobillo_izq',
      dolor_eva_actual: 2,
      decision_actual: 'ENTRENAR',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'alm-4',
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      grupo_id: 'grp-2',
      nombre: 'Agustín',
      apellido: 'Méndez',
      dni: '35.612.980',
      telefono: '+5491155443322',
      email: 'agustin.m@email.com',
      direccion: 'Olazábal 3200, CABA',
      fecha_nacimiento: '1991-02-14',
      fecha_inicio: '2024-06-01',
      estado_activo: true,
      contacto_emergencia_nombre: 'Romina Méndez (Esposa)',
      contacto_emergencia_telefono: '+5491155443399',
      contacto_emergencia_parentesco: 'Cónyuge',
      obra_social: 'Galeno 220',
      grupo_sanguineo: '0-',
      apto_medico_estado: 'pendiente',
      apto_medico_vencimiento: '2026-11-30',
      ocupacion: 'Ingeniero de Software',
      notas_admision: 'Restringir abducción forzada en cadena abierta; fortalecer serrato y rotadores externos.',
      alerta_lesion_activa: 'Pinzamiento subacromial hombro derecho. Restringir abducción >90° en CCA.',
      zona_dolor_principal: 'hombro_der',
      dolor_eva_actual: 5,
      decision_actual: 'ENTRENAR',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const evalMaria: EvaluacionClinica = {
    id: 'eval-1',
    alumno_id: 'alm-1',
    fecha: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    objetivos_principales: 'Ganar fuerza en miembros inferiores y core sin reincidir en dolor ciático o rigidez matutina.',
    sintomas_relevantes: 'Molestia sorda en región lumbosacra irradiada levemente a glúteo derecho al estar de pie prolongado.',
    dolor_eva: 3,
    zonas_dolor: ['lumbar'],
    medicacion_actual: 'Paracetamol 500mg SOS (ocasional tras jornadas de oficina).',
    restricciones_medicas: 'Prohibición de flexiones lumbares forzadas bajo carga externa (evitar peso muerto clásico o abdominales crunch).',
    historia_deportiva: 'Ex jugadora de hockey sobre césped amateur. 4 años de inactividad por maternidad y trabajo de oficina.',
    nivel_sedentarismo: 'alto',
    lesiones_previas: 'Lumbalgia aguda con resonancia magnética constatando protrusión L4-L5 hace 8 meses.',
    cirugias: 'Ninguna',
    tratamientos_fisio_previos: '15 sesiones de kinesioterapia con descompresión pasiva y magnetoterapia.',
    movilidad_articular: 'Flexión dorsal de tobillo 14cm (buena). Rotación interna de cadera limitada bilateralmente (18°).',
    patrones_movimiento: [
      {
        patron: 'sentadilla',
        calidad: 'compensacion',
        observaciones: 'Tendencia al butt-wink a los 85° de flexión; corregida con talones sobre cuña.'
      },
      {
        patron: 'bisagra',
        calidad: 'compensacion',
        observaciones: 'Inicia con flexión dorsal en vez de traslación pélvica; responde a feedback táctil.'
      },
      {
        patron: 'empuje_horizontal',
        calidad: 'optimo',
        observaciones: 'Buen control escapular.'
      },
      {
        patron: 'anti_rotacion_core',
        calidad: 'compensacion',
        observaciones: 'Dificultad en disociación de caja torácica vs pelvis.'
      }
    ],
    control_motor_cadena: {
      ccc_score: 'bueno',
      cca_score: 'regular',
      observaciones: 'En cadena cerrada tolera cargas con buena co-contracción glúteo-abdominal.'
    },
    tolerancia_carga_estimada: 'moderada',
    calidad_sueno: 3,
    nivel_estres: 7,
    recuperacion_percibida: 'normal',
    kinesiofobia_nivel: 'moderada',
    expectativas_barreras: 'Miedo a que el levantamiento de peso vuelva a "romper el disco". Requiere educación en neurobiología del dolor.',
    decision_conducta: 'ENTRENAR',
    justificacion_clinica: 'Presenta dolor crónico no inflamatorio con kinesiofobia. Apta para entrenamiento de fuerza progresiva adaptando palancas y vectores de cizalla.',
    alertas_biomecanicas_clave: [
      'Priorizar vectores anteroposteriores (Hip Thrust, Puente de glúteos) sobre axiales verticales.',
      'Sustituir press militar vertical por Landmine Press a 60°.',
      'Introducir pilar de McGill (Bird-Dog + Plancha lateral + Curl-up modificado).'
    ]
  };

  const rutinaMaria: Rutina = {
    id: 'rut-1',
    alumno_id: 'alm-1',
    nombre_rutina: 'Rutina Fase 1: Descompresión y Fortalecimiento Lumbo-Pélvico',
    fecha_inicio: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
    fecha_cambio: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], // vence en 5 días
    activa: true,
    orden: 1,
    notas_generales: 'Priorizar ritmo excéntrico 3 segundos. No buscar el fallo muscular; mantener RIR 2-3 en todo momento.',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    bloques: [
      {
        id: 'blk-1',
        rutina_id: 'rut-1',
        nombre_sub_pestana: 'Día 1: Cadena Posterior + Empuje Seguro',
        orden: 1,
        ejercicios: [
          {
            id: 'ej-1',
            bloque_id: 'blk-1',
            orden: 1,
            ejercicio: 'Puente de Glúteos Unilateral con Apoyo Escapular',
            series: '3',
            repeticiones: '10 por pierna',
            pausa: '60s',
            rpe_objetivo: '7',
            tipo_cadena: 'CCC',
            observaciones_dosificacion: 'Mantener 2 seg de isometría arriba. Cuidar no arquear lumbar.'
          },
          {
            id: 'ej-2',
            bloque_id: 'blk-1',
            orden: 2,
            ejercicio: 'Press de Banca Plano con Mancuernas (Agarre Neutro)',
            series: '3',
            repeticiones: '10-12',
            pausa: '75s',
            rpe_objetivo: '7.5',
            tipo_cadena: 'CCA',
            observaciones_dosificacion: 'Pies bien plantados. No despegar escápulas del banco.'
          },
          {
            id: 'ej-3',
            bloque_id: 'blk-1',
            orden: 3,
            ejercicio: 'Remo en Polea Baja con Agarre Estrecho',
            series: '3',
            repeticiones: '12',
            pausa: '60s',
            rpe_objetivo: '7',
            tipo_cadena: 'CCA',
            observaciones_dosificacion: 'Iniciar con retracción escapular; tronco inmóvil a 90°.'
          },
          {
            id: 'ej-4',
            bloque_id: 'blk-1',
            orden: 4,
            ejercicio: 'Press Pallof Antirrotacional con Banda',
            series: '3',
            repeticiones: '8 rep x 4s pausa',
            pausa: '45s',
            rpe_objetivo: '6.5',
            tipo_cadena: 'CCC',
            observaciones_dosificacion: 'Exhalar al extender brazos al frente; fijar pelvis.'
          },
          {
            id: 'ej-5',
            bloque_id: 'blk-1',
            orden: 5,
            ejercicio: 'Bird-Dog (Perro de Caza) con Control Pélvico',
            series: '3',
            repeticiones: '6 por lado',
            pausa: '45s',
            rpe_objetivo: '6',
            tipo_cadena: 'CCC',
            observaciones_dosificacion: 'Vasito de agua imaginario en la zona lumbar sin derramar.'
          }
        ]
      },
      {
        id: 'blk-2',
        rutina_id: 'rut-1',
        nombre_sub_pestana: 'Día 2: Dominancia Rodilla + Tracción y Core',
        orden: 2,
        ejercicios: [
          {
            id: 'ej-6',
            bloque_id: 'blk-2',
            orden: 1,
            ejercicio: 'Sentadilla en Caja (Box Squat) con Mancuerna al Pecho',
            series: '3',
            repeticiones: '10',
            pausa: '90s',
            rpe_objetivo: '7',
            tipo_cadena: 'CCC',
            observaciones_dosificacion: 'Tocar caja suavemente y subir de forma explosiva.'
          },
          {
            id: 'ej-7',
            bloque_id: 'blk-2',
            orden: 2,
            ejercicio: 'Jalón al Pecho en Polea (Agarre Neutro)',
            series: '3',
            repeticiones: '10-12',
            pausa: '75s',
            rpe_objetivo: '7.5',
            tipo_cadena: 'CCA',
            observaciones_dosificacion: 'Pecho al frente sin balanceo del tronco.'
          },
          {
            id: 'ej-8',
            bloque_id: 'blk-2',
            orden: 3,
            ejercicio: 'Hip Thrust con Mancuerna sobre Pelvis',
            series: '3',
            repeticiones: '12',
            pausa: '90s',
            rpe_objetivo: '8',
            tipo_cadena: 'CCC',
            observaciones_dosificacion: 'Mentón al pecho; contracción máxima de glúteo 2 segundos.'
          },
          {
            id: 'ej-9',
            bloque_id: 'blk-2',
            orden: 4,
            ejercicio: 'Plancha Lateral sobre Antebrazo',
            series: '3',
            repeticiones: '20 segundos por lado',
            pausa: '45s',
            rpe_objetivo: '7',
            tipo_cadena: 'CCC',
            observaciones_dosificacion: 'Apoyar rodillas si hay molestia en hombro de apoyo.'
          }
        ]
      }
    ]
  };

  const seguimientoMaria: SeguimientoDiario = {
    id: 'seg-1',
    alumno_id: 'alm-1',
    fecha: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    rpe_fatiga: 6.5,
    nivel_dolor: 2,
    tolerancia_carga: 'muy_buena',
    notas: 'Completó Día 1 sin dolor radicular. Refiere mayor seguridad mental en puente de glúteos.',
    created_at: new Date().toISOString()
  };

  // Rutina de Carlos Rossi (condropatía)
  const rutinaCarlos: Rutina = {
    id: 'rut-2',
    alumno_id: 'alm-2',
    nombre_rutina: 'Rutina Rodilla Segura: Vector de Cadera & CCC',
    fecha_inicio: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    fecha_cambio: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
    activa: true,
    orden: 1,
    notas_generales: 'Cuidar valgo dinámico de rodilla derecha. Mantener tibias verticales en ejercicios de sentadilla.',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    bloques: [
      {
        id: 'blk-c1',
        rutina_id: 'rut-2',
        nombre_sub_pestana: 'Día A: Glúteo & Cadena Posterior',
        orden: 1,
        ejercicios: [
          {
            id: 'ej-c1',
            bloque_id: 'blk-c1',
            orden: 1,
            ejercicio: 'Peso Muerto Rumano con Mancuernas (RDL)',
            series: '4',
            repeticiones: '8-10',
            pausa: '90s',
            rpe_objetivo: '7.5',
            tipo_cadena: 'CCC',
            observaciones_dosificacion: 'Enfocar en cadera atrás; tibias perpendiculares.'
          },
          {
            id: 'ej-c2',
            bloque_id: 'blk-c1',
            orden: 2,
            ejercicio: 'Prensa Inclinada 45° Pies Altos',
            series: '3',
            repeticiones: '12',
            pausa: '90s',
            rpe_objetivo: '8',
            tipo_cadena: 'CCC',
            observaciones_dosificacion: 'No superar 90° de flexión de rodilla para no estresar rótula.'
          }
        ]
      }
    ]
  };

  writeTx.objectStore('organizaciones').put(org);
  writeTx.objectStore('profesores').put(prof1);
  grupos.forEach((g) => writeTx.objectStore('grupos').put(g));
  alumnos.forEach((a) => writeTx.objectStore('alumnos').put(a));
  writeTx.objectStore('evaluaciones_clinicas').put(evalMaria);
  writeTx.objectStore('rutinas').put(rutinaMaria);
  writeTx.objectStore('rutinas').put(rutinaCarlos);
  writeTx.objectStore('seguimiento_diario').put(seguimientoMaria);

  return new Promise<void>((resolve, reject) => {
    writeTx.oncomplete = () => resolve();
    writeTx.onerror = () => reject(writeTx.error);
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
