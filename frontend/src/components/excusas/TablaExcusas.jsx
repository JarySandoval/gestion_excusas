import { Eye, CheckCircle, MessageSquare, Paperclip, Lock, Calendar } from 'lucide-react';
import { ModalidadBadge, RestringidoBadge } from '../common/Badge';
import { useAuth } from '../../hooks/useAuth';

export default function TablaExcusas({
  excusas = [],
  onVerDetalle,
  onCerrarIndefinida,
  onRegistrarSeguimiento,
  showEstudianteCol = true
}) {
  const { isStaff, isDocente } = useAuth();

  if (!excusas || excusas.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-700">No se encontraron excusas registradas</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          No hay registros que coincidan con los criterios de búsqueda o novedades para el período seleccionado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vista Móvil y Tablet Compacta (< md): Tarjetas Interactivas Táctiles */}
      <div className="md:hidden space-y-3">
        {excusas.map((excusa) => {
          const tieneRestringido = excusa.anexos?.some(a => Boolean(a.es_restringido));
          const estaAbierta = Boolean(excusa.es_indefinida) && !excusa.fecha_retorno;

          return (
            <div
              key={excusa.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-blue-300 transition-all space-y-3"
            >
              {/* Cabecera de la Tarjeta */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-blue-900">
                    {excusa.radicado}
                  </span>
                  <ModalidadBadge
                    esIndefinida={Boolean(excusa.es_indefinida)}
                    fechaRetorno={excusa.fecha_retorno}
                  />
                </div>
                {estaAbierta && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded-full border border-amber-300 shrink-0">
                    Abierta
                  </span>
                )}
              </div>

              {/* Información del Estudiante (Si aplica) */}
              {showEstudianteCol && (
                <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                  <div className="text-xs font-bold text-slate-900">
                    {excusa.estudiante_nombre} {excusa.estudiante_apellido}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Doc: {excusa.estudiante_doc}</span>
                    {excusa.curso_grado && (
                      <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                        Grado {excusa.curso_grado}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Período de Ausencia y Motivo */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold text-[11px] block">Período:</span>
                  <span className="font-bold text-slate-800">
                    {excusa.fecha_desde}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {excusa.es_indefinida
                      ? (excusa.fecha_retorno ? `Hasta: ${excusa.fecha_retorno}` : '(Indefinida)')
                      : `Hasta: ${excusa.fecha_hasta}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold text-[11px] block">Motivo:</span>
                  <span className="font-bold text-blue-950 line-clamp-1" title={excusa.motivo}>
                    {excusa.motivo}
                  </span>
                </div>
              </div>

              {/* Resumen de la Descripción */}
              {excusa.descripcion && (
                <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-100/80">
                  {excusa.descripcion}
                </p>
              )}

              {/* Metadatos (Anexos y Seguimientos) */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    {excusa.anexos?.length || 0} anexo(s)
                  </span>
                  {tieneRestringido && <RestringidoBadge isDocente={isDocente} />}
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    {excusa.total_seguimientos || 0}
                  </span>
                </div>

                {/* Acciones Rápidas Táctiles en Móvil */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onVerDetalle(excusa)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detalle</span>
                  </button>

                  {estaAbierta && onCerrarIndefinida && (
                    <button
                      onClick={() => onCerrarIndefinida(excusa)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Cerrar</span>
                    </button>
                  )}

                  {isStaff && onRegistrarSeguimiento && (
                    <button
                      onClick={() => onRegistrarSeguimiento(excusa)}
                      title="Registrar observación"
                      className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer border border-purple-200"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Vista de Escritorio y Pantallas Medianas (>= md): Tabla Estructurada */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Radicado</th>
                {showEstudianteCol && <th className="py-3.5 px-4">Estudiante / Grado</th>}
                <th className="py-3.5 px-4">Período de Ausencia</th>
                <th className="py-3.5 px-4">Modalidad</th>
                <th className="py-3.5 px-4">Motivo</th>
                <th className="py-3.5 px-4 text-center">Anexos</th>
                <th className="py-3.5 px-4 text-center">Seguimiento</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {excusas.map((excusa) => {
                const tieneRestringido = excusa.anexos?.some(a => Boolean(a.es_restringido));
                const estaAbierta = Boolean(excusa.es_indefinida) && !excusa.fecha_retorno;

                return (
                  <tr key={excusa.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Radicado */}
                    <td className="py-3 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                      {excusa.radicado}
                    </td>

                    {/* Estudiante / Grado */}
                    {showEstudianteCol && (
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {excusa.estudiante_nombre} {excusa.estudiante_apellido}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span>Doc: {excusa.estudiante_doc}</span>
                          {excusa.curso_grado && (
                            <span className="font-semibold text-blue-700 bg-blue-50 px-1 py-0.2 rounded">
                              {excusa.curso_grado}
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Período */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">
                        Desde: {excusa.fecha_desde}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {excusa.es_indefinida ? (
                          <span className="text-amber-700 font-semibold">Indefinida</span>
                        ) : (
                          <span>Hasta: {excusa.fecha_hasta}</span>
                        )}
                      </div>
                    </td>

                    {/* Modalidad */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <ModalidadBadge
                        esIndefinida={Boolean(excusa.es_indefinida)}
                        fechaRetorno={excusa.fecha_retorno}
                      />
                    </td>

                    {/* Motivo */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 line-clamp-1" title={excusa.motivo}>
                        {excusa.motivo}
                      </span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">
                        {excusa.descripcion}
                      </span>
                    </td>

                    {/* Anexos */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {excusa.anexos && excusa.anexos.length > 0 ? (
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                            {excusa.anexos.length}
                          </span>
                          {tieneRestringido && (
                            <RestringidoBadge isDocente={isDocente} />
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Sin anexo</span>
                      )}
                    </td>

                    {/* Seguimientos */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        {excusa.total_seguimientos || 0}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Ver Detalle */}
                        <button
                          onClick={() => onVerDetalle(excusa)}
                          title="Ver detalle completo"
                          className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Cerrar Excusa Indefinida (HU-08) */}
                        {estaAbierta && onCerrarIndefinida && (
                          <button
                            onClick={() => onCerrarIndefinida(excusa)}
                            title="Cerrar excusa indefinida (HU-08)"
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Cerrar</span>
                          </button>
                        )}

                        {/* Registrar Seguimiento (HU-06) */}
                        {isStaff && onRegistrarSeguimiento && (
                          <button
                            onClick={() => onRegistrarSeguimiento(excusa)}
                            title="Registrar observación de seguimiento institucional"
                            className="p-1.5 text-slate-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
