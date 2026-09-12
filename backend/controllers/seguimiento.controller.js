import { query } from '../config/db.js';

// HU-06: Registrar observación institucional de seguimiento
export async function registrarSeguimiento(req, res, next) {
  try {
    const { id } = req.params; // id_excusa
    const { observacion } = req.body;
    const user = req.user;

    if (!observacion || observacion.trim() === '') {
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

    // Consultar el registro insertado con datos del autor
    const rows = await query(`
      SELECT 
        s.id, s.id_excusa, s.id_usuario, s.observacion, s.fecha_hora,
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
