import React, { useState } from 'react';
import { Alumno, Grupo, PagoCuota } from '../types';
import { X, Check, DollarSign, Calendar, CreditCard, FileText, User } from 'lucide-react';

interface PaymentModalProps {
  alumno: Alumno;
  grupos: Grupo[];
  isOpen: boolean;
  onClose: () => void;
  onSavePayment: (pago: Omit<PagoCuota, 'id' | 'created_at'>) => Promise<void>;
}

function calculateNextMonthDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

function formatMonthName(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${meses[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  alumno,
  grupos,
  isOpen,
  onClose,
  onSavePayment,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const initialVencimiento = calculateNextMonthDate(today);

  const [monto, setMonto] = useState<string>(
    alumno.ultimo_monto_pago ? String(alumno.ultimo_monto_pago) : '15000'
  );
  const [fechaPago, setFechaPago] = useState<string>(today);
  const [fechaVencimiento, setFechaVencimiento] = useState<string>(initialVencimiento);
  const [mesCorrespondiente, setMesCorrespondiente] = useState<string>(formatMonthName(today));
  const [metodoPago, setMetodoPago] = useState<string>('efectivo');
  const [notas, setNotas] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const grupoAlumno = grupos.find((g) => g.id === alumno.grupo_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMonto = parseFloat(monto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) return;

    setIsSubmitting(true);
    try {
      await onSavePayment({
        alumno_id: alumno.id,
        alumno_nombre: `${alumno.nombre} ${alumno.apellido}`,
        grupo_id: alumno.grupo_id,
        grupo_nombre: grupoAlumno?.nombre_grupo || 'Sin Grupo',
        monto: parsedMonto,
        fecha_pago: fechaPago,
        fecha_vencimiento: fechaVencimiento,
        mes_correspondiente: mesCorrespondiente,
        metodo_pago: metodoPago,
        notas: notas.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Cargar Pago de Cuota</h3>
              <p className="text-xs text-slate-400">
                {alumno.nombre} {alumno.apellido} • {grupoAlumno?.nombre_grupo || 'General'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Monto a Abonar ($) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input
                type="number"
                min="0"
                step="100"
                required
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="15000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fecha de Pago *
              </label>
              <input
                type="date"
                required
                value={fechaPago}
                onChange={(e) => {
                  setFechaPago(e.target.value);
                  setFechaVencimiento(calculateNextMonthDate(e.target.value));
                  setMesCorrespondiente(formatMonthName(e.target.value));
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fecha de Vencimiento (1 Mes) *
              </label>
              <input
                type="date"
                required
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mes Correspondiente
              </label>
              <input
                type="text"
                value={mesCorrespondiente}
                onChange={(e) => setMesCorrespondiente(e.target.value)}
                placeholder="Octubre 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Método de Pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="tarjeta">Tarjeta Débito/Crédito</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas u Observaciones (Opcional)
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="ej. Abonó 50% en efectivo y 50% transferencia"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-emerald-950/40"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Confirmar Pago'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};