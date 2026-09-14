import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { ModalidadBadge, RestringidoBadge } from '../common/Badge';
import {
  Download,
  Paperclip,
  Clock,
  MessageSquare,
  Send,
  Lock,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

export default function DetalleExcusaModal({ isOpen, onClose, excusaId, onActualizado }) {
  const { user, isStaff, isCoordinador, isDocente } = useAuth();
  const [excusa, setExcusa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nuevaObservacion, setNuevaObservacion] = useState('');
  const [enviandoObservacion, setEnviandoObservacion] = useState(false);
  const [descargaError, setDescargaError] = useState(null);

  useEffect(() => {
    if (!isOpen || !excusaId) return;

    setLoading(true);
    setError(null);
    setDescargaError(null);

    api.getExcusaDetalle(excusaId)
      .then(data => {
        if (data.success) {
          setExcusa(data.excusa);
        } else {
          setError(data.message || 'Error al cargar detalles');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, excusaId]);

  const handleDescargar = async (anexo) => {
    setDescargaError(null);
    try {
      await api.descargarAnexo(anexo.id, anexo.nombre_original);
    } catch (err) {
      setDescargaError(err.message);
    }
  };

  const handleRegistrarSeguimiento = async (e) => {
    e.preventDefault();
    if (!nuevaObservacion.trim()) return;

    setEnviandoObservacion(true);
    try {
      const res = await api.registrarSeguimiento(excusa.id, nuevaObservacion);
      if (res.success) {
        setExcusa(prev => ({
          ...prev,
          seguimientos: [...(prev.seguimientos || []), res.seguimiento]
        }));
        setNuevaObservacion('');
        if (onActualizado) onActualizado();
      }
    } catch (err) {
      alert(err.message || 'Error al registrar observación de seguimiento');
    } finally {
      setEnviandoObservacion(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={excusa ? `Detalle de Excusa: ${excusa.radicado}` : 'Cargando...'}
      maxWidth="max-w-3xl"
    >
      {loading && (
        <div className="py-12 text-center text-slate-500 text-sm">
          Cargando detalles de la excusa...
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
          {error}
        </div>
      )}

      {excusa && (
        <div className="space-y-6">
          
          {/* Header de Metadatos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase block">Estudiante</span>
              <span className="text-sm font-bold text-slate-900 block">
                {excusa.estudiante_nombre} {excusa.estudiante_apellido}
              </span>
              <span className="text-slate-500">
                Doc: {excusa.estudiante_doc} {excusa.curso_grado && `| Grado ${excusa.curso_grado}`}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase block">Estado & Modalidad</span>
              <div className="mt-1">
                <ModalidadBadge
                  esIndefinida={Boolean(excusa.es_indefinida)}
                  fechaRetorno={excusa.fecha_retorno}
                />
              </div>
              <span className="text-slate-400 block mt-1 text-[11px]">
                Radicado el: {new Date(excusa.fecha_creacion).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Fechas y Motivo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-slate-400 font-semibold block">Fecha de Inicio</span>
              <span className="text-sm font-bold text-slate-800">{excusa.fecha_desde}</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-slate-400 font-semibold block">Fecha de Fin / Cierre</span>
              <span className="text-sm font-bold text-slate-800">
                {excusa.es_indefinida
                  ? (excusa.fecha_retorno ? `Retorno: ${excusa.fecha_retorno}` : 'Indefinida (Abierta)')
                  : excusa.fecha_hasta}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-slate-400 font-semibold block">Motivo</span>
              <span className="text-sm font-bold text-blue-900">{excusa.motivo}</span>
            </div>
          </div>

          {/* Descripción de los hechos */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-700 block mb-1">
              Descripción de los Hechos:
            </span>
            <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {excusa.descripcion}
            </p>
          </div>

          {/* Contacto del acudiente */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="font-bold text-slate-700">Contacto Acudiente / Responsable: </span>
            <span className="text-slate-900 font-medium">{excusa.datos_contacto}</span>
          </div>

          {/* Anexos y Documentos de Soporte (HU-03 y HU-09) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-blue-800" />
                Documentos de Soporte y Anexos
              </h4>
              <span className="text-xs text-slate-400">
                {excusa.anexos?.length || 0} archivo(s)
              </span>
            </div>

            {descargaError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{descargaError}</span>
              </div>
            )}

            {excusa.anexos && excusa.anexos.length > 0 ? (
              <div className="space-y-2">
                {excusa.anexos.map((anexo) => {
                  const esRestringido = Boolean(anexo.es_restringido);
                  const docenteBloqueado = esRestringido && isDocente;

                  return (
                    <div
                      key={anexo.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                        esRestringido ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {anexo.nombre_original}
                          </span>
                          {esRestringido && <RestringidoBadge isDocente={isDocente} />}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Subido el: {new Date(anexo.fecha_subida).toLocaleString()}
                        </div>

                        {/* Aviso explícito de confidencialidad para docentes (HU-09) */}
                        {docenteBloqueado && (
                          <p className="text-[11px] text-rose-700 font-medium flex items-center gap-1 mt-1">
                            <Lock className="w-3 h-3 text-rose-600" />
                            Anexo confidencial: Este archivo contiene datos sensibles o reserva médica, accesible únicamente por la Coordinación escolar.
                          </p>
                        )}
                      </div>

                      {/* Botón de descarga */}
                      <div className="w-full sm:w-auto">
                        {docenteBloqueado ? (
                          <button
                            disabled
                            title="Acceso reservado para Coordinación"
                            className="w-full sm:w-auto flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 bg-slate-100 text-slate-400 rounded-xl sm:rounded-lg text-xs font-semibold cursor-not-allowed border border-slate-200"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Acceso Restringido</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDescargar(anexo)}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl sm:rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar Archivo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No se adjuntaron documentos de soporte.</p>
            )}
          </div>

          {/* Hilo de Seguimiento Institucional (HU-06) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-purple-800" />
                Seguimiento Institucional (HU-06)
              </h4>
              <span className="text-xs text-slate-400">
                {excusa.seguimientos?.length || 0} registro(s) inmutable(s)
              </span>
            </div>

            {/* Lista cronológica de observaciones */}
            {excusa.seguimientos && excusa.seguimientos.length > 0 ? (
              <div className="space-y-3">
                {excusa.seguimientos.map((seg) => (
                  <div key={seg.id} className="p-3 bg-purple-50/40 border border-purple-100 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-950 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-purple-700" />
                        {seg.autor_nombre} {seg.autor_apellido} ({seg.autor_rol})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(seg.fecha_hora).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed pt-1">
                      {seg.observacion}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No se han registrado observaciones de seguimiento aún.</p>
            )}

            {/* Formulario para registrar observación (Solo Docentes y Coordinadores) */}
            {isStaff && (
              <form onSubmit={handleRegistrarSeguimiento} className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Registrar Nueva Observación de Seguimiento Institucional:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={nuevaObservacion}
                    onChange={(e) => setNuevaObservacion(e.target.value)}
                    placeholder="Escriba la anotación u observación institucional..."
                    required
                    className="flex-1 px-3.5 py-2.5 sm:py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={enviandoObservacion || !nuevaObservacion.trim()}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{enviandoObservacion ? 'Guardando...' : 'Registrar'}</span>
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block">
                  * Las observaciones registradas son inmutables y quedarán asociadas con su nombre y fecha/hora exacta.
                </span>
              </form>
            )}

          </div>

        </div>
      )}
    </Modal>
  );
}
