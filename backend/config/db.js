import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool(env.db);

export async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[DB] Conectado exitosamente a MySQL: ${env.db.database} en ${env.db.host}:${env.db.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error(`[DB] Error conectando a MySQL (${env.db.database}):`, error.message);
    return false;
  }
}
