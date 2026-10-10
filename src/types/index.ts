export type RolProfesor = 'admin_gimnasio' | 'profesor';

export interface Organizacion {
  id: string;
  nombre: string;
  plan_suscripcion: 'starter' | 'pro' | 'enterprise';
  max_profesores: number;
  created_at: string;
}

export interface Profesor {
  id: string;
  auth_user_id: string;
  organizacion_id: string;
  rol: RolProfesor;
  nombre: string;
  email: string;
}

export interface Grupo {
  id: string;
  profesor_id: string;
  organizacion_id: string;
  nombre_grupo: string;
  horario: string;
  descripcion?: string;
}

export type ZonaDolor =
  | 'cervical'
  | 'dorsal'
  | 'lumbar'
  | 'hombro_izq'
  | 'hombro_der'
  | 'codo_izq'
  | 'codo_der'
  | 'muñeca_izq'
  | 'muñeca_der'
  | 'cadera_izq'
  | 'cadera_der'
  | 'rodilla_izq'
  | 'rodilla_der'
  | 'tobillo_izq'
  | 'tobillo_der';

export type DecisionTerapeutica = 'ENTRENAR' | 'DERIVAR';

export type PatronMovimiento =
  | 'sentadilla'
  | 'bisagra'
  | 'empuje_horizontal'
  | 'empuje_vertical'
  | 'traccion_horizontal'
  | 'traccion_vertical'
  | 'lunge_unilateral'
  | 'anti_rotacion_core';

export type TipoCadena = 'CCC' | 'CCA' | 'MIXTA'; // Cadena Cinética Cerrada vs Abierta

export interface EvaluacionClinica {
  id: string;
  alumno_id: string;
  fecha: string;
  // 1. Presentación Actual
  objetivos_principales: string;
  sintomas_relevantes: string;
  dolor_eva: number; // 0 - 10
  zonas_dolor: ZonaDolor[];
  medicacion_actual?: string;
  restricciones_medicas?: string;
  // 2. Historia y Exposición
  historia_deportiva: string;
  nivel_sedentarismo: 'alto' | 'medio' | 'bajo';
  lesiones_previas: string;
  cirugias?: string;
  tratamientos_fisio_previos?: string;
  // 3. Capacidad Actual (Evaluación Física)
  movilidad_articular: string;
  patrones_movimiento: {
    patron: PatronMovimiento;
    calidad: 'optimo' | 'compensacion' | 'doloroso';
    observaciones: string;
  }[];
  control_motor_cadena: {
    ccc_score: 'bueno' | 'regular' | 'deficiente';
    cca_score: 'bueno' | 'regular' | 'deficiente';
    observaciones: string;
  };
  tolerancia_carga_estimada: 'baja' | 'moderada' | 'alta';
  // 4. Estilo de Vida y Contexto Biopsicosocial
  calidad_sueno: number; // 1-5
  nivel_estres: number; // 1-10
  recuperacion_percibida: 'rapida' | 'normal' | 'lenta';
  kinesiofobia_nivel: 'nula' | 'leve' | 'moderada' | 'alta'; // Miedo al movimiento
  expectativas_barreras: string;
  // 5. Decisión Terapéutica/Deportiva
  decision_conducta: DecisionTerapeutica;
  justificacion_clinica: string;
  alertas_biomecanicas_clave: string[];
}

export interface Alumno {
  id: string;
  profesor_id: string;
  organizacion_id: string;
  grupo_id: string;
  nombre: string;
  apellido: string;
  dni?: string;
  telefono: string;
  email?: string;
  direccion?: string;
  fecha_nacimiento: string;
  fecha_inicio: string; // Fecha de inicio/ingreso en el gimnasio
  estado_activo: boolean;

  // Contacto de Emergencia & Cobertura
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  contacto_emergencia_parentesco?: string;
  obra_social?: string;
  numero_afiliado?: string;
  grupo_sanguineo?: string;
  genero?: 'masculino' | 'femenino' | 'otro';
  objetivo_principal?: string;
  antecedentes_medicos?: string;

  // Apto Médico y Ocupación
  apto_medico_estado?: 'aprobado' | 'pendiente' | 'vencido';
  apto_medico_vencimiento?: string;
  ocupacion?: string;
  notas_admision?: string;

  // Cuota / Membresía Mensual
  fecha_pago_cuota?: string; // Fecha en que abonó YYYY-MM-DD
  fecha_vencimiento_cuota?: string; // Fecha de vencimiento a mes completo YYYY-MM-DD
  cuota_al_dia?: boolean; // Estado de la cuota: true (activo/al día), false (debe)
  ultimo_monto_pago?: number; // Monto abonado en la última cuota

  // Estado Biomecánico & Dolor
  alerta_lesion_activa?: string;
  zona_dolor_principal?: ZonaDolor;
  dolor_eva_actual?: number;
  decision_actual?: DecisionTerapeutica;

  created_at: string;
  updated_at: string;
}

export interface EjercicioRutina {
  id: string;
  bloque_id: string;
  orden: number;
  ejercicio: string;
  series: string;
  repeticiones: string;
  carga?: string; // Carga / Peso P1 (Semana 1-2 / Fase Inicial)
  carga_p2?: string; // Carga / Peso P2 (Semana 3-4 / Progresión)
  pausa: string;
  rpe_objetivo?: string;
  tipo_cadena?: TipoCadena;
  observaciones_dosificacion: string;
  video_url?: string;
  es_separador?: boolean; // Fila vacía / separador visual entre bloques de ejercicios
  subtitulo_bloque?: string; // Título opcional del separador (ej: "Bloque 2: Zona Media", "Miembro Inferior")
}

export interface BloqueRutina {
  id: string;
  rutina_id: string;
  nombre_sub_pestana: string; // ej: "Día 1: Metabólico + Empuje"
  orden: number;
  ejercicios: EjercicioRutina[];
}

export interface Rutina {
  id: string;
  alumno_id: string;
  nombre_rutina: string; // ej: "Rutina 1: Fase Adaptación Anatómica"
  fecha_inicio: string;
  fecha_cambio: string; // vencimiento previsto
  activa: boolean;
  orden: number;
  notas_generales?: string;
  bloques: BloqueRutina[];
  created_at: string;
  updated_at: string;
}

export interface SeguimientoDiario {
  id: string;
  alumno_id: string;
  fecha: string;
  rpe_fatiga: number; // 1-10 (Borg CR-10)
  nivel_dolor: number; // 0-10 EVA
  tolerancia_carga: 'muy_buena' | 'adecuada' | 'fatiga_excesiva' | 'sintomas_aumentados';
  notas: string;
  created_at: string;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingMutationsCount: number;
  lastSyncedAt: string | null;
  status: 'synced' | 'pending' | 'syncing' | 'offline';
}

export interface LibraryExercise {
  id?: string;
  nombre: string;
  patron: PatronMovimiento;
  cadena?: TipoCadena;
  dificultad?: 'inicial' | 'intermedio' | 'avanzado';
  musculos_principales: string;
  precaucion_clinica?: string;
  ajuste_biomecanico_sugerido: string;
}

export interface PagoCuota {
  id: string;
  alumno_id: string;
  alumno_nombre: string;
  grupo_id?: string;
  grupo_nombre?: string;
  monto: number;
  fecha_pago: string; // YYYY-MM-DD
  fecha_vencimiento: string; // YYYY-MM-DD
  mes_correspondiente: string; // YYYY-MM
  metodo_pago?: string; // 'efectivo' | 'transferencia' | 'tarjeta' | 'otro'
  notas?: string;
  created_at: string;
}