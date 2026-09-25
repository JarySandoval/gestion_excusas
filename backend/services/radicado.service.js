import { query } from '../config/db.js';

export async function getVigenciaActiva() {
  try {
    const rows = await query("SELECT valor FROM configuracion WHERE clave = 'vigencia_activa' LIMIT 1");
    if (rows.length > 0 && rows[0].valor) {
      return rows[0].valor;
    }
  } catch (error) {
    console.warn('[RadicadoService] No se pudo consultar vigencia_activa de configuracion, usando año actual:', error.message);
  }
  return new Date().getFullYear().toString();
}

export async function generarRadicadoUnico() {
  const vigencia = await getVigenciaActiva();
  
  // Consultar el último consecutivo de la vigencia
  const prefix = `RAD-${vigencia}-`;
  const rows = await query(
    "SELECT radicado FROM `G1-excusa` WHERE radicado LIKE ? ORDER BY id DESC LIMIT 1",
    [`${prefix}%`]
  );

  let nextNumber = 1;
  if (rows.length > 0 && rows[0].radicado) {
    const lastPart = rows[0].radicado.replace(prefix, '');
    const parsed = parseInt(lastPart, 10);
    if (!isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  // Si por alguna razón el consecutivo ya existiera, verificar hasta encontrar libre
  let radicado = `${prefix}${String(nextNumber).padStart(5, '0')}`;
  let exists = await query("SELECT id FROM `G1-excusa` WHERE radicado = ? LIMIT 1", [radicado]);
  
  while (exists.length > 0) {
    nextNumber++;
    radicado = `${prefix}${String(nextNumber).padStart(5, '0')}`;
    exists = await query("SELECT id FROM `G1-excusa` WHERE radicado = ? LIMIT 1", [radicado]);
  }

  return radicado;
}
