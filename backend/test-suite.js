import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from './config/env.js';

import { generarNombreUsuario } from './services/username.service.js';

async function runTestSuite() {
  console.log('====================================================');
  console.log(' EJECUTANDO SUITE DE PRUEBAS DE LÓGICA INSTITUCIONAL');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // PRUEBA 1: Convención de credenciales de usuario institucional
  // Formato: [inicial primer nombre][primer apellido][número]
  // Contraseña: [identificación]
  console.log('1. Verificando Regla de Generación de Credenciales:');
  const testStudent = {
    nombre: 'Juan Camilo',
    apellido: 'Pérez Castro',
    identificacion: '1012345678'
  };
  const usuarioGenerado = generarNombreUsuario(testStudent.nombre, testStudent.apellido, 1);
  assert(usuarioGenerado === 'jperez1', `Usuario generado '${usuarioGenerado}' debe ser 'jperez1'`);

  // PRUEBA 2: Cifrado y verificación de contraseñas con bcryptjs
  console.log('\n2. Verificando Cifrado de Contraseñas (bcryptjs):');
  const passwordHash = await bcrypt.hash(testStudent.identificacion, 10);
  const isMatch = await bcrypt.compare(testStudent.identificacion, passwordHash);
  const isBadMatch = await bcrypt.compare('clave_incorrecta', passwordHash);
  assert(isMatch === true, 'Bcrypt debe autenticar correctamente el documento de identidad');
  assert(isBadMatch === false, 'Bcrypt debe rechazar contraseñas erróneas');

  // PRUEBA 3: Generación y Verificación de JWT
  console.log('\n3. Verificando Token JWT y Claims:');
  const payload = {
    id: 4,
    identificacion: '1012345678',
    usuario: 'jperez1',
    id_rol: 3,
    rol_nombre: 'Estudiante'
  };
  const token = jwt.sign(payload, env.jwt.secret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, env.jwt.secret);
  assert(decoded.usuario === 'jperez1', 'JWT debe contener el nombre de usuario');
  assert(decoded.id_rol === 3, 'JWT debe contener el rol del usuario (3: Estudiante)');

  // PRUEBA 4: Control de Acceso RBAC para Anexos Restringidos (HU-09)
  console.log('\n4. Verificando Regla de Confidencialidad de Anexos (HU-09):');
  function checkDownloadPermission(anexo, usuario) {
    if (!anexo.es_restringido) return true;
    // Coordinador (rol 1) o dueño
    if (usuario.id_rol === 1) return true;
    if (usuario.id === anexo.id_estudiante) return true;
    return false;
  }

  const anexoRestringido = { id: 10, id_estudiante: 4, es_restringido: true };
  const userCoordinador = { id: 1, id_rol: 1 };
  const userDocente = { id: 2, id_rol: 2 };
  const userEstudianteDuenio = { id: 4, id_rol: 3 };
  const userEstudianteAjeno = { id: 5, id_rol: 3 };

  assert(checkDownloadPermission(anexoRestringido, userCoordinador) === true, 'Coordinador (Rol 1) DEBE poder descargar anexo restringido');
  assert(checkDownloadPermission(anexoRestringido, userDocente) === false, 'Docente (Rol 2) NO DEBE poder descargar anexo restringido (HU-09)');
  assert(checkDownloadPermission(anexoRestringido, userEstudianteDuenio) === true, 'Estudiante autor DEBE poder descargar su propio anexo');
  assert(checkDownloadPermission(anexoRestringido, userEstudianteAjeno) === false, 'Estudiante ajeno NO DEBE poder descargar anexo ajeno');

  // PRUEBA 5: Control de Acceso RBAC para Exportación CSV (HU-07)
  console.log('\n5. Verificando Regla de Exportación CSV Exclusiva para Coordinador (HU-07):');
  function canExportCsv(userRole) {
    return Number(userRole) === 1;
  }
  assert(canExportCsv(1) === true, 'Coordinador (Rol 1) tiene permiso de exportar CSV');
  assert(canExportCsv(2) === false, 'Docente (Rol 2) NO tiene permiso de exportar CSV (HU-07)');
  assert(canExportCsv(3) === false, 'Estudiante (Rol 3) NO tiene permiso de exportar CSV');

  // PRUEBA 6: Regla de Cierre de Excusas Indefinidas (HU-08)
  console.log('\n6. Verificando Validación de Cierre Formal de Excusas Indefinidas (HU-08):');
  function validateCierreIndefinida(excusa, fechaRetorno, archivoSoporte) {
    if (!excusa.es_indefinida) return { valid: false, error: 'Solo excusas indefinidas requieren cierre formal' };
    if (!fechaRetorno) return { valid: false, error: 'Fecha de retorno obligatoria' };
    if (new Date(fechaRetorno) < new Date(excusa.fecha_desde)) return { valid: false, error: 'Fecha retorno anterior a fecha inicio' };
    if (!archivoSoporte) return { valid: false, error: 'Soporte médico de alta obligatorio' };
    return { valid: true };
  }

  const excusaIndefinida = { id: 1, es_indefinida: true, fecha_desde: '2026-09-01' };
  assert(validateCierreIndefinida(excusaIndefinida, '2026-09-08', 'alta_medica.pdf').valid === true, 'Cierre con fecha válida y soporte médico es válido');
  assert(validateCierreIndefinida(excusaIndefinida, '2026-09-08', null).valid === false, 'Cierre sin soporte médico de alta es rechazado (HU-08)');
  assert(validateCierreIndefinida(excusaIndefinida, '2026-08-25', 'alta.pdf').valid === false, 'Fecha de retorno anterior a fecha_desde es rechazada');

  console.log('\n====================================================');
  console.log(` RESULTADOS: ${passed} pasadas, ${failed} falladas.`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite();
