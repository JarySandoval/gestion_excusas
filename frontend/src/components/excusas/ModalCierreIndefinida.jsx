import { useState } from 'react';
import { api } from '../../api/client';
import Modal from '../common/Modal';
import MultiFileUpload from '../common/MultiFileUpload';
import { AlertCircle, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';

export default function ModalCierreIndefinida({
  isOpen,
  onClose,
  excusa,
  onCierreExitoso
}) {
  const [fechaRetorno, setFechaRetorno] = useState(new Date().toISOString().slice(0, 10));
  const [archivosSoporte, setArchivosSoporte] = useState([]);
  const [esRestringido, setEsRestringido] = useState(false);
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
      formData.append('es_restringido', esRestringido);
      if (archivosSoporte && archivosSoporte.length > 0) {
        archivosSoporte.forEach((f) => {
          formData.append('anexos', f);
        });
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

        {/* Soporte Médico de Alta (Opcional, hasta 5 archivos y 30 MB) */}
        <MultiFileUpload
          files={archivosSoporte}
          onChange={setArchivosSoporte}
          maxFiles={5}
          maxTotalSizeMB={30}
          themeColor="amber"
          title="Soporte Médico de Alta / Certificado de Reincorporación (Opcional)"
          hint="Formatos admitidos: PDF, JPG, PNG, DOC, DOCX. Máximo 5 archivos y hasta 30 MB en conjunto."
          inputId="soporte-cierre-file"
        />

        {/* HU-09: Anexo Restringido / Confidencial */}
        {archivosSoporte.length > 0 && (
          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="cierre_es_restringido"
                name="cierre_es_restringido"
                checked={esRestringido}
                onChange={(e) => setEsRestringido(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded border-rose-300 focus:ring-rose-500 mt-0.5 cursor-pointer shrink-0"
              />
              <div>
                <label
                  htmlFor="cierre_es_restringido"
                  className="font-bold text-rose-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                  <span>Marcar estos anexos como Documentos Restringidos / Confidenciales</span>
                </label>
                <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                  Si activa esta opción, los archivos de soporte médico adjuntos solo podrán ser visualizados y descargados por la <strong>Coordinación Escolar</strong>. Los docentes verán una advertencia explícita de confidencialidad institucional y no tendrán acceso a la descarga.
                </p>
              </div>
            </div>
          </div>
        )}

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
