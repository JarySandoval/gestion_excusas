import { query } from '../config/db.js';

// HU-06: Registrar observación institucional de seguimiento
export async function registrarSeguimiento(req, res, next) {
  try {
    const { id } = req.params; // id_excusa
    const { observacion } = req.body;
    const user = req.user;

    if (!observacion || typeof observacion !== 'string' || observacion.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'La observación no puede estar vacía.'
      });
    }

    // Verificar existencia de la excusa
    const excusaRows = await query('SELECT id, radicado FROM `G1-excusa` WHERE id = ? LIMIT 1', [id]);
    if (excusaRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Excusa no encontrada.'
      });
    }

    // Obtener siguiente ID para G1-seguimiento
    const nextIdRows = await query('SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM `G1-seguimiento`');
    const seguimientoId = nextIdRows[0].nextId;

    await query(
      `INSERT INTO \`G1-seguimiento\` (id, id_excusa, id_usuario, observacion, fecha_hora)
       VALUES (?, ?, ?, ?, NOW())`,
      [seguimientoId, id, user.id, observacion.trim()]
    );

    // Consultar el registro insertado con datos del autor y tiempo transcurrido
    const rows = await query(`
      SELECT 
        s.id, s.id_excusa, s.id_usuario, s.observacion, s.fecha_hora,
        TIMESTAMPDIFF(SECOND, s.fecha_hora, NOW()) AS segundos_transcurridos,
        u.nombre AS autor_nombre, u.apellido AS autor_apellido, r.nombre AS autor_rol
      FROM \`G1-seguimiento\` s
      INNER JOIN usuario u ON s.id_usuario = u.id
      INNER JOIN rol r ON u.id_rol = r.id
      WHERE s.id = ?
      LIMIT 1
    `, [seguimientoId]);

    return res.status(201).json({
      success: true,
      message: 'Observación de seguimiento registrada exitosamente.',
      seguimiento: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// Listar observaciones de una excusa
export async function listarSeguimientos(req, res, next) {
  try {
    const { id } = req.params; // id_excusa

    const rows = await query(`
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
      seguimientos: rows
    });
  } catch (error) {
    next(error);
  }
}

// Editar observación de seguimiento (solo durante los primeros 15 minutos tras su creación)
export async function editarSeguimiento(req, res, next) {
  try {
    const { id } = req.params;
    const { observacion } = req.body;
    const user = req.user;

    if (!observacion || typeof observacion !== 'string' || observacion.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'La observación no puede estar vacía.'
      });
    }

    // Consultar el registro y calcular segundos transcurridos directamente desde MySQL
    const rows = await query(`
      SELECT 
        s.id, s.id_excusa, s.id_usuario, s.observacion, s.fecha_hora,
        TIMESTAMPDIFF(SECOND, s.fecha_hora, NOW()) AS segundos_transcurridos
      FROM \`G1-seguimiento\` s
      WHERE s.id = ?
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Observación de seguimiento no encontrada.'
      });
    }

    const seguimiento = rows[0];

    // Verificar que solo el autor pueda editar su propia observación
    if (seguimiento.id_usuario !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Solo el autor que registró esta observación puede editarla.'
      });
    }

    // Regla de negocio: sólo editable durante los primeros 15 minutos (900 segundos)
    const LIMITE_MINUTOS = 15;
    const LIMITE_SEGUNDOS = LIMITE_MINUTOS * 60;

    if (seguimiento.segundos_transcurridos > LIMITE_SEGUNDOS) {
      return res.status(400).json({
        success: false,
        message: `El tiempo límite para editar esta observación (${LIMITE_MINUTOS} minutos) ha expirado. Si ya no es válida o necesita corregirla, debe eliminarla.`,
        tiempoExpirado: true
      });
    }

    // Actualizar texto de la observación manteniendo intacta la fecha de creación original
    await query(
      'UPDATE `G1-seguimiento` SET observacion = ? WHERE id = ?',
      [observacion.trim(), id]
    );

    // Consultar registro actualizado con datos de autor
    const updatedRows = await query(`
      SELECT 
        s.id, s.id_excusa, s.id_usuario, s.observacion, s.fecha_hora,
        TIMESTAMPDIFF(SECOND, s.fecha_hora, NOW()) AS segundos_transcurridos,
        u.nombre AS autor_nombre, u.apellido AS autor_apellido, r.nombre AS autor_rol
      FROM \`G1-seguimiento\` s
      INNER JOIN usuario u ON s.id_usuario = u.id
      INNER JOIN rol r ON u.id_rol = r.id
      WHERE s.id = ?
      LIMIT 1
    `, [id]);

    return res.status(200).json({
      success: true,
      message: 'Observación de seguimiento actualizada exitosamente.',
      seguimiento: updatedRows[0]
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar observación de seguimiento (Autor o Coordinador)
export async function eliminarSeguimiento(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    const rows = await query(`
      SELECT s.id, s.id_excusa, s.id_usuario
      FROM \`G1-seguimiento\` s
      WHERE s.id = ?
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Observación de seguimiento no encontrada.'
      });
    }

    const seguimiento = rows[0];

    // Permisos: Solo el autor o un Coordinador (rol 1) pueden eliminar
    const esAutor = seguimiento.id_usuario === user.id;
    const esCoordinador = Number(user.id_rol) === 1;

    if (!esAutor && !esCoordinador) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para eliminar esta observación de seguimiento.'
      });
    }

    await query('DELETE FROM `G1-seguimiento` WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Observación de seguimiento eliminada exitosamente.',
      id: Number(id),
      id_excusa: seguimiento.id_excusa
    });
  } catch (error) {
    next(error);
  }
}
