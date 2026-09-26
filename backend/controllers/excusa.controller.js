import fs from 'fs';
import { query, pool } from '../config/db.js';
import { generarRadicadoUnico } from '../services/radicado.service.js';

// Helper para obtener el siguiente ID seguro si la tabla no tiene AUTO_INCREMENT
async function getNextId(tableName) {
  const rows = await query(`SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM \`${tableName}\``);
  return rows[0].nextId;
}

// HU-02: Radicar nueva excusa
export async function crearExcusa(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      fecha_desde,
      fecha_hasta,
      es_indefinida,
      motivo,
      descripcion,
      datos_contacto,
      es_restringido
    } = req.body;

    // Determinar el estudiante destinatario:
    // Si el usuario autenticado es estudiante (rol 3), id_estudiante es req.user.id
    // Si es personal administrativo, puede especificar id_estudiante
    let id_estudiante = req.user.id;
    if (Number(req.user.id_rol) !== 3 && req.body.id_estudiante) {
      id_estudiante = parseInt(req.body.id_estudiante, 10);
    }

    if (!fecha_desde || !motivo || !descripcion || !datos_contacto) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Los campos fecha_desde, motivo, descripción y datos de contacto son obligatorios.'
      });
    }

    const isIndefinida = (es_indefinida === 'true' || es_indefinida === true || es_indefinida === 1);
    let finalFechaHasta = null;

    if (!isIndefinida) {
      if (!fecha_hasta) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Debe especificar la fecha_hasta o marcar la excusa como indefinida.'
        });
      }
      if (new Date(fecha_hasta) < new Date(fecha_desde)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'La fecha final no puede ser anterior a la fecha de inicio.'
        });
      }
      finalFechaHasta = fecha_hasta;
    }

    // Validación de solapamiento: Impedir que un estudiante tenga múltiples excusas activas en el mismo período
    const finPeriodoNuevo = isIndefinida ? '9999-12-31' : finalFechaHasta;
    const [solapadas] = await connection.query(`
      SELECT id, radicado, fecha_desde, fecha_hasta, es_indefinida, fecha_retorno
      FROM \`G1-excusa\`
      WHERE id_estudiante = ?
        AND es_anulada = 0
        AND ? <= COALESCE(fecha_retorno, fecha_hasta, '9999-12-31')
        AND fecha_desde <= ?
      LIMIT 1
    `, [id_estudiante, fecha_desde, finPeriodoNuevo]);

    if (solapadas && solapadas.length > 0) {
      await connection.rollback();
      const solape = solapadas[0];
      const periodoExistente = solape.es_indefinida
        ? (solape.fecha_retorno ? `${solape.fecha_desde} hasta retorno ${solape.fecha_retorno}` : `${solape.fecha_desde} en adelante (Indefinida abierta)`)
        : `${solape.fecha_desde} al ${solape.fecha_hasta}`;
      return res.status(400).json({
        success: false,
        message: `El estudiante ya tiene una excusa activa que cubre este período de tiempo (Radicado: ${solape.radicado}, Período: ${periodoExistente}). Si se cometió un error en las fechas, la excusa anterior debe ser anulada previamente para liberar el calendario escolar.`,
        conflicto: {
          id: solape.id,
          radicado: solape.radicado,
          periodo: periodoExistente
        }
      });
    }

    // Generar radicado institucional único
    const radicado = await generarRadicadoUnico();

    // Obtener siguiente ID para G1-excusa
    const [nextIdRows] = await connection.query('SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM `G1-excusa`');
    const excusaId = nextIdRows[0].nextId;

    await connection.query(
      `INSERT INTO \`G1-excusa\`
       (id, radicado, id_estudiante, fecha_desde, fecha_hasta, es_indefinida, fecha_retorno, motivo, descripcion, datos_contacto, fecha_creacion, es_anulada)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NOW(), 0)`,
      [
        excusaId,
        radicado,
        id_estudiante,
        fecha_desde,
        finalFechaHasta,
        isIndefinida ? 1 : 0,
        motivo.trim(),
        descripcion.trim(),
        datos_contacto.trim()
      ]
    );

    // HU-03 y HU-09: Si se adjuntaron anexos (admite hasta 5 archivos y máx 30 MB en conjunto)
    const archivos = req.archivosAdjuntos || (Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []));
    const isRestringido = (es_restringido === 'true' || es_restringido === true || es_restringido === 1);
    const anexosRegistrados = [];

    if (archivos && archivos.length > 0) {
      const [nextAnexoIdRows] = await connection.query('SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM `G1-anexo`');
      let currentAnexoId = Number(nextAnexoIdRows[0].nextId);

      for (const archivo of archivos) {
        await connection.query(
          `INSERT INTO \`G1-anexo\`
           (id, id_excusa, nombre_original, nombre_tecnico, ruta_archivo, es_restringido, fecha_subida)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            currentAnexoId,
            excusaId,
            archivo.originalname,
            archivo.filename,
            archivo.path,
            isRestringido ? 1 : 0
          ]
        );

        anexosRegistrados.push({
          id: currentAnexoId,
          nombre_original: archivo.originalname,
          es_restringido: isRestringido
        });

        currentAnexoId++;
      }
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Excusa radicada exitosamente en el sistema.',
      radicado,
      excusa: {
        id: excusaId,
        radicado,
        id_estudiante,
        fecha_desde,
        fecha_hasta: finalFechaHasta,
        es_indefinida: isIndefinida,
        motivo,
        anexo: anexosRegistrados[0] || null,
        anexos: anexosRegistrados
      }
    });
  } catch (error) {
    await connection.rollback();
    const archivos = req.archivosAdjuntos || (Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []));
    if (archivos && archivos.length > 0) {
      archivos.forEach((f) => {
        try {
          if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
        } catch (_) {}
      });
    }
    next(error);
  } finally {
    connection.release();
  }
}

// HU-04: Consulta diaria y filtros avanzados
export async function listarExcusas(req, res, next) {
  try {
    const {
      solo_hoy,
      fecha_desde,
      fecha_hasta,
      id_curso,
      estudiante,
      motivo,
      es_indefinida,
      abiertas
    } = req.query;

    const user = req.user;
    let whereClauses = [];
    let params = [];

    // Si el usuario es Estudiante (rol 3), solo consulta sus propias excusas
    if (Number(user.id_rol) === 3) {
      whereClauses.push('e.id_estudiante = ?');
      params.push(user.id);
    }

    // Filtro de solo abiertas (para HU-08)
    if (abiertas === 'true') {
      whereClauses.push('e.es_indefinida = 1 AND e.fecha_retorno IS NULL AND e.es_anulada = 0');
    }

    // Filtro por defecto de novedades del día (HU-04)
    if (solo_hoy === 'true') {
      whereClauses.push(`(
        e.es_anulada = 0 AND (
          (e.fecha_desde <= CURDATE() AND (
            (e.es_indefinida = 0 AND e.fecha_hasta >= CURDATE()) OR
            (e.es_indefinida = 1 AND (e.fecha_retorno IS NULL OR e.fecha_retorno >= CURDATE()))
          ))
          OR DATE(e.fecha_creacion) = CURDATE()
        )
      )`);
    }

    // Filtros por rango de fechas
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

    // Filtro por curso / grado
    if (id_curso) {
      whereClauses.push('ucv.id_curso = ?');
      params.push(id_curso);
    }

    // Filtro por texto de estudiante (nombre, apellido o identificación)
    if (estudiante && estudiante.trim() !== '') {
      whereClauses.push(`(
        u.nombre LIKE ? OR 
        u.apellido LIKE ? OR 
        u.identificacion LIKE ? OR 
        u.usuario LIKE ?
      )`);
      const term = `%${estudiante.trim()}%`;
      params.push(term, term, term, term);
    }

    // Filtro por motivo
    if (motivo && motivo.trim() !== '') {
      whereClauses.push('e.motivo = ?');
      params.push(motivo.trim());
    }

    // Filtro por es_indefinida
    if (es_indefinida === 'true' || es_indefinida === '1') {
      whereClauses.push('e.es_indefinida = 1');
    } else if (es_indefinida === 'false' || es_indefinida === '0') {
      whereClauses.push('e.es_indefinida = 0');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT 
        e.id, e.radicado, e.id_estudiante, e.fecha_desde, e.fecha_hasta,
        e.es_indefinida, e.fecha_retorno, e.motivo, e.descripcion,
        e.datos_contacto, e.fecha_creacion,
        e.es_anulada, e.motivo_anulacion, e.fecha_anulacion, e.id_usuario_anulacion,
        TIMESTAMPDIFF(SECOND, e.fecha_creacion, NOW()) AS segundos_desde_creacion,
        u_anul.nombre AS anulador_nombre,
        u_anul.apellido AS anulador_apellido,
        r_anul.nombre AS anulador_rol,
        u.nombre AS estudiante_nombre,
        u.apellido AS estudiante_apellido,
        u.identificacion AS estudiante_doc,
        u.email AS estudiante_email,
        c.id AS curso_id,
        c.grado AS curso_grado,
        (SELECT COUNT(*) FROM \`G1-anexo\` a WHERE a.id_excusa = e.id) AS total_anexos,
        (SELECT COUNT(*) FROM \`G1-seguimiento\` s WHERE s.id_excusa = e.id) AS total_seguimientos
      FROM \`G1-excusa\` e
      INNER JOIN usuario u ON e.id_estudiante = u.id
      LEFT JOIN usuario u_anul ON e.id_usuario_anulacion = u_anul.id
      LEFT JOIN rol r_anul ON u_anul.id_rol = r_anul.id
      LEFT JOIN usuario_curso_vigencia ucv ON ucv.id_usuario = u.id AND ucv.id_vigencia = (
        SELECT CAST(valor AS UNSIGNED) FROM configuracion WHERE clave = 'vigencia_activa' LIMIT 1
      )
      LEFT JOIN curso c ON ucv.id_curso = c.id
      ${whereSql}
      ORDER BY e.fecha_creacion DESC
    `;

    const excusas = await query(sql, params);

    // Para cada excusa, consultar sus anexos para mostrar metadata y badges (HU-09)
    const excusaIds = excusas.map(e => e.id);
    let anexosMap = {};

    if (excusaIds.length > 0) {
      const placeholders = excusaIds.map(() => '?').join(',');
      const anexos = await query(
        `SELECT id, id_excusa, nombre_original, es_restringido, fecha_subida
         FROM \`G1-anexo\`
         WHERE id_excusa IN (${placeholders})`,
        excusaIds
      );
      anexos.forEach(a => {
        if (!anexosMap[a.id_excusa]) anexosMap[a.id_excusa] = [];
        anexosMap[a.id_excusa].push(a);
      });
    }

    const resultados = excusas.map(e => ({
      ...e,
      anexos: anexosMap[e.id] || []
    }));

    return res.status(200).json({
      success: true,
      total: resultados.length,
      excusas: resultados
    });
  } catch (error) {
    next(error);
  }
}

// Obtener detalle de una excusa con sus anexos y observaciones de seguimiento
export async function detalleExcusa(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    const rows = await query(`
      SELECT 
        e.*,
        TIMESTAMPDIFF(SECOND, e.fecha_creacion, NOW()) AS segundos_desde_creacion,
        u_anul.nombre AS anulador_nombre,
        u_anul.apellido AS anulador_apellido,
        r_anul.nombre AS anulador_rol,
        u.nombre AS estudiante_nombre,
        u.apellido AS estudiante_apellido,
        u.identificacion AS estudiante_doc,
        u.email AS estudiante_email,
        c.grado AS curso_grado
      FROM \`G1-excusa\` e
      INNER JOIN usuario u ON e.id_estudiante = u.id
      LEFT JOIN usuario u_anul ON e.id_usuario_anulacion = u_anul.id
      LEFT JOIN rol r_anul ON u_anul.id_rol = r_anul.id
      LEFT JOIN usuario_curso_vigencia ucv ON ucv.id_usuario = u.id AND ucv.id_vigencia = (
        SELECT CAST(valor AS UNSIGNED) FROM configuracion WHERE clave = 'vigencia_activa' LIMIT 1
      )
      LEFT JOIN curso c ON ucv.id_curso = c.id
      WHERE e.id = ?
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Excusa no encontrada.'
      });
    }

    const excusa = rows[0];

    // Si es estudiante, solo puede ver la suya
    if (Number(user.id_rol) === 3 && excusa.id_estudiante !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para acceder a esta excusa.'
      });
    }

    // Anexos
    const anexos = await query(`
      SELECT id, id_excusa, nombre_original, es_restringido, fecha_subida
      FROM \`G1-anexo\`
      WHERE id_excusa = ?
      ORDER BY id ASC
    `, [id]);

    // Seguimientos (HU-06)
    const seguimientos = await query(`
      SELECT 
        s.id, s.id_excusa, s.id_usuario, s.observacion, s.fecha_hora,
        TIMESTAMPDIFF(SECOND, s.fecha_hora, NOW()) AS segundos_transcurridos,
        u.nombre AS autor_nombre, u.apellido AS autor_apellido, r.nombre AS autor_rol
      FROM \`G1-seguimiento\` s
      INNER JOIN usuario u ON s.id_usuario = u.id
      INNER JOIN rol r ON u.id_rol = r.id
      WHERE s.id_excusa = ?
      ORDER BY s.fecha_hora ASC
    `, [id]);

    return res.status(200).json({
      success: true,
      excusa: {
        ...excusa,
        anexos,
        seguimientos
      }
    });
  } catch (error) {
    next(error);
  }
}

