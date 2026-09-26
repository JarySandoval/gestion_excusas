/**
 * Cálculo centralizado de los estados de excusas escolares:
 * - Anulada: Excusa dejada sin efecto formalmente (por error de radicación u orden docente).
 *            Libera el calendario y no cuenta en las estadísticas de faltas justificadas activas.
 * - Vigente: En curso actualmente.
 *   * Definida: dentro del rango de fechas (fecha_hasta >= hoy).
 *   * Indefinida sin retorno: aún no se ha registrado la fecha de retorno.
 *   * Indefinida con retorno futuro: formalmente cerrada pero el estudiante aún no llega a la fecha de regreso a clases (retorno > hoy).
 * - Expirada: Excusa definida cuyo período concluyó por calendario (fecha_hasta < hoy).
 * - Terminada: Excusa indefinida formalmente cerrada cuya fecha de retorno ya se cumplió o pasó (retorno <= hoy).
 */
export function calcularEstadoExcusa({ esIndefinida, fechaRetorno, fechaHasta, esAnulada, motivoAnulacion }) {
  const indef = Boolean(esIndefinida);

  // Caso 0: Excusa Anulada (máxima precedencia)
  if (esAnulada) {
    return {
      estado: 'Anulada',
      subtexto: 'Anulada',
      tipo: 'anulada',
      modalidad: indef ? 'Indefinida' : 'Definida',
      descripcion: motivoAnulacion ? `Excusa escolar anulada: ${motivoAnulacion}` : 'Excusa escolar formalmente anulada'
    };
  }

  const d = new Date();
  const hoyStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const retornoStr = fechaRetorno ? String(fechaRetorno).slice(0, 10) : null;
  const hastaStr = fechaHasta ? String(fechaHasta).slice(0, 10) : null;

  // Caso 1: Excusa Indefinida
  if (indef) {
    if (retornoStr) {
      // Si la fecha de retorno es en el futuro, el estudiante sigue incapacitado/ausente hoy -> sigue VIGENTE
      if (retornoStr > hoyStr) {
        return {
          estado: 'Vigente',
          subtexto: `Retorna ${retornoStr}`,
          tipo: 'vigente',
          modalidad: 'Indefinida',
          descripcion: `Excusa indefinida con retorno programado para el ${retornoStr}. El estudiante aún se encuentra dentro del período justificado.`
        };
      }
      // La fecha de retorno ya llegó o pasó -> TERMINADA
      return {
        estado: 'Terminada',
        subtexto: retornoStr,
        tipo: 'terminada',
        modalidad: 'Indefinida',
        descripcion: `Excusa indefinida concluida formalmente. Reintegro a clases registrado para el ${retornoStr}`
      };
    }

    return {
      estado: 'Vigente',
      subtexto: 'Indefinida',
      tipo: 'vigente',
      modalidad: 'Indefinida',
      descripcion: 'Excusa indefinida actualmente en curso (pendiente de reintegro)'
    };
  }

  // Caso 2: Excusa Definida
  if (hastaStr && hastaStr < hoyStr) {
    return {
      estado: 'Expirada',
      subtexto: hastaStr,
      tipo: 'expirada',
      modalidad: 'Definida',
      descripcion: `Excusa definida cuyo plazo finalizó el ${hastaStr}`
    };
  }

  return {
    estado: 'Vigente',
    subtexto: hastaStr ? `Hasta ${hastaStr}` : 'Definida',
    tipo: 'vigente',
    modalidad: 'Definida',
    descripcion: hastaStr ? `Excusa definida vigente hasta el ${hastaStr}` : 'Excusa definida vigente'
  };
}
