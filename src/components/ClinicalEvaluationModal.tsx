import React, { useState } from 'react';
import { Alumno, EvaluacionClinica, PatronMovimiento, ZonaDolor, DecisionTerapeutica } from '../types';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  X,
  HeartPulse,
  Brain,
  ShieldAlert,
  Save,
  Check
} from 'lucide-react';

interface ClinicalEvaluationModalProps {
  alumno: Alumno;
  evaluacionActual: EvaluacionClinica | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveEvaluacion: (evaluacion: EvaluacionClinica) => Promise<void>;
}

const ZONAS_ANATOMICAS: { id: ZonaDolor; label: string }[] = [
  { id: 'cervical', label: 'Cervical' },
  { id: 'dorsal', label: 'Dorsal / Escapular' },
  { id: 'lumbar', label: 'Lumbar / Lumbosacra' },
  { id: 'hombro_izq', label: 'Hombro Izquierdo' },
  { id: 'hombro_der', label: 'Hombro Derecho' },
  { id: 'codo_izq', label: 'Codo Izquierdo' },
  { id: 'codo_der', label: 'Codo Derecho' },
  { id: 'muñeca_izq', label: 'Muñeca Izquierda' },
  { id: 'muñeca_der', label: 'Muñeca Derecha' },
  { id: 'cadera_izq', label: 'Cadera Izquierda' },
  { id: 'cadera_der', label: 'Cadera Derecha' },
  { id: 'rodilla_izq', label: 'Rodilla Izquierda' },
  { id: 'rodilla_der', label: 'Rodilla Derecha' },
  { id: 'tobillo_izq', label: 'Tobillo Izquierdo' },
  { id: 'tobillo_der', label: 'Tobillo Derecho' }
];

const PATRONES_DEFAULT: PatronMovimiento[] = [
  'sentadilla',
  'bisagra',
  'empuje_horizontal',
  'empuje_vertical',
  'traccion_horizontal',
  'traccion_vertical',
  'lunge_unilateral',
  'anti_rotacion_core'
];

