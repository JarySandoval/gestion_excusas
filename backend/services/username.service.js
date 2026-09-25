/**
 * Normaliza nombres para la generación institucional de usuarios:
 * [inicial primer nombre][primer apellido][número]
 * Remueve acentos, diacríticos y caracteres no alfanuméricos.
 */
export function generarNombreUsuario(nombre, apellido, numero = 1) {
  if (!nombre || !apellido) return '';

  const normalizar = (str) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const primerNombre = nombre.trim().split(/\s+/)[0];
  const primerApellido = apellido.trim().split(/\s+/)[0];

  const inicial = normalizar(primerNombre)[0] || '';
  const apellidoLimpio = normalizar(primerApellido);

  return `${inicial}${apellidoLimpio}${numero}`;
}
