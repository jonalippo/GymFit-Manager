export const SUPABASE_SQL_SCRIPT = `-- ==============================================================================
-- FITPRO MANAGER - ESQUEMA SAAS MULTI-TENANT & POLÍTICAS RLS (SUPABASE / POSTGRESQL)
-- Arquitectura de Demanda vs. Capacidad vs. Respuesta & Historial Clínico
-- Cumplimiento GDPR / HIPAA: Cifrado en reposo, Aislamiento RLS por Tenant y Cero Fuga
-- ==============================================================================

-- 1. EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLA: ORGANIZACIONES (GIMNASIOS / CENTROS DE RENDIMIENTO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.organizaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    plan_suscripcion VARCHAR(50) NOT NULL DEFAULT 'starter' CHECK (plan_suscripcion IN ('starter', 'pro', 'enterprise')),
    max_profesores INTEGER NOT NULL DEFAULT 3,
    configuracion JSONB DEFAULT '{"tema": "oscuro", "notificaciones": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. TABLA: PROFESORES (VINCULADOS A AUTH.USERS DE SUPABASE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profesores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
    rol VARCHAR(50) NOT NULL DEFAULT 'profesor' CHECK (rol IN ('admin_gimnasio', 'profesor')),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_profesores_auth UNIQUE (auth_user_id)
);

-- ==============================================================================
-- 4. TABLA: GRUPOS (TURNOS, NIVELES Y ACTIVIDADES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
    profesor_id UUID NOT NULL REFERENCES public.profesores(id) ON DELETE RESTRICT,
    nombre_grupo VARCHAR(100) NOT NULL,
    horario VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. TABLA: ALUMNOS (PACIENTES / ATLETAS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.alumnos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
    profesor_id UUID NOT NULL REFERENCES public.profesores(id) ON DELETE RESTRICT,
    grupo_id UUID REFERENCES public.grupos(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(30),
    telefono VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    direccion TEXT,
    fecha_nacimiento DATE NOT NULL,
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    estado_activo BOOLEAN NOT NULL DEFAULT true,

    -- Contacto de Emergencia & Cobertura de Salud
    contacto_emergencia_nombre VARCHAR(100),
    contacto_emergencia_telefono VARCHAR(50),
    contacto_emergencia_parentesco VARCHAR(50),
    obra_social VARCHAR(100),
    numero_afiliado VARCHAR(50),
    grupo_sanguineo VARCHAR(10),
    genero VARCHAR(20) DEFAULT 'masculino',
    objetivo_principal TEXT,
    antecedentes_medicos TEXT,

    -- Certificado de Apto Médico y Contexto Laboral
    apto_medico_estado VARCHAR(20) DEFAULT 'pendiente' CHECK (apto_medico_estado IN ('aprobado', 'pendiente', 'vencido')),
    apto_medico_vencimiento DATE,
    ocupacion VARCHAR(150),
    notas_admision TEXT,

    -- Control de Cuota Mensual
    fecha_pago_cuota DATE,
    fecha_vencimiento_cuota DATE,
    cuota_al_dia BOOLEAN NOT NULL DEFAULT true,

    -- Estado Biomecánico & Dolor
    alerta_lesion_activa TEXT,
    zona_dolor_principal VARCHAR(50),
    dolor_eva_actual NUMERIC(3,1) DEFAULT 0.0 CHECK (dolor_eva_actual >= 0 AND dolor_eva_actual <= 10),
    decision_actual VARCHAR(50) DEFAULT 'ENTRENAR' CHECK (decision_actual IN ('ENTRENAR', 'ADAPTAR/COLABORAR', 'DERIVAR')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. TABLA: EVALUACIONES CLÍNICAS ("EL ICEBERG" - 5 PILARES BIOPSICOSOCIALES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.evaluaciones_clinicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Pilar 1: Presentación Actual
    objetivos_principales TEXT NOT NULL,
    sintomas_relevantes TEXT NOT NULL,
    dolor_eva INTEGER NOT NULL CHECK (dolor_eva >= 0 AND dolor_eva <= 10),
    zonas_dolor JSONB NOT NULL DEFAULT '[]'::jsonb,
    medicacion_actual TEXT,
    restricciones_medicas TEXT,
    
    -- Pilar 2: Historia y Exposición
    historia_deportiva TEXT NOT NULL,
    nivel_sedentarismo VARCHAR(20) NOT NULL CHECK (nivel_sedentarismo IN ('alto', 'medio', 'bajo')),
    lesiones_previas TEXT NOT NULL,
    cirugias TEXT,
    tratamientos_fisio_previos TEXT,
    
    -- Pilar 3: Capacidad Actual (Evaluación Física & Biomecánica)
    movilidad_articular TEXT,
    patrones_movimiento JSONB NOT NULL DEFAULT '[]'::jsonb, -- sentadilla, bisagra, empujes, etc.
    control_motor_cadena JSONB NOT NULL DEFAULT '{"ccc_score":"bueno","cca_score":"bueno"}'::jsonb,
    tolerancia_carga_estimada VARCHAR(20) NOT NULL CHECK (tolerancia_carga_estimada IN ('baja', 'moderada', 'alta')),
    
    -- Pilar 4: Estilo de Vida y Contexto Biopsicosocial
    calidad_sueno INTEGER NOT NULL CHECK (calidad_sueno >= 1 AND calidad_sueno <= 5),
    nivel_estres INTEGER NOT NULL CHECK (nivel_estres >= 1 AND nivel_estres <= 10),
    recuperacion_percibida VARCHAR(20) NOT NULL CHECK (recuperacion_percibida IN ('rapida', 'normal', 'lenta')),
    kinesiofobia_nivel VARCHAR(20) NOT NULL CHECK (kinesiofobia_nivel IN ('nula', 'leve', 'moderada', 'alta')),
    expectativas_barreras TEXT,
    
    -- Pilar 5: Decisión Terapéutica / Deportiva
    decision_conducta VARCHAR(30) NOT NULL CHECK (decision_conducta IN ('ENTRENAR', 'ADAPTAR/COLABORAR', 'DERIVAR')),
    justificacion_clinica TEXT NOT NULL,
    alertas_biomecanicas_clave JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. TABLA: RUTINAS DE ENTRENAMIENTO (CICLOS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rutinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    nombre_rutina VARCHAR(150) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_cambio DATE NOT NULL, -- Alerta de vencimiento / reevaluación
    activa BOOLEAN NOT NULL DEFAULT true,
    orden INTEGER NOT NULL DEFAULT 1,
    notas_generales TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. TABLA: BLOQUES DE RUTINA (SUB-PESTAÑAS / DÍAS DE ENTRENAMIENTO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bloques_rutina (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rutina_id UUID NOT NULL REFERENCES public.rutinas(id) ON DELETE CASCADE,
    nombre_sub_pestana VARCHAR(100) NOT NULL, -- Ej: "Día 1: Metabólico + Empuje"
    orden INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 9. TABLA: EJERCICIOS DE RUTINA (SPREADSHEET ROWS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ejercicios_rutina (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bloque_id UUID NOT NULL REFERENCES public.bloques_rutina(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL DEFAULT 1,
    ejercicio VARCHAR(200) NOT NULL,
    series VARCHAR(50) NOT NULL,
    repeticiones VARCHAR(50) NOT NULL,
    carga VARCHAR(50),
    pausa VARCHAR(50) NOT NULL,
    rpe_objetivo VARCHAR(50),
    tipo_cadena VARCHAR(10) CHECK (tipo_cadena IN ('CCC', 'CCA', 'MIXTA')),
    observaciones_dosificacion TEXT NOT NULL,
    video_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 10. TABLA: SEGUIMIENTO DIARIO / RPE EN SALA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.seguimiento_diario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    rpe_fatiga NUMERIC(3,1) NOT NULL CHECK (rpe_fatiga >= 1 AND rpe_fatiga <= 10),
    nivel_dolor NUMERIC(3,1) NOT NULL CHECK (nivel_dolor >= 0 AND nivel_dolor <= 10),
    tolerancia_carga VARCHAR(30) NOT NULL CHECK (tolerancia_carga IN ('muy_buena', 'adecuada', 'fatiga_excesiva', 'sintomas_aumentados')),
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 11. ÍNDICES DE ALTO RENDIMIENTO (OPTIMIZACIÓN DE LATENCIA CERO)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profesores_auth ON public.profesores(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profesores_org ON public.profesores(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_grupos_org ON public.grupos(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_grupos_prof ON public.grupos(profesor_id);
CREATE INDEX IF NOT EXISTS idx_alumnos_org ON public.alumnos(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_alumnos_prof ON public.alumnos(profesor_id);
CREATE INDEX IF NOT EXISTS idx_alumnos_grupo ON public.alumnos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_eval_alumno ON public.evaluaciones_clinicas(alumno_id);
CREATE INDEX IF NOT EXISTS idx_rutinas_alumno ON public.rutinas(alumno_id);
CREATE INDEX IF NOT EXISTS idx_bloques_rutina ON public.bloques_rutina(rutina_id);
CREATE INDEX IF NOT EXISTS idx_ejercicios_bloque ON public.ejercicios_rutina(bloque_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_alumno ON public.seguimiento_diario(alumno_id);

-- ==============================================================================
-- 12. TRIGGERS DE ACTUALIZACIÓN AUTOMÁTICA (UPDATED_AT)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_organizaciones_updated ON public.organizaciones;
CREATE TRIGGER trg_organizaciones_updated BEFORE UPDATE ON public.organizaciones
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_profesores_updated ON public.profesores;
CREATE TRIGGER trg_profesores_updated BEFORE UPDATE ON public.profesores
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_alumnos_updated ON public.alumnos;
CREATE TRIGGER trg_alumnos_updated BEFORE UPDATE ON public.alumnos
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_rutinas_updated ON public.rutinas;
CREATE TRIGGER trg_rutinas_updated BEFORE UPDATE ON public.rutinas
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ==============================================================================
-- 13. SEGURIDAD MULTI-TENANT: ROW LEVEL SECURITY (RLS)
-- Cero filtración entre gimnasios y profesores. Aislamiento absoluto.
-- ==============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.organizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones_clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rutinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloques_rutina ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejercicios_rutina ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimiento_diario ENABLE ROW LEVEL SECURITY;

-- Helper function: Obtener organización del usuario actual autenticado
CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS UUID AS $$
  SELECT organizacion_id FROM public.profesores WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- POLÍTICAS: ORGANIZACIONES
CREATE POLICY "Acceso a organización propia" ON public.organizaciones
FOR ALL USING (id = public.current_user_org_id());

-- POLÍTICAS: PROFESORES
CREATE POLICY "Profesores ven colegas de su misma organización" ON public.profesores
FOR SELECT USING (organizacion_id = public.current_user_org_id());

CREATE POLICY "Modificación de su propio perfil de profesor" ON public.profesores
FOR UPDATE USING (auth_user_id = auth.uid());

-- POLÍTICAS: GRUPOS
CREATE POLICY "Acceso a grupos de la organización" ON public.grupos
FOR ALL USING (organizacion_id = public.current_user_org_id());

-- POLÍTICAS: ALUMNOS (Aislamiento por Organización y Permisos de Sala)
CREATE POLICY "Profesores gestionan alumnos de su organización" ON public.alumnos
FOR ALL USING (organizacion_id = public.current_user_org_id());

-- POLÍTICAS: EVALUACIONES CLÍNICAS (Datos de Salud Sensibles - GDPR / HIPAA)
CREATE POLICY "Acceso clínico restringido a alumnos de la organización" ON public.evaluaciones_clinicas
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.alumnos a
        WHERE a.id = evaluaciones_clinicas.alumno_id
        AND a.organizacion_id = public.current_user_org_id()
    )
);

-- POLÍTICAS: RUTINAS
CREATE POLICY "Gestión de rutinas de alumnos de su organización" ON public.rutinas
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.alumnos a
        WHERE a.id = rutinas.alumno_id
        AND a.organizacion_id = public.current_user_org_id()
    )
);

-- POLÍTICAS: BLOQUES DE RUTINA
CREATE POLICY "Gestión de bloques de rutinas" ON public.bloques_rutina
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.rutinas r
        JOIN public.alumnos a ON a.id = r.alumno_id
        WHERE r.id = bloques_rutina.rutina_id
        AND a.organizacion_id = public.current_user_org_id()
    )
);

-- POLÍTICAS: EJERCICIOS DE RUTINA
CREATE POLICY "Gestión de ejercicios de bloques" ON public.ejercicios_rutina
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.bloques_rutina b
        JOIN public.rutinas r ON r.id = b.rutina_id
        JOIN public.alumnos a ON a.id = r.alumno_id
        WHERE b.id = ejercicios_rutina.bloque_id
        AND a.organizacion_id = public.current_user_org_id()
    )
);

-- POLÍTICAS: SEGUIMIENTO DIARIO EN SALA
CREATE POLICY "Seguimiento diario de alumnos en sala" ON public.seguimiento_diario
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.alumnos a
        WHERE a.id = seguimiento_diario.alumno_id
        AND a.organizacion_id = public.current_user_org_id()
    )
);
`;
