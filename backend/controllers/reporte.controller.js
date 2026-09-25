import { query } from '../config/db.js';

// HU-07: Exportación CSV con filtros activos - Exclusivo para Coordinador (id_rol = 1)
export async function exportarCsvExcusas(req, res, next) {
  try {
    const {
      solo_hoy,
      fecha_desde,
      fecha_hasta,
      id_curso,
      estudiante,
      motivo,
      es_indefinida
    } = req.query;

    let whereClauses = [];
    let params = [];

    if (solo_hoy === 'true') {
      whereClauses.push(`(
        (e.fecha_desde <= CURDATE() AND (
          (e.es_indefinida = 0 AND e.fecha_hasta >= CURDATE()) OR
          (e.es_indefinida = 1 AND (e.fecha_retorno IS NULL OR e.fecha_retorno >= CURDATE()))
        ))
        OR DATE(e.fecha_creacion) = CURDATE()
      )`);
    }

    if (fecha_desde && fecha_hasta) {
      whereClauses.push('(e.fecha_desde <= ? AND (e.fecha_hasta >= ? OR e.fecha_hasta IS NULL))');
      params.push(fecha_hasta, fecha_desde);
    } else if (fecha_desde) {
      whereClauses.push('(e.fecha_desde >= ? OR e.fecha_hasta >= ?)');
      params.push(fecha_desde, fecha_desde);
    } else if (fecha_hasta) {
      whereClauses.push('e.fecha_desde <= ?');
      params.push(fecha_hasta);
    }

    if (id_curso) {
      whereClauses.push('ucv.id_curso = ?');
      params.push(id_curso);
    }

    if (estudiante && estudiante.trim() !== '') {
      whereClauses.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.identificacion LIKE ?)');
      const term = `%${estudiante.trim()}%`;
      params.push(term, term, term);
    }

    if (motivo && motivo.trim() !== '') {
      whereClauses.push('e.motivo = ?');
      params.push(motivo.trim());
    }

    if (es_indefinida === 'true' || es_indefinida === '1') {
      whereClauses.push('e.es_indefinida = 1');
    } else if (es_indefinida === 'false' || es_indefinida === '0') {
      whereClauses.push('e.es_indefinida = 0');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT 
        e.id, e.radicado, e.fecha_desde, e.fecha_hasta, e.es_indefinida, e.fecha_retorno,
        e.motivo, e.descripcion, e.datos_contacto, e.fecha_creacion,
        u.nombre AS estudiante_nombre,
        u.apellido AS estudiante_apellido,
        u.identificacion AS estudiante_doc,
        c.grado AS curso_grado,
        (SELECT COUNT(*) FROM \`G1-anexo\` a WHERE a.id_excusa = e.id) AS total_anexos,
        (SELECT COUNT(*) FROM \`G1-anexo\` a WHERE a.id_excusa = e.id AND a.es_restringido = 1) AS anexos_restringidos,
        (SELECT COUNT(*) FROM \`G1-seguimiento\` s WHERE s.id_excusa = e.id) AS total_seguimientos
      FROM \`G1-excusa\` e
      INNER JOIN usuario u ON e.id_estudiante = u.id
      LEFT JOIN usuario_curso_vigencia ucv ON ucv.id_usuario = u.id AND ucv.id_vigencia = (
        SELECT CAST(valor AS UNSIGNED) FROM configuracion WHERE clave = 'vigencia_activa' LIMIT 1
      )
      LEFT JOIN curso c ON ucv.id_curso = c.id
      ${whereSql}
      ORDER BY e.fecha_creacion DESC
    `;

    const excusas = await query(sql, params);

    // Formatear filas en CSV con escape seguro
    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return `"${clean}"`;
    };

    const headers = [
      'Radicado',
      'Estudiante',
      'Documento de Identidad',
      'Curso / Grado',
      'Fecha Inicio (Desde)',
      'Fecha Fin (Hasta)',
      'Modalidad',
      'Fecha Retorno',
      'Estado Cierre',
      'Motivo',
      'Descripción de los Hechos',
      'Datos de Contacto Acudiente',
      'Cantidad Anexos',
      'Contiene Anexo Restringido',
      'Observaciones Seguimiento',
      'Fecha y Hora Radicación'
    ];

    const rows = excusas.map(item => {
      const modalidad = item.es_indefinida ? 'Indefinida' : 'Definida';
      const estadoCierre = item.es_indefinida
        ? (item.fecha_retorno ? `Cerrada (${item.fecha_retorno})` : 'Abierta (Pendiente Cierre)')
        : 'Finalizada';
      const tieneRestringido = item.anexos_restringidos > 0 ? 'SÍ (Confidencial)' : 'NO';

      return [
        escapeCsv(item.radicado),
        escapeCsv(`${item.estudiante_nombre} ${item.estudiante_apellido}`),
        escapeCsv(item.estudiante_doc),
        escapeCsv(item.curso_grado || 'N/A'),
        escapeCsv(item.fecha_desde),
        escapeCsv(item.fecha_hasta || 'Indefinida'),
        escapeCsv(modalidad),
        escapeCsv(item.fecha_retorno || 'N/A'),
        escapeCsv(estadoCierre),
        escapeCsv(item.motivo),
        escapeCsv(item.descripcion),
        escapeCsv(item.datos_contacto),
        escapeCsv(item.total_anexos),
        escapeCsv(tieneRestringido),
        escapeCsv(item.total_seguimientos),
        escapeCsv(item.fecha_creacion)
      ].join(';');
    });

    // UTF-8 BOM para apertura perfecta en Excel en español con separador punto y coma
    const bom = '\uFEFF';
    const csvContent = bom + headers.join(';') + '\n' + rows.join('\n');

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_excusas_ied_lavictoria_${dateStr}.csv"`);

    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}
