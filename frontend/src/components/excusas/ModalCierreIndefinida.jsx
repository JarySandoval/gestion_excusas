import { useState } from 'react';
import { api } from '../../api/client';
import Modal from '../common/Modal';
import { Calendar, Upload, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ModalCierreIndefinida({
  isOpen,
  onClose,
  excusa,
  onCierreExitoso
}) {
  const [fechaRetorno, setFechaRetorno] = useState(new Date().toISOString().slice(0, 10));
  const [soporteAlta, setSoporteAlta] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!excusa) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!fechaRetorno) {
      setError('Debe especificar la fecha de retorno a clases.');
      return;
    }

    if (new Date(fechaRetorno) < new Date(excusa.fecha_desde)) {
      setError(`La fecha de retorno (${fechaRetorno}) no puede ser anterior a la fecha de inicio de la inasistencia (${excusa.fecha_desde}).`);
      return;
    }

    // HU-08: Soporte médico obligatorio
    if (!soporteAlta) {
      setError('Es obligatorio adjuntar el soporte o certificado médico de alta para efectuar el cierre formal (HU-08).');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('fecha_retorno', fechaRetorno);
      formData.append('anexo', soporteAlta);

      const res = await api.cerrarExcusaIndefinida(excusa.id, formData);

      if (res.success) {
        if (onCierreExitoso) onCierreExitoso(res.excusa);
        onClose();
      } else {
        throw new Error(res.message || 'Error al cerrar la excusa indefinida.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cierre Formal de Excusa Indefinida (HU-08)"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Resumen de la excusa */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Radicado:</span>
            <span className="font-mono font-bold text-blue-900">{excusa.radicado}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Fecha de Inicio:</span>
            <span className="font-medium text-slate-800">{excusa.fecha_desde}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Motivo:</span>
            <span className="font-medium text-slate-800">{excusa.motivo}</span>
          </div>
        </div>

        {/* Regla Institucional */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Requisito institucional HU-08:</strong> El cierre de una inasistencia médica o indefinida requiere fijar la fecha real de reincorporación y adjuntar obligatoriamente el alta médica oficial.
          </span>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Campo Fecha de Retorno */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Fecha de Retorno a Clases *
          </label>
          <div className="relative">
            <input
              type="date"
              value={fechaRetorno}
              onChange={(e) => setFechaRetorno(e.target.value)}
              min={excusa.fecha_desde}
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Fecha exacta en que el estudiante se reincorpora a la jornada escolar.
          </p>
        </div>

        {/* Archivo Soporte de Alta Obligatorio */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Soporte Médico de Alta / Certificado de Reincorporación (Obligatorio) *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSoporteAlta(e.target.files[0]);
              }
            }}
            required
            className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
          />
          {soporteAlta && (
            <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Soporte cargado: {soporteAlta.name}
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Procesando Cierre...' : 'Registrar Alta y Cerrar Excusa'}</span>
          </button>
        </div>

      </form>
    </Modal>
  );
}
