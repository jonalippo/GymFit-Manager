import React, { useState, useEffect } from 'react';
import { Alumno, SeguimientoDiario } from '../types';
import { getSeguimientoDiario, saveSeguimientoDiario } from '../db/indexedDb';
import { Flame, Activity, X, Plus, Calendar, Check } from 'lucide-react';

interface DailyTrackingModalProps {
  alumno: Alumno;
  isOpen: boolean;
  onClose: () => void;
  onSessionLogged: () => void;
}

export const DailyTrackingModal: React.FC<DailyTrackingModalProps> = ({
  alumno,
  isOpen,
  onClose,
  onSessionLogged
}) => {
  const [history, setHistory] = useState<SeguimientoDiario[]>([]);
  const [rpe, setRpe] = useState<number>(7);
  const [dolor, setDolor] = useState<number>(alumno.dolor_eva_actual ?? 1);
  const [tolerancia, setTolerancia] = useState<'muy_buena' | 'adecuada' | 'fatiga_excesiva' | 'sintomas_aumentados'>('adecuada');
  const [notas, setNotas] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, alumno.id]);

  const loadHistory = async () => {
    try {
      const logs = await getSeguimientoDiario(alumno.id);
      setHistory(logs);
    } catch {
      // ignore
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const newLog: SeguimientoDiario = {
      id: 'seg-' + Date.now(),
      alumno_id: alumno.id,
      fecha: new Date().toISOString().split('T')[0],
      rpe_fatiga: rpe,
      nivel_dolor: dolor,
      tolerancia_carga: tolerancia,
      notas: notas.trim() || 'Sesión completada en sala sin complicaciones adicionales.',
      created_at: new Date().toISOString()
    };

    await saveSeguimientoDiario(newLog);
    setSaving(false);
    setNotas('');
    await loadHistory();
    onSessionLogged();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Seguimiento Diario & RPE en Sala</span>
            </h3>
            <p className="text-xs text-slate-400">
              Registrar respuesta a la dosis para <strong>{alumno.nombre} {alumno.apellido}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* New Entry Form */}
          <form onSubmit={handleSave} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="font-semibold text-slate-200">Cargar Sesión de Hoy</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">RPE Sesión (Borg CR-10)</label>
                  <span className="font-mono text-amber-400 font-bold">{rpe} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={rpe}
                  onChange={(e) => setRpe(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">Dolor Post-Sesión (EVA)</label>
                  <span className="font-mono text-rose-400 font-bold">{dolor} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={dolor}
                  onChange={(e) => setDolor(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Tolerancia a la Carga</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'muy_buena', label: 'Muy Buena' },
                  { id: 'adecuada', label: 'Adecuada' },
                  { id: 'fatiga_excesiva', label: 'Fatiga Excesiva' },
                  { id: 'sintomas_aumentados', label: 'Dolor Aumentado' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTolerancia(item.id as typeof tolerancia)}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition ${
                      tolerancia === item.id
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Notas de la Sesión</label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Buena respuesta en hip thrust; molestia leve al terminar..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition text-xs shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Respuesta</span>
              </button>
            </div>
          </form>

          {/* Historical Log */}
          <div>
            <h4 className="font-semibold text-slate-300 mb-2">Historial de Sesiones Anteriores</h4>
            <div className="space-y-2">
              {history.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono text-slate-400 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      <span>{log.fecha}</span>
                      <span>·</span>
                      <span className="text-amber-400 font-bold">RPE {log.rpe_fatiga}</span>
                      <span>·</span>
                      <span className="text-rose-400 font-bold">EVA {log.nivel_dolor}/10</span>
                      <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                        {log.tolerancia_carga.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1 text-[11px] leading-snug">
                      {log.notas}
                    </p>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-xs text-slate-500 py-3 text-center">
                  Aún no hay registros de sesiones para este alumno.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
