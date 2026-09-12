import fs from 'fs';
import path from 'path';
import { query } from '../config/db.js';

// HU-03 y HU-09: Descarga y streaming seguro de anexos con validación de confidencialidad
export async function descargarAnexo(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    // Consultar anexo y su excusa asociada
    const rows = await query(`
      SELECT 
        a.id, a.id_excusa, a.nombre_original, a.nombre_tecnico, a.ruta_archivo, a.es_restringido,
        e.id_estudiante, e.radicado
      FROM \`G1-anexo\` a
      INNER JOIN \`G1-excusa\` e ON a.id_excusa = e.id
      WHERE a.id = ?
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Archivo anexo no encontrado.'
      });
    }

    const anexo = rows[0];
    const userRoleId = Number(user.id_rol);

    // HU-09: Regla de anexos restringidos
    // Si es_restringido = 1:
    // - Coordinador (rol 1): ACCESO PERMITIDO
    // - El propio estudiante autor (id_estudiante = user.id): ACCESO PERMITIDO
    // - Docentes (rol 2) u otros: ACCESO DENEGADO con aviso explícito
    if (Boolean(anexo.es_restringido)) {
      const isCoordinador = (userRoleId === 1);
      const isOwner = (user.id === anexo.id_estudiante);

      if (!isCoordinador && !isOwner) {
        return res.status(403).json({
          success: false,
          es_restringido: true,
          message: 'Documento confidencial: Este anexo contiene información sensible o reserva médica, accesible únicamente por la Coordinación escolar de la IED La Victoria (HU-09).'
        });
      }
    }

    // Verificar existencia física del archivo
    if (!fs.existsSync(anexo.ruta_archivo)) {
      return res.status(404).json({
        success: false,
        message: 'El archivo físico no se encuentra disponible en el almacenamiento del servidor.'
      });
    }

    // Descarga segura con nombre original
    return res.download(anexo.ruta_archivo, anexo.nombre_original);
  } catch (error) {
    next(error);
  }
}

// Obtener metadata del anexo
export async function obtenerInfoAnexo(req, res, next) {
  try {
    const { id } = req.params;
    const rows = await query(`
      SELECT a.id, a.id_excusa, a.nombre_original, a.es_restringido, a.fecha_subida,
             e.radicado, e.id_estudiante
      FROM \`G1-anexo\` a
      INNER JOIN \`G1-excusa\` e ON a.id_excusa = e.id
      WHERE a.id = ?
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Anexo no encontrado.'
      });
    }

    const anexo = rows[0];
    const isDocente = Number(req.user.id_rol) === 2;

    return res.status(200).json({
      success: true,
      anexo: {
        ...anexo,
        puede_descargar: !(anexo.es_restringido && isDocente)
      }
    });
  } catch (error) {
    next(error);
  }
}
