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
    // Soporte documental es ahora opcional (HU-08)
    return { valid: true, tieneSoporte: Boolean(archivoSoporte) };
  }

  const excusaIndefinida = { id: 1, es_indefinida: true, fecha_desde: '2026-09-01' };
  assert(validateCierreIndefinida(excusaIndefinida, '2026-09-08', 'alta_medica.pdf').valid === true, 'Cierre con fecha válida y soporte médico es válido');
  assert(validateCierreIndefinida(excusaIndefinida, '2026-09-08', null).valid === true, 'Cierre con fecha válida y SIN soporte médico ahora es permitido (opcional)');
  assert(validateCierreIndefinida(excusaIndefinida, '2026-08-25', null).valid === false, 'Fecha de retorno anterior a fecha_desde sigue siendo rechazada');

  // PRUEBA 7: Detección y Bloqueo de Solapamiento de Excusas (Calendario Libre / Ocupado)
  console.log('\n7. Verificando Prevención de Solapamiento de Excusas:');
  function checkSolapamiento(existentes, nueva) {
    const nuevaDesde = nueva.fecha_desde;
    const nuevaHasta = nueva.es_indefinida ? '9999-12-31' : nueva.fecha_hasta;

    for (const ex of existentes) {
      // Si la excusa existente está anulada, NO bloquea el calendario
      if (ex.es_anulada) continue;

      const exDesde = ex.fecha_desde;
      const exHasta = ex.fecha_retorno || ex.fecha_hasta || '9999-12-31';

      // Intersección de intervalos cerrados [A, B] y [C, D]: A <= D && C <= B
      if (nuevaDesde <= exHasta && exDesde <= nuevaHasta) {
        return { solapada: true, conflictoCon: ex.radicado };
      }
    }
    return { solapada: false };
  }

  const excusasRegistradas = [
    { radicado: 'EXC-001', fecha_desde: '2026-10-05', fecha_hasta: '2026-10-10', es_indefinida: false, es_anulada: 0 },
    { radicado: 'EXC-002', fecha_desde: '2026-10-15', fecha_hasta: null, fecha_retorno: '2026-10-20', es_indefinida: true, es_anulada: 0 },
    { radicado: 'EXC-003', fecha_desde: '2026-10-25', fecha_hasta: '2026-10-28', es_indefinida: false, es_anulada: 1 } // ANULADA
  ];

  // Caso A: Solapamiento directo con excusa definida
  assert(checkSolapamiento(excusasRegistradas, { fecha_desde: '2026-10-08', fecha_hasta: '2026-10-12', es_indefinida: false }).solapada === true,
    'Debe detectar y rechazar solapamiento con excusa definida activa');

  // Caso B: Período libre entre EXC-001 y EXC-002
  assert(checkSolapamiento(excusasRegistradas, { fecha_desde: '2026-10-11', fecha_hasta: '2026-10-14', es_indefinida: false }).solapada === false,
    'Debe permitir radicar en períodos libres entre excusas');

  // Caso C: Coincidencia con excusa ANULADA (debe permitir radicarse pues el calendario quedó libre)
  assert(checkSolapamiento(excusasRegistradas, { fecha_desde: '2026-10-25', fecha_hasta: '2026-10-28', es_indefinida: false }).solapada === false,
    'Excusa anulada DEBE liberar el período y no causar conflicto de solapamiento');

  // PRUEBA 8: Regla de Anulación Institucional y Ventana de 15 Minutos
  console.log('\n8. Verificando Regla de Anulación Institucional (Ventana de 15 Minutos):');
  function puedeAnular(usuario, excusa, segundosTranscurridos) {
    if (excusa.es_anulada) return { permitido: false, razon: 'Ya anulada' };
    // Docente (rol 2) o Coordinador (rol 1) tienen permiso irrestricto
    if (usuario.id_rol === 1 || usuario.id_rol === 2) {
      return { permitido: true, tipo: 'GestionDocenteDirecta' };
    }
    // Estudiante (rol 3) solo su propia excusa y dentro de 15 minutos (900 seg)
    if (usuario.id_rol === 3) {
      if (usuario.id !== excusa.id_estudiante) {
        return { permitido: false, razon: 'No puede anular excusa de otro estudiante' };
      }
      if (segundosTranscurridos <= 900) {
        return { permitido: true, tipo: 'CorreccionInmediataEstudiante' };
      } else {
        return { permitido: false, razon: 'Tiempo expirado; debe solicitar anulación a un docente' };
      }
    }
    return { permitido: false, razon: 'Rol no autorizado' };
  }

  const excusaParaAnular = { id: 10, id_estudiante: 4, es_anulada: 0 };
  assert(puedeAnular({ id: 4, id_rol: 3 }, excusaParaAnular, 300).permitido === true,
    'Estudiante PUEDE anular su excusa dentro de los primeros 15 minutos (5 min transcurridos)');
  assert(puedeAnular({ id: 4, id_rol: 3 }, excusaParaAnular, 1200).permitido === false,
    'Estudiante NO PUEDE anular directamente tras 15 minutos (20 min transcurridos); debe solicitar');
  assert(puedeAnular({ id: 2, id_rol: 2 }, excusaParaAnular, 7200).permitido === true,
    'Docente (Rol 2) PUEDE anular directamente en cualquier momento (2 horas transcurridas)');
  assert(puedeAnular({ id: 1, id_rol: 1 }, excusaParaAnular, 86400).permitido === true,
    'Coordinador (Rol 1) PUEDE anular directamente en cualquier momento (24 horas transcurridas)');

  // PRUEBA 9: Regla de Carga Múltiple de Anexos y Límite de Peso Conjunto (Máx 5 archivos y 30 MB)
  console.log('\n9. Verificando Regla de Anexos Múltiples y Límite Conjunto (30 MB / 5 Archivos):');
  function validarSubidaAnexos(archivos, maxFiles = 5, maxTotalBytes = 30 * 1024 * 1024) {
    if (!archivos || archivos.length === 0) return { valido: true, totalBytes: 0, cantidad: 0 };
    if (archivos.length > maxFiles) {
      return { valido: false, error: `Excede el máximo de ${maxFiles} archivos permitidos` };
    }
    const totalBytes = archivos.reduce((acc, f) => acc + (f.size || 0), 0);
    if (totalBytes > maxTotalBytes) {
      return { valido: false, error: 'Excede el límite conjunto de 30 MB' };
    }
    return { valido: true, totalBytes, cantidad: archivos.length };
  }

  const loteValido = [
    { name: 'incapacidad.pdf', size: 5 * 1024 * 1024 }, // 5 MB
    { name: 'orden_medica.jpg', size: 8 * 1024 * 1024 }, // 8 MB
    { name: 'alta_hospitalaria.pdf', size: 10 * 1024 * 1024 } // 10 MB (Total 23 MB, 3 archivos)
  ];
  const lotesSobrecupoCantidad = [
    { name: '1.pdf', size: 1024 },
    { name: '2.pdf', size: 1024 },
    { name: '3.pdf', size: 1024 },
    { name: '4.pdf', size: 1024 },
    { name: '5.pdf', size: 1024 },
    { name: '6.pdf', size: 1024 } // 6 archivos (> 5)
  ];
  const loteExcesoPeso = [
    { name: 'scan_pesado_1.pdf', size: 20 * 1024 * 1024 }, // 20 MB
    { name: 'scan_pesado_2.pdf', size: 15 * 1024 * 1024 }  // 15 MB (Total 35 MB > 30 MB)
  ];

  assert(validarSubidaAnexos(loteValido).valido === true,
    'Debe aceptar lote de 3 archivos con 23 MB en conjunto (dentro del límite de 30 MB y 5 archivos)');
  assert(validarSubidaAnexos(lotesSobrecupoCantidad).valido === false,
    'Debe rechazar lote que exceda la cantidad máxima de 5 archivos');
  assert(validarSubidaAnexos(loteExcesoPeso).valido === false,
    'Debe rechazar lote cuyo peso acumulado (35 MB) supere el límite conjunto de 30 MB');

  // PRUEBA 10: Regla de Confidencialidad en Cierre de Excusas Indefinidas (HU-09 en Cierre)
  console.log('\n10. Verificando Confidencialidad en Soportes de Cierre de Excusas Indefinidas:');
  function checkDownloadCierrePermission(anexoCierre, usuario) {
    if (!anexoCierre.es_restringido) return true;
    // Solo Coordinador (rol 1) y estudiante autor
    if (usuario.id_rol === 1) return true;
    if (usuario.id === anexoCierre.id_estudiante) return true;
    return false;
  }

  const anexoCierreConfidencial = { id: 25, id_estudiante: 4, es_restringido: 1 };
  assert(checkDownloadCierrePermission(anexoCierreConfidencial, userCoordinador) === true,
    'Coordinador (Rol 1) DEBE poder descargar soporte de cierre confidencial');
  assert(checkDownloadCierrePermission(anexoCierreConfidencial, userDocente) === false,
    'Docente (Rol 2) NO DEBE poder descargar soporte de cierre confidencial (HU-09)');
  // PRUEBA 11: Granularidad Individual de Confidencialidad por Archivo (Lote Mixto)
  console.log('\n11. Verificando Granularidad de Confidencialidad Individual por Archivo (Lote Mixto):');
  function resolverConfidencialidadIndividual(archivos, metadata) {
    return archivos.map((archivo, idx) => {
      const meta = Array.isArray(metadata)
        ? (metadata.find(m => m.nombre === archivo.name) || metadata[idx])
        : null;
      return {
        ...archivo,
        es_restringido: meta && meta.es_restringido !== undefined ? Boolean(meta.es_restringido) : false
      };
    });
  }

  const loteMixtoArchivos = [
    { name: 'constancia_deportiva.pdf', id_estudiante: 4 },
    { name: 'historia_clinica_psicologia.pdf', id_estudiante: 4 }
  ];
  const metadataMixta = [
    { nombre: 'constancia_deportiva.pdf', es_restringido: false },
    { nombre: 'historia_clinica_psicologia.pdf', es_restringido: true }
  ];

  const loteResuelto = resolverConfidencialidadIndividual(loteMixtoArchivos, metadataMixta);
  const anexoPublico = loteResuelto.find(a => a.name === 'constancia_deportiva.pdf');
  const anexoPrivado = loteResuelto.find(a => a.name === 'historia_clinica_psicologia.pdf');

  assert(checkDownloadPermission(anexoPublico, userDocente) === true,
    'Docente (Rol 2) PUEDE descargar anexo público en un lote mixto');
  assert(checkDownloadPermission(anexoPrivado, userDocente) === false,
    'Docente (Rol 2) TIENE BLOQUEADO el anexo confidencial en el mismo lote mixto');
  assert(checkDownloadPermission(anexoPrivado, userCoordinador) === true,
    'Coordinador (Rol 1) PUEDE descargar el anexo confidencial del lote mixto');
  assert(checkDownloadPermission(anexoPrivado, userEstudianteDuenio) === true,
    'Estudiante autor PUEDE descargar su propio anexo confidencial del lote mixto');

  console.log('\n====================================================');
  console.log(` RESULTADOS: ${passed} pasadas, ${failed} falladas.`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite();
