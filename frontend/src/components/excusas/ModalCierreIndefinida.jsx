import { useState } from 'react';
import { api } from '../../api/client';
import Modal from '../common/Modal';
import { Upload, AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';

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

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('fecha_retorno', fechaRetorno);
      if (soporteAlta) {
        formData.append('anexo', soporteAlta);
      }

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
      title="Cierre Formal de Excusa Indefinida"
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

        {/* Información Institucional */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Cierre formal:</strong> Para culminar la inasistencia indefinida, ingrese la fecha real en que el estudiante se reincorpora a clases. Adjuntar el soporte o alta médica es opcional.
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

        {/* Archivo Soporte de Alta (Opcional con botón en español) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Soporte Médico de Alta / Certificado de Reincorporación (Opcional)
          </label>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <label
              htmlFor="soporte-cierre-file"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <Upload className="w-4 h-4 text-amber-700" />
              <span>Seleccionar archivo</span>
            </label>
            <input
              id="soporte-cierre-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSoporteAlta(e.target.files[0]);
                }
              }}
              className="sr-only"
            />

            <div className="flex items-center gap-2 min-w-0">
              {soporteAlta ? (
                <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 max-w-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold truncate">{soporteAlta.name}</span>
                  <span className="text-slate-400 text-[11px] shrink-0">
                    ({(soporteAlta.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSoporteAlta(null)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                    title="Quitar archivo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Ningún archivo seleccionado (opcional)
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Formatos permitidos: PDF, JPG, PNG, DOC, DOCX.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto text-center px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Procesando Cierre...' : 'Registrar Retorno y Cerrar Excusa'}</span>
          </button>
        </div>

      </form>
    </Modal>
  );
}
