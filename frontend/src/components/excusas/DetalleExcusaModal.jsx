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
  AlertTriangle,
  UserCheck,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  Ban
} from 'lucide-react';

export default function DetalleExcusaModal({ isOpen, onClose, excusaId, onActualizado }) {
  const { user, isStaff, isCoordinador, isDocente } = useAuth();
  const [excusa, setExcusa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nuevaObservacion, setNuevaObservacion] = useState('');
  const [enviandoObservacion, setEnviandoObservacion] = useState(false);
  const [descargaError, setDescargaError] = useState(null);

  // Estados para edición y eliminación de seguimientos
  const [editingSegId, setEditingSegId] = useState(null);
  const [editTexto, setEditTexto] = useState('');
  const [guardandoEdit, setGuardandoEdit] = useState(false);
  const [eliminandoSegId, setEliminandoSegId] = useState(null);
  const [accionError, setAccionError] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  // Estados para anulación y solicitud de anulación
  const [modalAnulacionOpen, setModalAnulacionOpen] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [anulacionError, setAnulacionError] = useState(null);

  const [modalSolicitudAnulacionOpen, setModalSolicitudAnulacionOpen] = useState(false);
  const [motivoSolicitudAnulacion, setMotivoSolicitudAnulacion] = useState('');
  const [solicitandoAnulacion, setSolicitandoAnulacion] = useState(false);
  const [solicitudError, setSolicitudError] = useState(null);
  const [solicitudExito, setSolicitudExito] = useState(null);

  // Actualizar el reloj local para el cálculo dinámico de los 15 minutos
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 10000); // Cada 10 segundos
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !excusaId) return;

    setLoading(true);
    setError(null);
    setDescargaError(null);
    setAccionError(null);
    setEditingSegId(null);
    setEditTexto('');
    setAnulacionError(null);
    setSolicitudError(null);
    setSolicitudExito(null);
    setModalAnulacionOpen(false);
    setModalSolicitudAnulacionOpen(false);
    setMotivoAnulacion('');
    setMotivoSolicitudAnulacion('');

    api.getExcusaDetalle(excusaId)
      .then(data => {
        if (data.success) {
          const loadedNow = Date.now();
          const excusaConTimestamp = {
            ...data.excusa,
            _loadedAt: loadedNow,
            seguimientos: (data.excusa.seguimientos || []).map(s => ({
              ...s,
              _loadedAt: loadedNow
            }))
          };
          setExcusa(excusaConTimestamp);
        } else {
          setError(data.message || 'Error al cargar detalles');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, excusaId]);

  const handleConfirmarAnulacion = async () => {
    if (!motivoAnulacion.trim() || motivoAnulacion.trim().length < 5) return;
    setAnulando(true);
    setAnulacionError(null);
    try {
      const res = await api.anularExcusa(excusa.id, motivoAnulacion.trim());
      if (res.success) {
        const loadedNow = Date.now();
        setModalAnulacionOpen(false);
        setMotivoAnulacion('');
        const data = await api.getExcusaDetalle(excusa.id);
        if (data.success) {
          setExcusa({
            ...data.excusa,
            _loadedAt: loadedNow,
            seguimientos: (data.excusa.seguimientos || []).map(s => ({
              ...s,
              _loadedAt: loadedNow
            }))
          });
        }
        if (onActualizado) onActualizado();
      } else {
        setAnulacionError(res.message || 'Error al anular la excusa');
      }
    } catch (err) {
      setAnulacionError(err.message || 'Error al anular la excusa');
    } finally {
      setAnulando(false);
    }
  };

  const handleEnviarSolicitudAnulacion = async () => {
    if (!motivoSolicitudAnulacion.trim() || motivoSolicitudAnulacion.trim().length < 5) return;
    setSolicitandoAnulacion(true);
    setSolicitudError(null);
    try {
      const res = await api.solicitarAnulacion(excusa.id, motivoSolicitudAnulacion.trim());
      if (res.success) {
        setModalSolicitudAnulacionOpen(false);
        setMotivoSolicitudAnulacion('');
        setSolicitudExito('Solicitud de anulación registrada y notificada a los docentes.');
        const loadedNow = Date.now();
        const data = await api.getExcusaDetalle(excusa.id);
        if (data.success) {
          setExcusa({
            ...data.excusa,
            _loadedAt: loadedNow,
            seguimientos: (data.excusa.seguimientos || []).map(s => ({
              ...s,
              _loadedAt: loadedNow
            }))
          });
        }
        if (onActualizado) onActualizado();
      } else {
        setSolicitudError(res.message || 'Error al enviar la solicitud');
      }
    } catch (err) {
      setSolicitudError(err.message || 'Error al enviar la solicitud');
    } finally {
      setSolicitandoAnulacion(false);
    }
  };

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
    setAccionError(null);
    try {
      const res = await api.registrarSeguimiento(excusa.id, nuevaObservacion);
      if (res.success) {
        const nuevoSeg = { ...res.seguimiento, _loadedAt: Date.now() };
        setExcusa(prev => ({
          ...prev,
          seguimientos: [...(prev.seguimientos || []), nuevoSeg]
        }));
        setNuevaObservacion('');
        if (onActualizado) onActualizado();
      }
    } catch (err) {
      setAccionError(err.message || 'Error al registrar observación de seguimiento');
    } finally {
      setEnviandoObservacion(false);
    }
  };

  const handleIniciarEdicion = (seg) => {
    setAccionError(null);
    setEditingSegId(seg.id);
    setEditTexto(seg.observacion);
  };

  const handleCancelarEdicion = () => {
    setEditingSegId(null);
    setEditTexto('');
    setAccionError(null);
  };

  const handleGuardarEdicion = async (segId) => {
    if (!editTexto.trim()) return;

    setGuardandoEdit(true);
    setAccionError(null);
    try {
      const res = await api.editarSeguimiento(segId, editTexto.trim());
      if (res.success) {
        const loadedNow = Date.now();
        setExcusa(prev => ({
          ...prev,
          seguimientos: prev.seguimientos.map(s =>
            s.id === segId ? { ...s, ...res.seguimiento, _loadedAt: loadedNow } : s
          )
        }));
        setEditingSegId(null);
        setEditTexto('');
        if (onActualizado) onActualizado();
      }
    } catch (err) {
      setAccionError(err.message || 'Error al actualizar observación de seguimiento');
    } finally {
      setGuardandoEdit(false);
    }
  };

  const handleEliminarSeguimiento = async (segId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta observación de seguimiento? Esta acción no se puede deshacer.')) {
      return;
    }

    setEliminandoSegId(segId);
    setAccionError(null);
    try {
      const res = await api.eliminarSeguimiento(segId);
      if (res.success) {
        setExcusa(prev => ({
          ...prev,
          seguimientos: prev.seguimientos.filter(s => s.id !== segId)
        }));
        if (editingSegId === segId) {
          setEditingSegId(null);
          setEditTexto('');
        }
        if (onActualizado) onActualizado();
      }
    } catch (err) {
      setAccionError(err.message || 'Error al eliminar observación de seguimiento');
    } finally {
      setEliminandoSegId(null);
    }
  };

  const isEstudiante = Number(user?.id_rol) === 3;
  const segundosDesdeCreacion = excusa?.segundos_desde_creacion !== undefined
    ? Math.floor(Number(excusa.segundos_desde_creacion) + (now - (excusa._loadedAt || now)) / 1000)
    : 9999;
  const puedeAnularEstudiante = isEstudiante && (excusa?.id_estudiante === user?.id) && (segundosDesdeCreacion <= 900);
  const segundosRestantesEstudiante = Math.max(0, 900 - segundosDesdeCreacion);

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
          
          {/* Banner si la excusa está anulada */}
          {excusa.es_anulada ? (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-xs space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 font-black text-rose-900 text-sm">
                <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Excusa Escolar Anulada</span>
              </div>
              <p className="text-rose-800">
                <strong className="text-rose-950">Motivo de la anulación:</strong> {excusa.motivo_anulacion || 'Sin especificar'}
              </p>
              {excusa.fecha_anulacion && (
                <p className="text-[11px] text-rose-600">
                  Anulada el {new Date(excusa.fecha_anulacion).toLocaleString()}
                  {excusa.anulador_nombre ? ` por ${excusa.anulador_nombre} ${excusa.anulador_apellido} (${excusa.anulador_rol})` : ''}
                </p>
              )}
              <p className="text-[10px] text-rose-500 italic pt-0.5">
                * Esta excusa se conserva únicamente con fines de auditoría institucional. El período de fechas ya no está bloqueado en el calendario escolar.
              </p>
            </div>
          ) : (
            /* Bloque de Control y Anulación de Excusa */
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-slate-500" />
                  Gestión de Validez de la Excusa
                </span>
                <p className="text-[11px] text-slate-500">
                  {isStaff
                    ? 'Como personal docente/coordinación, puede anular formalmente esta excusa si hubo un error o duplicidad.'
                    : (puedeAnularEstudiante
                        ? `Puedes anular tu excusa por error de radicación. Tiempo restante: ${Math.floor(segundosRestantesEstudiante / 60)}:${String(segundosRestantesEstudiante % 60).padStart(2, '0')} min.`
                        : 'El tiempo de anulación autónoma (15 min) ha expirado. Puede solicitar la anulación a sus docentes.')
                  }
                </p>
              </div>

              {isStaff && (
                <button
                  type="button"
                  onClick={() => setModalAnulacionOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Anular Excusa</span>
                </button>
              )}

              {!isStaff && isEstudiante && puedeAnularEstudiante && (
                <button
                  type="button"
                  onClick={() => setModalAnulacionOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Anular por Error</span>
                </button>
              )}

              {!isStaff && isEstudiante && !puedeAnularEstudiante && (
                <button
                  type="button"
                  onClick={() => setModalSolicitudAnulacionOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Solicitar Anulación</span>
                </button>
              )}
            </div>
          )}

          {solicitudExito && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
              <span>{solicitudExito}</span>
              <button onClick={() => setSolicitudExito(null)} className="p-1 text-emerald-600 hover:text-emerald-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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
                  fechaHasta={excusa.fecha_hasta}
                  esAnulada={Boolean(excusa.es_anulada)}
                  motivoAnulacion={excusa.motivo_anulacion}
                  showModalidadHint={true}
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
                Seguimiento Institucional
              </h4>
              <span className="text-xs text-slate-400">
                {excusa.seguimientos?.length || 0} observación(es) registrada(s)
              </span>
            </div>

            {/* Aviso o error de acción sobre seguimientos */}
            {accionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{accionError}</span>
              </div>
            )}

            {/* Lista cronológica de observaciones */}
            {excusa.seguimientos && excusa.seguimientos.length > 0 ? (
              <div className="space-y-3">
                {excusa.seguimientos.map((seg) => {
                  const isAuthor = user?.id === seg.id_usuario;
                  const isBeingEdited = editingSegId === seg.id;
                  const isBeingDeleted = eliminandoSegId === seg.id;

                  // Cálculo exacto de tiempo transcurrido
                  let elapsedSeconds = 0;
                  if (seg.segundos_transcurridos !== undefined && seg._loadedAt) {
                    elapsedSeconds = seg.segundos_transcurridos + Math.max(0, Math.floor((now - seg._loadedAt) / 1000));
                  } else if (seg.fecha_hora) {
                    const parsed = new Date(seg.fecha_hora.replace(' ', 'T')).getTime();
                    if (!isNaN(parsed)) {
                      elapsedSeconds = Math.max(0, Math.floor((now - parsed) / 1000));
                    }
                  }

                  const limiteSegundos = 15 * 60; // 15 minutos = 900s
                  const puedeEditar = isAuthor && elapsedSeconds <= limiteSegundos;
                  const puedeEliminar = isAuthor || isCoordinador;
                  const segundosRestantes = Math.max(0, limiteSegundos - elapsedSeconds);
                  const minutosRestantes = Math.ceil(segundosRestantes / 60);
                  const edicionExpirada = isAuthor && elapsedSeconds > limiteSegundos;

                  return (
                    <div
                      key={seg.id}
                      className="p-3.5 bg-purple-50/40 border border-purple-100 rounded-xl text-xs space-y-2 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-purple-950 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-purple-700" />
                          {seg.autor_nombre} {seg.autor_apellido} ({seg.autor_rol})
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Badge de tiempo de edición para el autor */}
                          {isAuthor && puedeEditar && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              Editable ({minutosRestantes} min)
                            </span>
                          )}

                          {edicionExpirada && (
                            <span
                              title="Superó los 15 minutos permitidos para edición. Si requiere rectificarla, debe eliminarla."
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 cursor-help"
                            >
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Edición expirada (+15m)
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400">
                            {new Date(seg.fecha_hora).toLocaleString()}
                          </span>

                          {/* Acciones: Editar / Eliminar */}
                          <div className="flex items-center gap-1 ml-1">
                            {isAuthor && (
                              puedeEditar ? (
                                <button
                                  type="button"
                                  onClick={() => handleIniciarEdicion(seg)}
                                  disabled={isBeingEdited || isBeingDeleted}
                                  title="Editar observación (disponible durante los primeros 15 minutos)"
                                  className="p-1 text-slate-500 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  title="El tiempo límite de 15 minutos para editar esta observación ha expirado. Si ya no es válida o necesita corregirla, debe eliminarla."
                                  className="p-1 text-slate-300 rounded-lg cursor-not-allowed"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}

                            {puedeEliminar && (
                              <button
                                type="button"
                                onClick={() => handleEliminarSeguimiento(seg.id)}
                                disabled={isBeingDeleted}
                                title={edicionExpirada ? 'Eliminar observación (edición ya no disponible)' : 'Eliminar observación'}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cuerpo de la observación o Formulario de edición */}
                      {isBeingEdited ? (
                        <div className="space-y-2 pt-1 bg-white p-2.5 rounded-xl border border-purple-200">
                          <textarea
                            value={editTexto}
                            onChange={(e) => setEditTexto(e.target.value)}
                            rows={3}
                            className="w-full p-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden resize-none"
                            placeholder="Modifique su observación de seguimiento..."
                            autoFocus
                          />
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-[10px] text-purple-700 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Quedan aprox. {minutosRestantes} min para guardar cambios
                            </span>
                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={handleCancelarEdicion}
                                disabled={guardandoEdit}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Cancelar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleGuardarEdicion(seg.id)}
                                disabled={guardandoEdit || !editTexto.trim()}
                                className="flex items-center gap-1 px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{guardandoEdit ? 'Guardando...' : 'Guardar'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-800 leading-relaxed pt-0.5 whitespace-pre-wrap">
                          {seg.observacion}
                        </p>
                      )}

                      {/* Aviso contextual si la edición expiró y el usuario es el autor */}
                      {edicionExpirada && !isBeingEdited && (
                        <p className="text-[10px] text-amber-700/90 pt-0.5">
                          * Ya transcurrieron los 15 minutos iniciales. Para rectificar o retirar esta observación, use el botón de eliminar.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No se han registrado observaciones de seguimiento aún.</p>
            )}

            {/* Formulario para registrar observación (Solo Docentes y Coordinadores en excusas activas) */}
            {isStaff && !excusa.es_anulada && (
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
                  * Las observaciones institucionales solo pueden ser editadas por su autor durante los primeros 15 minutos posteriores a su creación. Superado este lapso, solo podrán ser eliminadas.
                </span>
              </form>
            )}

          </div>

        </div>
      )}

      {/* Modal / Diálogo de Confirmación de Anulación */}
      {modalAnulacionOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-base">
              <Ban className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Confirmar Anulación de Excusa</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Esta acción marcará formalmente la excusa como <strong>Anulada</strong> y liberará el período en el calendario escolar del estudiante para permitir una nueva radicación. El registro original se preservará para auditoría institucional.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo o Justificación de la Anulación *
              </label>
              <textarea
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Indique la razón de la anulación (ej. Error en fechas de inasistencia, duplicado, etc.)..."
                rows={3}
                required
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Mínimo 5 caracteres.</span>
            </div>

            {anulacionError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {anulacionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setModalAnulacionOpen(false);
                  setMotivoAnulacion('');
                  setAnulacionError(null);
                }}
                disabled={anulando}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAnulacion}
                disabled={anulando || motivoAnulacion.trim().length < 5}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{anulando ? 'Anulando...' : 'Anular Definitivamente'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Diálogo de Solicitud de Anulación (Estudiante) */}
      {modalSolicitudAnulacionOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Solicitar Anulación a Docentes</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Explica el motivo del error en la excusa para que el personal docente o de coordinación proceda con la anulación formal y libere tu calendario.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo del Error / Solicitud *
              </label>
              <textarea
                value={motivoSolicitudAnulacion}
                onChange={(e) => setMotivoSolicitudAnulacion(e.target.value)}
                placeholder="Describa el error que cometió y por qué necesita anular esta excusa..."
                rows={3}
                required
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Mínimo 5 caracteres.</span>
            </div>

            {solicitudError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {solicitudError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setModalSolicitudAnulacionOpen(false);
                  setMotivoSolicitudAnulacion('');
                  setSolicitudError(null);
                }}
                disabled={solicitandoAnulacion}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEnviarSolicitudAnulacion}
                disabled={solicitandoAnulacion || motivoSolicitudAnulacion.trim().length < 5}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{solicitandoAnulacion ? 'Enviando...' : 'Enviar Solicitud'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
