-- GYMFIT MANAGER - Migración no destructiva para una base existente.
-- No elimina registros ni cambia tipos de columnas. Ejecutar en SQL Editor.

CREATE OR REPLACE FUNCTION public.current_profesor_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.profesores
  WHERE auth_user_id = auth.uid()::text
  LIMIT 1;
$$;

-- La base histórica puede tener current_user_org_id() retornando UUID aunque
-- organizaciones.id ya sea TEXT. Se usa un helper nuevo para no modificar esa
-- función ni sus dependencias existentes.
CREATE OR REPLACE FUNCTION public.current_organizacion_id_text()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organizacion_id::text
  FROM public.profesores
  WHERE auth_user_id = auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt() ->> 'email', '') = 'jonalippo@gmail.com';
$$;

-- Reemplaza las políticas amplias por políticas de propietario. El administrador
-- de plataforma conserva visibilidad y gestión global de solicitudes/cuentas.
DROP POLICY IF EXISTS "Acceso a organización propia" ON public.organizaciones;
DROP POLICY IF EXISTS "Usuarios autenticados crean su organización" ON public.organizaciones;
DROP POLICY IF EXISTS "Profesores ven colegas de su misma organización" ON public.profesores;
DROP POLICY IF EXISTS "Modificación de su propio perfil de profesor" ON public.profesores;
DROP POLICY IF EXISTS "Usuarios crean su propio perfil de profesor" ON public.profesores;
DROP POLICY IF EXISTS "Acceso a grupos de la organización" ON public.grupos;
DROP POLICY IF EXISTS "Profesores gestionan alumnos de su organización" ON public.alumnos;
DROP POLICY IF EXISTS "Acceso clínico restringido a alumnos de la organización" ON public.evaluaciones_clinicas;
DROP POLICY IF EXISTS "Gestión de rutinas de alumnos de su organización" ON public.rutinas;
DROP POLICY IF EXISTS "Gestión de bloques de rutinas" ON public.bloques_rutina;
DROP POLICY IF EXISTS "Gestión de ejercicios de bloques" ON public.ejercicios_rutina;
DROP POLICY IF EXISTS "Seguimiento diario de alumnos en sala" ON public.seguimiento_diario;

CREATE POLICY "Organización propia o administrador" ON public.organizaciones
FOR ALL USING (
  public.is_platform_admin() OR id = public.current_organizacion_id_text()
) WITH CHECK (
  public.is_platform_admin() OR id = public.current_organizacion_id_text()
);

CREATE POLICY "Crear organización autenticada" ON public.organizaciones
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Perfil propio o administrador" ON public.profesores
FOR SELECT USING (
  public.is_platform_admin() OR id = public.current_profesor_id()
);

CREATE POLICY "Actualizar perfil propio o administrador" ON public.profesores
FOR UPDATE USING (
  public.is_platform_admin() OR id = public.current_profesor_id()
) WITH CHECK (
  public.is_platform_admin() OR id = public.current_profesor_id()
);

CREATE POLICY "Crear perfil propio" ON public.profesores
FOR INSERT WITH CHECK (auth_user_id = auth.uid()::text);

CREATE POLICY "Eliminar perfil sólo administrador" ON public.profesores
FOR DELETE USING (public.is_platform_admin());

CREATE POLICY "Grupos del profesor o administrador" ON public.grupos
FOR ALL USING (
  public.is_platform_admin() OR profesor_id = public.current_profesor_id()
) WITH CHECK (
  public.is_platform_admin() OR profesor_id = public.current_profesor_id()
);

CREATE POLICY "Alumnos del profesor o administrador" ON public.alumnos
FOR ALL USING (
  public.is_platform_admin() OR profesor_id = public.current_profesor_id()
) WITH CHECK (
  public.is_platform_admin() OR profesor_id = public.current_profesor_id()
);

CREATE POLICY "Evaluaciones del profesor o administrador" ON public.evaluaciones_clinicas
FOR ALL USING (
  public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.alumnos a
    WHERE a.id = evaluaciones_clinicas.alumno_id
      AND a.profesor_id = public.current_profesor_id()
  )
) WITH CHECK (
  public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.alumnos a
    WHERE a.id = evaluaciones_clinicas.alumno_id
      AND a.profesor_id = public.current_profesor_id()
  )
);

CREATE POLICY "Rutinas del profesor o administrador" ON public.rutinas
FOR ALL USING (
  public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.alumnos a
    WHERE a.id = rutinas.alumno_id
      AND a.profesor_id = public.current_profesor_id()
  )
) WITH CHECK (
  public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.alumnos a
    WHERE a.id = rutinas.alumno_id
      AND a.profesor_id = public.current_profesor_id()
  )
);

CREATE POLICY "Bloques del profesor o administrador" ON public.bloques_rutina
FOR ALL USING (
  public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.rutinas r
    JOIN public.alumnos a ON a.id = r.alumno_id
    WHERE r.id = bloques_rutina.rutina_id
      AND a.profesor_id = public.current_profesor_id()
  )
) WITH CHECK (
  public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.rutinas r
    JOIN public.alumnos a ON a.id = r.alumno_id
    WHERE r.id = bloques_rutina.rutina_id
      AND a.profesor_id = public.current_profesor_id()
  )
);

CREATE POLICY "Ejercicios del profesor o administrador" ON public.ejercicios_rutina
FOR ALL USING (
  public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.bloques_rutina b
    JOIN public.rutinas r ON r.id = b.rutina_id
    JOIN public.alumnos a ON a.id = r.alumno_id
    WHERE b.id = ejercicios_rutina.bloque_id
      AND a.profesor_id = public.current_profesor_id()
  )
) WITH CHECK (
  public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.bloques_rutina b
    JOIN public.rutinas r ON r.id = b.rutina_id
    JOIN public.alumnos a ON a.id = r.alumno_id
    WHERE b.id = ejercicios_rutina.bloque_id
      AND a.profesor_id = public.current_profesor_id()
  )
);

CREATE POLICY "Seguimiento del profesor o administrador" ON public.seguimiento_diario
FOR ALL USING (
  public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.alumnos a
    WHERE a.id = seguimiento_diario.alumno_id
      AND a.profesor_id = public.current_profesor_id()
  )
) WITH CHECK (
  public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.alumnos a
    WHERE a.id = seguimiento_diario.alumno_id
      AND a.profesor_id = public.current_profesor_id()
  )
);

DO $$
BEGIN
  IF to_regclass('public.pagos') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Gestión de pagos de alumnos de la organización" ON public.pagos;
    DROP POLICY IF EXISTS "Pagos del profesor o administrador" ON public.pagos;
    EXECUTE $policy$
      CREATE POLICY "Pagos del profesor o administrador" ON public.pagos
      FOR ALL USING (
        public.is_platform_admin() OR EXISTS (
          SELECT 1 FROM public.alumnos a
          WHERE a.id = pagos.alumno_id
            AND a.profesor_id = public.current_profesor_id()
        )
      ) WITH CHECK (
        public.is_platform_admin() OR EXISTS (
          SELECT 1 FROM public.alumnos a
          WHERE a.id = pagos.alumno_id
            AND a.profesor_id = public.current_profesor_id()
        )
      )
    $policy$;
  END IF;
END $$;
