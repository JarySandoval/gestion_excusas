import { query } from '../config/db.js';

export async function listarCursos(req, res, next) {
  try {
    const cursos = await query('SELECT id, grado FROM curso ORDER BY id ASC');
    return res.status(200).json({
      success: true,
      cursos
    });
  } catch (error) {
    next(error);
  }
}

export async function getVigenciaActiva(req, res, next) {
  try {
    const rows = await query("SELECT valor, descripcion FROM configuracion WHERE clave = 'vigencia_activa' LIMIT 1");
    const valor = rows.length > 0 ? rows[0].valor : '2026';
    return res.status(200).json({
      success: true,
      vigencia: valor
    });
  } catch (error) {
    next(error);
  }
}

export async function listarMotivos(req, res) {
  const motivos = [
    { id: 'Cita Médica', nombre: 'Cita Médica / Odontológica' },
    { id: 'Incapacidad Médica', nombre: 'Incapacidad / Enfermedad General' },
    { id: 'Calamidad Familiar', nombre: 'Calamidad Familiar' },
    { id: 'Duelo o Luto', nombre: 'Duelo / Sepelio' },
    { id: 'Diligencia Legal', nombre: 'Diligencia Legal / Documentos' },
    { id: 'Aislamiento Preventivo', nombre: 'Aislamiento Preventivo / Salud Pública' },
    { id: 'Fuerza Mayor', nombre: 'Fuerza Mayor / Movilidad' },
    { id: 'Otro', nombre: 'Otro Motivo Justificado' }
  ];

  return res.status(200).json({
    success: true,
    motivos
  });
}

// Listar estudiantes para búsqueda administrativa (solo personal docente/coordinación)
export async function listarEstudiantes(req, res, next) {
  try {
    const { busqueda, id_curso } = req.query;
    let whereClauses = ['u.id_rol = 3', 'u.id_estado = 1'];
    let params = [];

    if (busqueda && busqueda.trim() !== '') {
      whereClauses.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.identificacion LIKE ? OR u.usuario LIKE ?)');
      const t = `%${busqueda.trim()}%`;
      params.push(t, t, t, t);
    }

    if (id_curso) {
      whereClauses.push('ucv.id_curso = ?');
      params.push(id_curso);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const sql = `
      SELECT u.id, u.identificacion, u.usuario, u.nombre, u.apellido, u.email,
             c.id AS id_curso, c.grado,
             (SELECT COUNT(*) FROM \`G1-excusa\` e WHERE e.id_estudiante = u.id) AS total_excusas
      FROM usuario u
      LEFT JOIN usuario_curso_vigencia ucv ON ucv.id_usuario = u.id AND ucv.id_vigencia = (
        SELECT CAST(valor AS UNSIGNED) FROM configuracion WHERE clave = 'vigencia_activa' LIMIT 1
      )
      LEFT JOIN curso c ON ucv.id_curso = c.id
      ${whereSql}
      ORDER BY c.id ASC, u.apellido ASC, u.nombre ASC
    `;

    const estudiantes = await query(sql, params);

    return res.status(200).json({
      success: true,
      total: estudiantes.length,
      estudiantes
    });
  } catch (error) {
    next(error);
  }
}
