import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { env } from '../config/env.js';

export async function login(req, res, next) {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Debe ingresar el usuario y la contraseña.'
      });
    }

    const trimmedUser = usuario.trim();
    const trimmedPass = contrasena.trim();

    const sql = `
      SELECT u.id, u.identificacion, u.usuario, u.contrasena, u.nombre, u.apellido, u.email,
             u.id_estado, e.nombre AS estado_nombre,
             u.id_rol, r.nombre AS rol_nombre
      FROM usuario u
      INNER JOIN rol r ON u.id_rol = r.id
      INNER JOIN estado e ON u.id_estado = e.id
      WHERE u.usuario = ? OR u.identificacion = ?
      LIMIT 1
    `;

    const users = await query(sql, [trimmedUser, trimmedUser]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Verifique su usuario o documento.'
      });
    }

    const user = users[0];

    // Validación de estado de cuenta (1 = Activo, 2 = Bloqueado)
    if (Number(user.id_estado) !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Su cuenta institucional se encuentra bloqueada. Comuníquese con Coordinación.',
        id_estado: user.id_estado,
        estado_nombre: user.estado_nombre
      });
    }

    // Verificación de contraseña:
    // La regla institucional especifica que la contraseña por defecto es el número de documento de identidad
    // Soportamos hash bcrypt y compatibilidad segura
    let passwordMatches = false;
    
    // Si la contraseña almacenada parece un hash bcrypt ($2a$, $2b$, $2y$)
    if (user.contrasena.startsWith('$2')) {
      passwordMatches = await bcrypt.compare(trimmedPass, user.contrasena);
    } else {
      // Comparación directa en texto plano si no fue hasheada aún
      passwordMatches = (trimmedPass === user.contrasena);
      // Actualizar automáticamente a bcrypt para mayor seguridad
      if (passwordMatches) {
        const hashedPassword = await bcrypt.hash(trimmedPass, 10);
        await query("UPDATE usuario SET contrasena = ? WHERE id = ?", [hashedPassword, user.id]);
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Verifique su contraseña.'
      });
    }

    // Si es estudiante (rol 3), consultar su curso actual según la vigencia activa
    let cursoActual = null;
    if (user.id_rol === 3) {
      const cursoRows = await query(`
        SELECT c.id AS id_curso, c.grado, v.id AS id_vigencia
        FROM usuario_curso_vigencia ucv
        INNER JOIN curso c ON ucv.id_curso = c.id
        INNER JOIN vigencia v ON ucv.id_vigencia = v.id
        WHERE ucv.id_usuario = ? AND ucv.id_vigencia = (
          SELECT CAST(valor AS UNSIGNED) FROM configuracion WHERE clave = 'vigencia_activa' LIMIT 1
        )
        LIMIT 1
      `, [user.id]);

      if (cursoRows.length > 0) {
        cursoActual = cursoRows[0];
      }
    }

    const tokenPayload = {
      id: user.id,
      identificacion: user.identificacion,
      usuario: user.usuario,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      id_rol: user.id_rol,
      rol_nombre: user.rol_nombre,
      curso: cursoActual
    };

    const token = jwt.sign(tokenPayload, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn
    });

    return res.status(200).json({
      success: true,
      message: `Bienvenido(a) ${user.nombre} ${user.apellido}`,
      token,
      user: tokenPayload,
      portal: user.id_rol === 3 ? 'estudiante' : 'admin'
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const users = await query(`
      SELECT u.id, u.identificacion, u.usuario, u.nombre, u.apellido, u.email,
             u.id_estado, e.nombre AS estado_nombre,
             u.id_rol, r.nombre AS rol_nombre
      FROM usuario u
      INNER JOIN rol r ON u.id_rol = r.id
      INNER JOIN estado e ON u.id_estado = e.id
      WHERE u.id = ?
      LIMIT 1
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const user = users[0];
    let cursoActual = null;
    if (user.id_rol === 3) {
      const cursoRows = await query(`
        SELECT c.id AS id_curso, c.grado, v.id AS id_vigencia
        FROM usuario_curso_vigencia ucv
        INNER JOIN curso c ON ucv.id_curso = c.id
        INNER JOIN vigencia v ON ucv.id_vigencia = v.id
        WHERE ucv.id_usuario = ? AND ucv.id_vigencia = (
          SELECT CAST(valor AS UNSIGNED) FROM configuracion WHERE clave = 'vigencia_activa' LIMIT 1
        )
        LIMIT 1
      `, [user.id]);
      if (cursoRows.length > 0) {
        cursoActual = cursoRows[0];
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        curso: cursoActual
      }
    });
  } catch (error) {
    next(error);
  }
}