// HU-05: Línea de tiempo acumulada del estudiante a través de sus años lectivos
export async function timelineEstudiante(req, res, next) {
  try {
    const { id_estudiante } = req.params;
    const user = req.user;

    const targetStudentId = parseInt(id_estudiante, 10);

    // Si el usuario es Estudiante, solo puede ver su propia línea de tiempo
    if (Number(user.id_rol) === 3 && targetStudentId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para ver el historial de otro estudiante.'
      });
    }

    // Información del estudiante
    const studentRows = await query(`
      SELECT u.id, u.identificacion, u.usuario, u.nombre, u.apellido, u.email
      FROM usuario u
      WHERE u.id = ? AND u.id_rol = 3
      LIMIT 1
    `, [targetStudentId]);

    if (studentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado.'
      });
    }

    const estudiante = studentRows[0];

    // Cursos y vigencias en los que ha estado matriculado
    const matriculas = await query(`
      SELECT ucv.id_vigencia, v.fecha_inicio, v.fecha_fin, c.id AS id_curso, c.grado
      FROM usuario_curso_vigencia ucv
      INNER JOIN vigencia v ON ucv.id_vigencia = v.id
      INNER JOIN curso c ON ucv.id_curso = c.id
      WHERE ucv.id_usuario = ?
      ORDER BY ucv.id_vigencia DESC
    `, [targetStudentId]);

    // Excusas históricas del estudiante
    const excusas = await query(`
      SELECT 
        e.id, e.radicado, e.id_estudiante, e.fecha_desde, e.fecha_hasta,
        e.es_indefinida, e.fecha_retorno, e.motivo, e.descripcion,
        e.datos_contacto, e.fecha_creacion,
        e.es_anulada, e.motivo_anulacion, e.fecha_anulacion, e.id_usuario_anulacion,
        TIMESTAMPDIFF(SECOND, e.fecha_creacion, NOW()) AS segundos_desde_creacion,
        YEAR(e.fecha_desde) AS anio_lectivo,
        (SELECT COUNT(*) FROM \`G1-anexo\` a WHERE a.id_excusa = e.id) AS total_anexos,
        (SELECT COUNT(*) FROM \`G1-seguimiento\` s WHERE s.id_excusa = e.id) AS total_seguimientos
      FROM \`G1-excusa\` e
      WHERE e.id_estudiante = ?
      ORDER BY e.fecha_desde DESC, e.fecha_creacion DESC
    `, [targetStudentId]);

    // Asociar a cada excusa el curso que cursaba en ese año según matrícula
    const timeline = excusas.map(item => {
      const anioExcusa = new Date(item.fecha_desde).getFullYear();
      const matriculaAnio = matriculas.find(m => m.id_vigencia === anioExcusa) || matriculas[0];
      return {
        ...item,
        curso_historico: matriculaAnio ? matriculaAnio.grado : 'Sin registrar'
      };
    });

    return res.status(200).json({
      success: true,
      estudiante,
      matriculas,
      timeline
    });
  } catch (error) {
    next(error);
  }
}