export const ClinicalEvaluationModal: React.FC<ClinicalEvaluationModalProps> = ({
  alumno,
  evaluacionActual,
  isOpen,
  onClose,
  onSaveEvaluacion
}) => {
  const [activePillar, setActivePillar] = useState<number>(1);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states based on current evaluation or defaults
  const [objetivos, setObjetivos] = useState(evaluacionActual?.objetivos_principales || '');
  const [sintomas, setSintomas] = useState(evaluacionActual?.sintomas_relevantes || '');
  const [dolorEva, setDolorEva] = useState<number>(evaluacionActual?.dolor_eva ?? 2);
  const [zonasDolor, setZonasDolor] = useState<ZonaDolor[]>(evaluacionActual?.zonas_dolor || ['lumbar']);
  const [medicacion, setMedicacion] = useState(evaluacionActual?.medicacion_actual || '');
  const [restricciones, setRestricciones] = useState(evaluacionActual?.restricciones_medicas || '');

  // Pillar 2
  const [historiaDep, setHistoriaDep] = useState(evaluacionActual?.historia_deportiva || '');
  const [sedentarismo, setSedentarismo] = useState<'alto' | 'medio' | 'bajo'>(evaluacionActual?.nivel_sedentarismo || 'medio');
  const [lesionesPrev, setLesionesPrev] = useState(evaluacionActual?.lesiones_previas || '');
  const [cirugias, setCirugias] = useState(evaluacionActual?.cirugias || '');
  const [tratamientosFisio, setTratamientosFisio] = useState(evaluacionActual?.tratamientos_fisio_previos || '');

  // Pillar 3
  const [movilidad, setMovilidad] = useState(evaluacionActual?.movilidad_articular || '');
  const [toleranciaCarga, setToleranciaCarga] = useState<'baja' | 'moderada' | 'alta'>(evaluacionActual?.tolerancia_carga_estimada || 'moderada');
  const [cccScore, setCccScore] = useState<'bueno' | 'regular' | 'deficiente'>(evaluacionActual?.control_motor_cadena.ccc_score || 'bueno');
  const [ccaScore, setCcaScore] = useState<'bueno' | 'regular' | 'deficiente'>(evaluacionActual?.control_motor_cadena.cca_score || 'regular');

  // Pillar 4
  const [sueno, setSueno] = useState<number>(evaluacionActual?.calidad_sueno ?? 3);
  const [estres, setEstres] = useState<number>(evaluacionActual?.nivel_estres ?? 5);
  const [recuperacion, setRecuperacion] = useState<'rapida' | 'normal' | 'lenta'>(evaluacionActual?.recuperacion_percibida || 'normal');
  const [kinesiofobia, setKinesiofobia] = useState<'nula' | 'leve' | 'moderada' | 'alta'>(evaluacionActual?.kinesiofobia_nivel || 'leve');
  const [expectativas, setExpectativas] = useState(evaluacionActual?.expectativas_barreras || '');

  // Pillar 5
  const [decision, setDecision] = useState<DecisionTerapeutica>(evaluacionActual?.decision_conducta || 'ENTRENAR');
  const [justificacion, setJustificacion] = useState(evaluacionActual?.justificacion_clinica || '');
  const [alertasKey, setAlertasKey] = useState<string>(
    evaluacionActual?.alertas_biomecanicas_clave.join('\n') ||
    'Priorizar vectores anteroposteriores sobre axiales verticales.\nEvitar compresiones forzadas en final de rango articular.'
  );

  const toggleZona = (zona: ZonaDolor) => {
    if (zonasDolor.includes(zona)) {
      setZonasDolor(zonasDolor.filter((z) => z !== zona));
    } else {
      setZonasDolor([...zonasDolor, zona]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const newEval: EvaluacionClinica = {
      id: evaluacionActual?.id || 'eval-' + Date.now(),
      alumno_id: alumno.id,
      fecha: new Date().toISOString().split('T')[0],
      objetivos_principales: objetivos.trim() || 'Acondicionamiento físico y salud articular',
      sintomas_relevantes: sintomas.trim() || 'Sin síntomas agudos',
      dolor_eva: dolorEva,
      zonas_dolor: zonasDolor,
      medicacion_actual: medicacion.trim() || undefined,
      restricciones_medicas: restricciones.trim() || undefined,
      historia_deportiva: historiaDep.trim() || 'Recreacional',
      nivel_sedentarismo: sedentarismo,
      lesiones_previas: lesionesPrev.trim() || 'Ninguna registrada',
      cirugias: cirugias.trim() || undefined,
      tratamientos_fisio_previos: tratamientosFisio.trim() || undefined,
      movilidad_articular: movilidad.trim() || 'Rango funcional dentro de la normalidad',
      patrones_movimiento: PATRONES_DEFAULT.map((p) => ({
        patron: p,
        calidad: dolorEva > 4 ? 'compensacion' : 'optimo',
        observaciones: 'Evaluación funcional sin dolor agudo'
      })),
      control_motor_cadena: {
        ccc_score: cccScore,
        cca_score: ccaScore,
        observaciones: `CCC: ${cccScore} | CCA: ${ccaScore}`
      },
      tolerancia_carga_estimada: toleranciaCarga,
      calidad_sueno: sueno,
      nivel_estres: estres,
      recuperacion_percibida: recuperacion,
      kinesiofobia_nivel: kinesiofobia,
      expectativas_barreras: expectativas.trim() || 'Buena predisposición al entrenamiento',
      decision_conducta: decision,
      justificacion_clinica: justificacion.trim() || `Conducta terapéutica ${decision} basada en relación Demanda vs Capacidad.`,
      alertas_biomecanicas_clave: alertasKey.split('\n').filter((l) => l.trim().length > 0)
    };

    await onSaveEvaluacion(newEval);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Activity className="w-4 h-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Historia Clínica Biomecánica: "El Iceberg"
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Evaluación integral de <strong>{alumno.nombre} {alumno.apellido}</strong> (Demanda vs. Capacidad vs. Respuesta)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Pillars Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 overflow-x-auto px-4 shrink-0 text-xs font-semibold">
          {[
            { id: 1, label: '1. Presentación Actual', icon: AlertTriangle },
            { id: 2, label: '2. Historia & Lesiones', icon: HeartPulse },
            { id: 3, label: '3. Capacidad Física', icon: Activity },
            { id: 4, label: '4. Biopsicosocial', icon: Brain },
            { id: 5, label: '5. Decisión Clínica', icon: ShieldAlert }
          ].map((pill) => {
            const Icon = pill.icon;
            const isActive = activePillar === pill.id;

            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActivePillar(pill.id)}
                className={`py-3 px-3.5 whitespace-nowrap flex items-center gap-1.5 border-b-2 transition ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {/* PILAR 1: PRESENTACIÓN ACTUAL */}
          {activePillar === 1 && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-200">
                    Escala Visual Análoga del Dolor (EVA: {dolorEva} / 10)
                  </label>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      dolorEva === 0
                        ? 'bg-emerald-950 text-emerald-400'
                        : dolorEva <= 3
                        ? 'bg-blue-950 text-blue-400'
                        : dolorEva <= 6
                        ? 'bg-amber-950 text-amber-400'
                        : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    {dolorEva === 0 ? 'Sin Dolor' : dolorEva <= 3 ? 'Dolor Leve' : dolorEva <= 6 ? 'Dolor Moderado' : 'Dolor Severo'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={dolorEva}
                  onChange={(e) => setDolorEva(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>0 (Asintomático)</span>
                  <span>5 (Interfiere entrenamiento)</span>
                  <span>10 (Incapacitante)</span>
                </div>
              </div>

              {/* Selector Anatómico Interactivo de Zonas de Dolor */}
              <div>
                <label className="block font-semibold text-slate-200 mb-1.5">
                  Mapa Anatómico de Síntomas / Zonas Afectadas:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ZONAS_ANATOMICAS.map((z) => {
                    const isSelected = zonasDolor.includes(z.id);
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => toggleZona(z.id)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs transition ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {z.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Objetivos Principales *</label>
                  <textarea
                    rows={3}
                    value={objetivos}
                    onChange={(e) => setObjetivos(e.target.value)}
                    placeholder="Ej. Hipertrofia de tren superior y fortalecimiento lumbo-pélvico para volver a correr..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Síntomas Relevantes *</label>
                  <textarea
                    rows={3}
                    value={sintomas}
                    onChange={(e) => setSintomas(e.target.value)}
                    placeholder="Ej. Dolor punzante al final del día tras estar sentado en la oficina; sin irradiación..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Medicación Actual</label>
                  <input
                    type="text"
                    value={medicacion}
                    onChange={(e) => setMedicacion(e.target.value)}
                    placeholder="Ej. Ibuprofeno SOS, Paracetamol..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Restricciones Médicas</label>
                  <input
                    type="text"
                    value={restricciones}
                    onChange={(e) => setRestricciones(e.target.value)}
                    placeholder="Ej. Prohibición de flexiones lumbares dinámicas bajo carga..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PILAR 2: HISTORIA Y EXPOSICIÓN */}
          {activePillar === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Historia Deportiva Previa</label>
                <textarea
                  rows={2}
                  value={historiaDep}
                  onChange={(e) => setHistoriaDep(e.target.value)}
                  placeholder="Ej. 10 años practicando rugby; 3 años de inactividad casi total..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="block text-slate-400 mb-1 font-medium">Nivel de Sedentarismo</label>
                  <select
                    value={sedentarismo}
                    onChange={(e) => setSedentarismo(e.target.value as 'alto' | 'medio' | 'bajo')}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                  >
                    <option value="bajo">Bajo (Activo cotidiano)</option>
                    <option value="medio">Medio (6-8h sentado)</option>
                    <option value="alto">Alto (&gt;8h sentado continuo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Lesiones Previas & Diagnósticos</label>
                <textarea
                  rows={2}
                  value={lesionesPrev}
                  onChange={(e) => setLesionesPrev(e.target.value)}
                  placeholder="Ej. Protrusión L4-L5, esguince de tobillo grado II en 2021..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Cirugías Previas</label>
                  <input
                    type="text"
                    value={cirugias}
                    onChange={(e) => setCirugias(e.target.value)}
                    placeholder="Ej. Menisectomía parcial rodilla izquierda (2018)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Tratamientos Fisioterapia Previos</label>
                  <input
                    type="text"
                    value={tratamientosFisio}
                    onChange={(e) => setTratamientosFisio(e.target.value)}
                    placeholder="Ej. Kinesioterapia motora 12 sesiones..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PILAR 3: CAPACIDAD ACTUAL (EVALUACIÓN FÍSICA Y BIOMECÁNICA) */}
          {activePillar === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Rango Articular & Movilidad</label>
                <textarea
                  rows={2}
                  value={movilidad}
                  onChange={(e) => setMovilidad(e.target.value)}
                  placeholder="Ej. Dorsiflexión de tobillo: 12cm bilateral (buena). RI cadera: 20° bilateral (restringida)..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              {/* Control Motor CCC vs CCA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="block font-semibold text-emerald-400 mb-1">
                    Control Motor: Cadena Cinética Cerrada (CCC)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Pie/mano apoyada (ej. Sentadilla, Plancha, Push-Up). Co-activación articular.
                  </p>
                  <select
                    value={cccScore}
                    onChange={(e) => setCccScore(e.target.value as 'bueno' | 'regular' | 'deficiente')}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                  >
                    <option value="bueno">Bueno (Estable y sin dolor)</option>
                    <option value="regular">Regular (Compensaciones leves)</option>
                    <option value="deficiente">Deficiente (Pérdida de alineación/dolor)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-blue-400 mb-1">
                    Control Motor: Cadena Cinética Abierta (CCA)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Extremo distal libre (ej. Sillón de cuádriceps, vuelos laterales). Mayor cizalla.
                  </p>
                  <select
                    value={ccaScore}
                    onChange={(e) => setCcaScore(e.target.value as 'bueno' | 'regular' | 'deficiente')}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                  >
                    <option value="bueno">Bueno (Aislamiento limpio)</option>
                    <option value="regular">Regular (Tolera baja carga)</option>
                    <option value="deficiente">Deficiente (Cizalla o dolor articular)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Tolerancia Estimada a la Carga</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['baja', 'moderada', 'alta'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setToleranciaCarga(t)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold uppercase transition ${
                        toleranciaCarga === t
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PILAR 4: CONTEXTO BIOPSICOSOCIAL */}
          {activePillar === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-200">
                      Calidad de Sueño (1 a 5)
                    </label>
                    <span className="font-mono text-emerald-400 font-bold">{sueno} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={sueno}
                    onChange={(e) => setSueno(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">1: Insomnio / No reparador · 5: Profundo y reparador</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-200">
                      Nivel de Estrés Cotidiano (1 a 10)
                    </label>
                    <span className="font-mono text-amber-400 font-bold">{estres} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={estres}
                    onChange={(e) => setEstres(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">1: Calmo/Bajo · 10: Estrés extremo/burnout</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="block text-slate-300 mb-1 font-medium">Recuperación Percibida</label>
                  <select
                    value={recuperacion}
                    onChange={(e) => setRecuperacion(e.target.value as 'rapida' | 'normal' | 'lenta')}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                  >
                    <option value="rapida">Rápida (recupera en 24h)</option>
                    <option value="normal">Normal (48h)</option>
                    <option value="lenta">Lenta (agujetas/fatiga &gt;72h)</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="block text-amber-300 mb-1 font-medium">
                    Kinesiofobia (Miedo al Movimiento / Carga)
                  </label>
                  <select
                    value={kinesiofobia}
                    onChange={(e) => setKinesiofobia(e.target.value as 'nula' | 'leve' | 'moderada' | 'alta')}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                  >
                    <option value="nula">Nula (Confianza plena)</option>
                    <option value="leve">Leve (Cuidado precautorio)</option>
                    <option value="moderada">Moderada (Miedo a agravar lesión)</option>
                    <option value="alta">Alta (Evitación activa de ciertos ejercicios)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Expectativas & Barreras de Adherencia</label>
                <textarea
                  rows={2}
                  value={expectativas}
                  onChange={(e) => setExpectativas(e.target.value)}
                  placeholder="Ej. Tiempo limitado por trabajo; requiere rutinas eficientes de no más de 50 minutos..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>
          )}

          {/* PILAR 5: DECISIÓN TERAPÉUTICA / DEPORTIVA */}
          {activePillar === 5 && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-200 mb-2">
                  Selector de Conducta Deportiva / Terapéutica en Sala:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('ENTRENAR')}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      decision === 'ENTRENAR'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md ring-1 ring-emerald-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-emerald-400">ENTRENAR</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Capacidad suficiente. Progresión regular de sobrecarga sin contraindicaciones.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('DERIVAR')}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      decision === 'DERIVAR'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-md ring-1 ring-rose-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-rose-400">DERIVAR</span>
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Banderas rojas, dolor agudo &gt;7 o sospecha de patología estructural no compensada. Derivar a médico.
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Justificación Clínica / Biomecánica</label>
                <textarea
                  rows={3}
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  placeholder="Fundamente el criterio de progresión de carga y control motor según la capacidad evaluada..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>
          )}

          {/* Footer Save & Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activePillar > 1 && (
                <button
                  type="button"
                  onClick={() => setActivePillar(activePillar - 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Anterior
                </button>
              )}
              {activePillar < 5 && (
                <button
                  type="button"
                  onClick={() => setActivePillar(activePillar + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white font-medium"
                >
                  Siguiente Pilar
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={savedSuccess}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/50"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Guardado Exitosamente</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Evaluación</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
