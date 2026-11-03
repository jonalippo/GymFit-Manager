import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OWNER_EMAIL = 'jonalippo@gmail.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const projectUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!projectUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Function configuration is incomplete' }, 500);
  }

  // The caller is authenticated with their own token; the service client is
  // used only after confirming that caller is the application owner.
  const callerClient = createClient(projectUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser();

  if (
    callerError ||
    caller?.email?.trim().toLowerCase() !== OWNER_EMAIL
  ) {
    return json({ error: 'Forbidden' }, 403);
  }

  let profesorId = '';
  try {
    const payload = await request.json();
    profesorId = typeof payload?.profesorId === 'string' ? payload.profesorId : '';
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  if (!profesorId || profesorId === 'prof-1') {
    return json({ error: 'Invalid user' }, 400);
  }

  const adminClient = createClient(projectUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: professor, error: professorError } = await adminClient
    .from('profesores')
    .select('id, auth_user_id')
    .eq('id', profesorId)
    .maybeSingle();

  if (professorError) {
    return json({ error: professorError.message }, 500);
  }
  if (!professor?.auth_user_id) {
    return json({ error: 'User profile not found' }, 404);
  }

  const { data: students, error: studentsError } = await adminClient
    .from('alumnos')
    .select('id')
    .eq('profesor_id', profesorId);

  if (studentsError) {
    return json({ error: studentsError.message }, 500);
  }

  const studentIds = (students ?? []).map((student) => student.id);
  if (studentIds.length > 0) {
    const deletionSteps = await Promise.all([
      adminClient.from('rutinas').delete().in('alumno_id', studentIds),
      adminClient.from('evaluaciones_clinicas').delete().in('alumno_id', studentIds),
      adminClient.from('seguimiento_diario').delete().in('alumno_id', studentIds),
    ]);
    const failedStep = deletionSteps.find(({ error }) => error);
    if (failedStep?.error) {
      return json({ error: failedStep.error.message }, 500);
    }
  }

  const deletionSteps = await Promise.all([
    adminClient.from('alumnos').delete().eq('profesor_id', profesorId),
    adminClient.from('grupos').delete().eq('profesor_id', profesorId),
  ]);
  const failedStep = deletionSteps.find(({ error }) => error);
  if (failedStep?.error) {
    return json({ error: failedStep.error.message }, 500);
  }

  const { error: profileError } = await adminClient
    .from('profesores')
    .delete()
    .eq('id', profesorId);
  if (profileError) {
    return json({ error: profileError.message }, 500);
  }

  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(
    professor.auth_user_id,
  );
  if (authDeleteError) {
    return json({ error: authDeleteError.message }, 500);
  }

  return json({ success: true });
});