// HU-08: Cierre formal de excusa indefinida (requiere fecha_retorno y soporte médico obligatorio)
export async function cerrarExcusaIndefinida(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { fecha_retorno } = req.body;
    const user = req.user;

    if (!fecha_retorno) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe especificar la fecha de retorno a clases.'
      });
    }

    // Consultar excusa
    const [rows] = await connection.query(
      'SELECT * FROM `G1-excusa` WHERE id = ? LIMIT 1',
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Excusa no encontrada.'
      });
    }

    const excusa = rows[0];

    if (excusa.es_anulada) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'No es posible cerrar una excusa que ha sido anulada.'
      });
    }

    // Si es estudiante, validar que sea su excusa
    if (Number(user.id_rol) === 3 && excusa.id_estudiante !== user.id) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'No tiene autorización para modificar esta excusa.'
      });
    }

    if (!excusa.es_indefinida) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Esta excusa tiene una fecha límite definida. Solo las excusas indefinidas requieren cierre formal.'
      });
    }

    if (excusa.fecha_retorno) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Esta excusa ya fue cerrada formalmente con fecha de retorno: ${excusa.fecha_retorno}`
      });
    }

    // Validar que fecha_retorno >= fecha_desde
    if (new Date(fecha_retorno) < new Date(excusa.fecha_desde)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'La fecha de retorno no puede ser anterior a la fecha de inicio de la inasistencia.'
      });
    }

    // 1. Actualizar fecha_retorno
    await connection.query(
      'UPDATE `G1-excusa` SET fecha_retorno = ? WHERE id = ?',
      [fecha_retorno, id]
    );

    // 2. Insertar soporte(s) médico(s) en G1-anexo si fueron adjuntados (opcional, máx 5 archivos y 30 MB)
    const { es_restringido } = req.body;
    const isRestringido = (es_restringido === 'true' || es_restringido === true || es_restringido === 1);
    const archivos = req.archivosAdjuntos || (Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []));
    const anexosRegistrados = [];

    if (archivos && archivos.length > 0) {
      const [nextAnexoIdRows] = await connection.query('SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM `G1-anexo`');
      let currentAnexoId = Number(nextAnexoIdRows[0].nextId);

      for (const archivo of archivos) {
        await connection.query(
          `INSERT INTO \`G1-anexo\`
           (id, id_excusa, nombre_original, nombre_tecnico, ruta_archivo, es_restringido, fecha_subida)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            currentAnexoId,
            id,
            archivo.originalname,
            archivo.filename,
            archivo.path,
            isRestringido ? 1 : 0
          ]
        );

        anexosRegistrados.push({
          id: currentAnexoId,
          nombre_original: archivo.originalname,
          es_restringido: isRestringido
        });

        currentAnexoId++;
      }
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: anexosRegistrados.length > 0
        ? `Excusa indefinida cerrada exitosamente con ${anexosRegistrados.length} archivo(s) de soporte adjunto(s).`
        : 'Excusa indefinida cerrada exitosamente.',
      excusa: {
        id: excusa.id,
        radicado: excusa.radicado,
        fecha_desde: excusa.fecha_desde,
        fecha_retorno,
        soporte_alta: anexosRegistrados.length > 0 ? anexosRegistrados[0].nombre_original : null,
        anexos: anexosRegistrados
      }
    });
  } catch (error) {
    await connection.rollback();
    const archivos = req.archivosAdjuntos || (Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []));
    if (archivos && archivos.length > 0) {
      archivos.forEach((f) => {
        try {
          if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
        } catch (_) {}
      });
    }
    next(error);
  } finally {
    connection.release();
  }
}

// Anular formalmente una excusa escolar
// - Docentes y Coordinadores: anulación directa en cualquier momento con motivo justificado.
// - Estudiante: anulación directa únicamente dentro de los primeros 15 minutos (900 seg) por error de radicación.
export async function anularExcusa(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { motivo } = req.body;
    const user = req.user;

    if (!motivo || typeof motivo !== 'string' || motivo.trim().length < 5) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe especificar una justificación o motivo de anulación válido (mínimo 5 caracteres).'
      });
    }

    const [rows] = await connection.query(`
      SELECT 
        e.*,
        TIMESTAMPDIFF(SECOND, e.fecha_creacion, NOW()) AS segundos_desde_creacion
      FROM \`G1-excusa\` e
      WHERE e.id = ?
      LIMIT 1
    `, [id]);

    if (!rows || rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Excusa no encontrada.'
      });
    }

    const excusa = rows[0];

    if (excusa.es_anulada) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Esta excusa ya se encuentra anulada.'
      });
    }

    const esStaff = (Number(user.id_rol) === 1 || Number(user.id_rol) === 2);
    const esEstudiante = (Number(user.id_rol) === 3);

    if (esEstudiante) {
      if (excusa.id_estudiante !== user.id) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'No tiene autorización para anular la excusa de otro estudiante.'
        });
      }

      // Regla de los 15 minutos (900 seg) para anulación autónoma por error de dedo
      if (excusa.segundos_desde_creacion > 900) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'El plazo de 15 minutos para la anulación autónoma por error de radicación ha expirado. Por favor solicite la anulación a su docente o coordinador de convivencia.'
        });
      }
    } else if (!esStaff) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para anular excusas escolares.'
      });
    }

    // 1. Marcar excusa como anulada en la base de datos
    await connection.query(`
      UPDATE \`G1-excusa\`
      SET 
        es_anulada = 1,
        motivo_anulacion = ?,
        fecha_anulacion = NOW(),
        id_usuario_anulacion = ?
      WHERE id = ?
    `, [motivo.trim(), user.id, id]);

    // 2. Registrar en G1-seguimiento para auditoría e inmutabilidad histórica
    const rolNombre = Number(user.id_rol) === 1 ? 'Coordinación' : (Number(user.id_rol) === 2 ? 'Docente' : 'Estudiante (Autor)');
    const observacionAuditoria = `[ANULACIÓN FORMAL] Excusa anulada por ${user.nombre} ${user.apellido} (${rolNombre}). Motivo: ${motivo.trim()}`;

    const [nextSegRows] = await connection.query('SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM `G1-seguimiento`');
    const segId = nextSegRows[0].nextId;

    await connection.query(`
      INSERT INTO \`G1-seguimiento\`
      (id, id_excusa, id_usuario, observacion, fecha_hora)
      VALUES (?, ?, ?, ?, NOW())
    `, [segId, id, user.id, observacionAuditoria]);

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Excusa anulada exitosamente. El período ha sido liberado en el calendario escolar.',
      excusa: {
        id: excusa.id,
        radicado: excusa.radicado,
        es_anulada: 1,
        motivo_anulacion: motivo.trim(),
        fecha_anulacion: new Date()
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

// Solicitar anulación formal de una excusa cuando el estudiante ya superó los 15 minutos
export async function solicitarAnulacionExcusa(req, res, next) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const user = req.user;

    if (!motivo || typeof motivo !== 'string' || motivo.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el motivo o descripción del error (mínimo 5 caracteres).'
      });
    }

    const rows = await query('SELECT * FROM `G1-excusa` WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Excusa no encontrada.'
      });
    }

    const excusa = rows[0];

    if (excusa.es_anulada) {
      return res.status(400).json({
        success: false,
        message: 'Esta excusa ya se encuentra anulada.'
      });
    }

    if (Number(user.id_rol) === 3 && excusa.id_estudiante !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para solicitar anulación de una excusa ajena.'
      });
    }

    const observacionSolicitud = `[SOLICITUD DE ANULACIÓN] Solicitud de anulación enviada por el estudiante ${user.nombre} ${user.apellido}. Motivo: ${motivo.trim()}`;

    const nextSegRows = await query('SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM `G1-seguimiento`');
    const segId = nextSegRows[0].nextId;

    await query(`
      INSERT INTO \`G1-seguimiento\`
      (id, id_excusa, id_usuario, observacion, fecha_hora)
      VALUES (?, ?, ?, ?, NOW())
    `, [segId, id, user.id, observacionSolicitud]);

    return res.status(200).json({
      success: true,
      message: 'Solicitud de anulación registrada y notificada exitosamente al personal docente y de coordinación.'
    });
  } catch (error) {
    next(error);
  }
}

