import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bdiedlavictoria',
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    timezone: '-05:00',
    dateStrings: true
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'ied_la_victoria_super_secret_jwt_key_2026_secure',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  upload: {
    dir: path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads/anexos'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024
  }
};
