import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { testConnection } from './config/db.js';
import { errorHandler } from './middlewares/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import excusaRoutes from './routes/excusa.routes.js';
import anexoRoutes from './routes/anexo.routes.js';
import seguimientoRoutes from './routes/seguimiento.routes.js';
import catalogoRoutes from './routes/catalogo.routes.js';
import reporteRoutes from './routes/reporte.routes.js';

const app = express();

// Middlewares globales
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    institucion: 'IED La Victoria',
    modulo: 'Radicación y Seguimiento de Excusas Escolares',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/excusas', excusaRoutes);
app.use('/api/anexos', anexoRoutes);
app.use('/api', seguimientoRoutes);
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/reportes', reporteRoutes);

// Manejador centralizado de errores
app.use(errorHandler);

// Inicio del servidor
const server = app.listen(env.port, async () => {
  console.log(`====================================================`);
  console.log(`[IED La Victoria] Servidor Backend Iniciado`);
  console.log(`Puerto: http://localhost:${env.port}`);
  console.log(`Modo:   ${env.nodeEnv}`);
  console.log(`====================================================`);

  await testConnection();
});

export default app;
