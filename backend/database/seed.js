import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

async function seed() {
  const connection = await pool.getConnection();
  try {
    console.log('[SEED] Iniciando inserción de datos iniciales en bdiedlavictoria...');

    // 1. Roles
    const roles = [
      [1, 'Coordinador'],
      [2, 'Docente'],
      [3, 'Estudiante']
    ];
    for (const [id, nombre] of roles) {
      await connection.query('INSERT IGNORE INTO rol (id, nombre) VALUES (?, ?)', [id, nombre]);
    }
    console.log('[SEED] Roles verificados.');

    // 2. Estados
    const estados = [
      [1, 'Activo'],
      [2, 'Bloqueado']
    ];
    for (const [id, nombre] of estados) {
      await connection.query('INSERT IGNORE INTO estado (id, nombre) VALUES (?, ?)', [id, nombre]);
    }
    console.log('[SEED] Estados verificados.');

    // 3. Vigencia
    await connection.query('INSERT IGNORE INTO vigencia (id, fecha_inicio, fecha_fin) VALUES (?, ?, ?)', [
      2026, '2026-01-01', '2026-12-31'
    ]);
    console.log('[SEED] Vigencia 2026 verificada.');

    // 4. Configuración
    await connection.query(
      `INSERT INTO configuracion (id, clave, valor, descripcion)
       VALUES (1, 'vigencia_activa', '2026', 'Vigencia académica activa del sistema')
       ON DUPLICATE KEY UPDATE valor = '2026'`
    );
    console.log('[SEED] Parámetro vigencia_activa verificado.');

    // 5. Cursos
    const cursos = [
      [111, '1A'], [112, '1B'],
      [211, '2A'], [212, '2B'],
      [311, '3A'], [312, '3B'],
      [411, '4A'], [412, '4B'],
      [511, '5A'], [512, '5B'],
      [611, '6A'], [612, '6B'],
      [711, '7A'], [712, '7B'],
      [811, '8A'], [812, '8B'],
      [911, '9A'], [912, '9B'],
      [1011, '10A'], [1012, '10B'],
      [1111, '11A'], [1112, '11B']
    ];
    for (const [id, grado] of cursos) {
      await connection.query('INSERT IGNORE INTO curso (id, grado) VALUES (?, ?)', [id, grado]);
    }
    console.log('[SEED] Cursos (1A a 11B) verificados.');

    // 6. Usuarios de prueba cumpliendo la convención institucional:
    // Usuario: [inicial primer nombre][primer apellido][número]
    // Contraseña: [identificación] (hasheada con bcryptjs)
    const rawUsers = [
      {
        id: 1,
        identificacion: '51987456',
        nombre: 'María Elena',
        apellido: 'Rodríguez Morales',
        email: 'mrodriguez1@iedlavictoria.edu.co',
        id_rol: 1, // Coordinador
        id_estado: 1,
        usuario: 'mrodriguez1'
      },
      {
        id: 2,
        identificacion: '79654123',
        nombre: 'Carlos Andrés',
        apellido: 'Gómez Peña',
        email: 'cgomez1@iedlavictoria.edu.co',
        id_rol: 2, // Docente
        id_estado: 1,
        usuario: 'cgomez1'
      },
      {
        id: 3,
        identificacion: '52345678',
        nombre: 'Patricia',
        apellido: 'Suárez Torres',
        email: 'psuarez1@iedlavictoria.edu.co',
        id_rol: 2, // Docente
        id_estado: 1,
        usuario: 'psuarez1'
      },
      {
        id: 4,
        identificacion: '1012345678',
        nombre: 'Juan Camilo',
        apellido: 'Pérez Castro',
        email: 'jperez1@iedlavictoria.edu.co',
        id_rol: 3, // Estudiante
        id_estado: 1,
        usuario: 'jperez1',
        id_curso: 1011 // 10A
      },
      {
        id: 5,
        identificacion: '1098765432',
        nombre: 'Valentina',
        apellido: 'Mendoza Herrera',
        email: 'vmendoza1@iedlavictoria.edu.co',
        id_rol: 3, // Estudiante
        id_estado: 1,
        usuario: 'vmendoza1',
        id_curso: 1112 // 11B
      },
      {
        id: 6,
        identificacion: '1034567890',
        nombre: 'Diego Fernando',
        apellido: 'López Silva',
        email: 'dlopez1@iedlavictoria.edu.co',
        id_rol: 3, // Estudiante
        id_estado: 2, // Bloqueado para pruebas de HU-01
        usuario: 'dlopez1',
        id_curso: 1012 // 10B
      }
    ];

    for (const u of rawUsers) {
      const hashedPassword = await bcrypt.hash(u.identificacion, 10);
      await connection.query(
        `INSERT INTO usuario (id, identificacion, usuario, contrasena, nombre, apellido, email, id_estado, id_rol)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          usuario = VALUES(usuario),
          contrasena = VALUES(contrasena),
          nombre = VALUES(nombre),
          apellido = VALUES(apellido),
          email = VALUES(email),
          id_estado = VALUES(id_estado),
          id_rol = VALUES(id_rol)`,
        [u.id, u.identificacion, u.usuario, hashedPassword, u.nombre, u.apellido, u.email, u.id_estado, u.id_rol]
      );

      // Matrícula de estudiante si aplica
      if (u.id_curso) {
        await connection.query(
          `INSERT IGNORE INTO usuario_curso_vigencia (id_curso, id_vigencia, id_usuario)
           VALUES (?, 2026, ?)`,
          [u.id_curso, u.id]
        );
      }
    }
    console.log('[SEED] Usuarios y matrículas insertados exitosamente.');

    // 7. Ejemplos de excusas base para visualización inmediata en dashboards
    const [excusaCount] = await connection.query('SELECT COUNT(*) AS total FROM `G1-excusa`');
    if (excusaCount[0].total === 0) {
      console.log('[SEED] Creando registros de prueba para G1-excusa...');

      // Excusa 1: Definida (Cita Médica)
      await connection.query(
        `INSERT INTO \`G1-excusa\`
         (id, radicado, id_estudiante, fecha_desde, fecha_hasta, es_indefinida, fecha_retorno, motivo, descripcion, datos_contacto, fecha_creacion)
         VALUES (1, 'RAD-2026-00001', 4, '2026-09-12', '2026-09-12', 0, NULL, 'Cita Médica', 'Cita odontológica con especialista en la EPS Sanitas.', 'Acudiente: Claudia Castro - Cel: 3105551234', NOW())`
      );

      // Excusa 2: Indefinida ABIERTA (Incapacidad Médica - lista para probar HU-08)
      await connection.query(
        `INSERT INTO \`G1-excusa\`
         (id, radicado, id_estudiante, fecha_desde, fecha_hasta, es_indefinida, fecha_retorno, motivo, descripcion, datos_contacto, fecha_creacion)
         VALUES (2, 'RAD-2026-00002', 4, '2026-09-10', NULL, 1, NULL, 'Incapacidad Médica', 'Cuadro viral respiratorio agudo en observación médica domiciliaria.', 'Acudiente: Claudia Castro - Cel: 3105551234', '2026-09-10 08:30:00')`
      );

      // Excusa 3: Indefinida ya CERRADA formalmente con alta
      await connection.query(
        `INSERT INTO \`G1-excusa\`
         (id, radicado, id_estudiante, fecha_desde, fecha_hasta, es_indefinida, fecha_retorno, motivo, descripcion, datos_contacto, fecha_creacion)
         VALUES (3, 'RAD-2026-00003', 5, '2026-09-01', NULL, 1, '2026-09-08', 'Incapacidad Médica', 'Fractura leve en muñeca izquierda tratada con inmovilización.', 'Acudiente: Roberto Mendoza - Cel: 3159998877', '2026-09-01 07:15:00')`
      );

      // Excusa 4: Definida con Anexo Restringido (HU-09)
      await connection.query(
        `INSERT INTO \`G1-excusa\`
         (id, radicado, id_estudiante, fecha_desde, fecha_hasta, es_indefinida, fecha_retorno, motivo, descripcion, datos_contacto, fecha_creacion)
         VALUES (4, 'RAD-2026-00004', 5, '2026-09-12', '2026-09-14', 0, NULL, 'Diligencia Legal', 'Citación en comisaría de familia para trámite de custodia confidencial.', 'Acudiente: Roberto Mendoza - Cel: 3159998877', NOW())`
      );

      // Anexos de prueba en G1-anexo
      await connection.query(
        `INSERT INTO \`G1-anexo\`
         (id, id_excusa, nombre_original, nombre_tecnico, ruta_archivo, es_restringido, fecha_subida)
         VALUES
         (1, 1, 'certificado_odontologico.pdf', 'dummy_hash_01.pdf', 'uploads/anexos/dummy_01.pdf', 0, NOW()),
         (2, 4, 'acta_citacion_confidencial.pdf', 'dummy_hash_04.pdf', 'uploads/anexos/dummy_04.pdf', 1, NOW())`
      );

      // Seguimientos de prueba en G1-seguimiento (HU-06)
      await connection.query(
        `INSERT INTO \`G1-seguimiento\`
         (id, id_excusa, id_usuario, observacion, fecha_hora)
         VALUES
         (1, 1, 2, 'Se verifica cita odontológica y se le comparten guías pedagógicas al estudiante.', NOW()),
         (2, 2, 1, 'Coordinación se comunicó con la acudiente para verificar el estado de salud del estudiante.', NOW())`
      );

      console.log('[SEED] Excusas, anexos y seguimientos iniciales creados.');
    }

    console.log('===============================================================');
    console.log(' SEED COMPLETADO EXITOSAMENTE');
    console.log(' Credenciales de prueba:');
    console.log(' - Coordinador:  mrodriguez1 / 51987456  (Rol 1)');
    console.log(' - Docente:      cgomez1     / 79654123  (Rol 2)');
    console.log(' - Docente:      psuarez1    / 52345678  (Rol 2)');
    console.log(' - Estudiante 1: jperez1     / 1012345678 (Rol 3 - Curso 10A)');
    console.log(' - Estudiante 2: vmendoza1   / 1098765432 (Rol 3 - Curso 11B)');
    console.log(' - Estudiante 3: dlopez1     / 1034567890 (Rol 3 - BLOQUEADO)');
    console.log('===============================================================');
  } catch (error) {
    console.error('[SEED] Error durante el proceso:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seed();
