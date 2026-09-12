import { useState } from 'react';
import { api } from '../../api/client';
import { useCatalogos } from '../../hooks/useCatalogos';
import {
  Calendar,
  FileText,
  Phone,
  Paperclip,
  ShieldAlert,
  Send,
  CheckCircle2,
  AlertTriangle,
  Lock
} from 'lucide-react';

export default function FormularioRadicacion({ onExcusaRadicada }) {
  const { motivos, loading: loadingCatalogos } = useCatalogos();

  const [formData, setFormData] = useState({
    fecha_desde: new Date().toISOString().slice(0, 10),
    fecha_hasta: '',
    es_indefinida: false,
    motivo: '',
    otro_motivo: '',
    descripcion: '',
    datos_contacto: '',
    es_restringido: false
  });

  const [archivo, setArchivo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [resultadoRadicado, setResultadoRadicado] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const motivoFinal = formData.motivo === 'Otro' ? formData.otro_motivo : formData.motivo;

    if (!formData.fecha_desde) {
      setError('La fecha de inicio de la inasistencia es obligatoria.');
      return;
    }

    if (!formData.es_indefinida && !formData.fecha_hasta) {
      setError('Debe especificar la fecha de fin o marcar la excusa como indefinida.');
      return;
    }

    if (!formData.es_indefinida && new Date(formData.fecha_hasta) < new Date(formData.fecha_desde)) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    if (!motivoFinal || motivoFinal.trim() === '') {
      setError('Debe seleccionar o indicar el motivo de la inasistencia.');
      return;
    }

    if (!formData.descripcion.trim()) {
      setError('La descripción detallada de los hechos es obligatoria.');
      return;
    }

    if (!formData.datos_contacto.trim()) {
      setError('Debe indicar los datos de contacto (teléfono/celular del acudiente responsable).');
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('fecha_desde', formData.fecha_desde);
      if (!formData.es_indefinida && formData.fecha_hasta) {
        data.append('fecha_hasta', formData.fecha_hasta);
      }
      data.append('es_indefinida', formData.es_indefinida);
      data.append('motivo', motivoFinal.trim());
      data.append('descripcion', formData.descripcion.trim());
      data.append('datos_contacto', formData.datos_contacto.trim());
      data.append('es_restringido', formData.es_restringido);

      if (archivo) {
        data.append('anexo', archivo);
      }

      const res = await api.crearExcusa(data);

      if (res.success) {
        setResultadoRadicado(res.radicado);
        if (onExcusaRadicada) onExcusaRadicada(res.excusa);
      } else {
        throw new Error(res.message || 'Error al radicar la excusa.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fecha_desde: new Date().toISOString().slice(0, 10),
      fecha_hasta: '',
      es_indefinida: false,
      motivo: '',
      otro_motivo: '',
      descripcion: '',
      datos_contacto: '',
      es_restringido: false
    });
    setArchivo(null);
    setResultadoRadicado(null);
    setError(null);
  };

  // Pantalla de éxito con número de radicado oficial
  if (resultadoRadicado) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-8 text-center max-w-xl mx-auto my-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-1">
          ¡Excusa Radicada Exitosamente!
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Su solicitud ha quedado registrada formalmente en el sistema institucional de la IED La Victoria.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Número Oficial de Radicado
          </span>
          <div className="text-2xl font-black text-blue-900 mt-1 tracking-wider">
            {resultadoRadicado}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 bg-blue-900 text-white text-sm font-semibold rounded-xl hover:bg-blue-800 transition-colors shadow-xs"
          >
            Radicar Otra Excusa
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      
      {/* Alerta Institucional */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-800 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <strong>Aviso institucional:</strong> En la IED La Victoria no existen aprobaciones o rechazos arbitrarios. Toda excusa nace radicada legalmente y quedará a disposición de los directivos y docentes.
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Rango de Fechas o Indefinida */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-800" />
          Período de Ausencia
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de Inicio (Desde) *
            </label>
            <input
              type="date"
              name="fecha_desde"
              value={formData.fecha_desde}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de Fin (Hasta) {formData.es_indefinida ? '(Deshabilitada por ser Indefinida)' : '*'}
            </label>
            <input
              type="date"
              name="fecha_hasta"
              value={formData.fecha_hasta}
              onChange={handleChange}
              disabled={formData.es_indefinida}
              required={!formData.es_indefinida}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-hidden ${
                formData.es_indefinida
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-600'
              }`}
            />
          </div>
        </div>

        {/* Toggle Es Indefinida */}
        <div className="flex items-center gap-3 pt-1">
          <input
            type="checkbox"
            id="es_indefinida"
            name="es_indefinida"
            checked={formData.es_indefinida}
            onChange={handleChange}
            className="w-4 h-4 text-blue-800 rounded border-slate-300 focus:ring-blue-600 cursor-pointer"
          />
          <label htmlFor="es_indefinida" className="text-xs font-semibold text-slate-800 cursor-pointer">
            Marcar como Inasistencia Indefinida (HU-08)
          </label>
          <span className="text-[11px] text-slate-500">
            (Para hospitalizaciones o tratamientos que requerirán soporte médico de alta al reintegrarse)
          </span>
        </div>
      </div>

      {/* Motivo de Inasistencia */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-800" />
          Motivo y Justificación
        </h4>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Motivo Principal *
          </label>
          <select
            name="motivo"
            value={formData.motivo}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          >
            <option value="">-- Seleccione un motivo institucional --</option>
            {motivos.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>

        {formData.motivo === 'Otro' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Especifique el motivo *
            </label>
            <input
              type="text"
              name="otro_motivo"
              value={formData.otro_motivo}
              onChange={handleChange}
              placeholder="Escriba el motivo detallado..."
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Descripción de los Hechos *
          </label>
          <textarea
            name="descripcion"
            rows="3"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Describa con claridad la situación que ocasiona la inasistencia..."
            required
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Datos de Contacto del Acudiente / Responsable *
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              name="datos_contacto"
              value={formData.datos_contacto}
              onChange={handleChange}
              placeholder="Ej: Claudia Castro (Madre) - Cel: 3105551234 / claudia@correo.com"
              required
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Soporte Adjunto y Confidencialidad (HU-03 y HU-09) */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-blue-800" />
          Soporte Documental (Opcional)
        </h4>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Adjuntar Archivo de Evidencia (PDF, JPG, PNG, DOCX - Máx 10MB)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 cursor-pointer"
          />
          {archivo && (
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Archivo seleccionado: <span className="text-slate-800 font-semibold">{archivo.name}</span> ({(archivo.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* HU-09: Anexo Restringido */}
        {archivo && (
          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="es_restringido"
                name="es_restringido"
                checked={formData.es_restringido}
                onChange={handleChange}
                className="w-4 h-4 text-rose-600 rounded border-rose-300 focus:ring-rose-500 mt-0.5 cursor-pointer"
              />
              <div>
                <label htmlFor="es_restringido" className="text-xs font-bold text-rose-900 flex items-center gap-1.5 cursor-pointer">
                  <Lock className="w-3.5 h-3.5 text-rose-700" />
                  Marcar este anexo como Documento Restringido / Confidencial (HU-09)
                </label>
                <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                  Si activa esta opción, el documento adjunto solo podrá ser visualizado y descargado por la <strong>Coordinación Escolar</strong>. Los docentes verán una advertencia explícita de confidencialidad y no tendrán acceso a la descarga.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botón de Enviar */}
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <span>Radicando Excusa...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Radicar Excusa Formalmente</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
}
