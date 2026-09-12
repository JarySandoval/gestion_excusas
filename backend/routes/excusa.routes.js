import { Router } from 'express';
import {
  crearExcusa,
  listarExcusas,
  detalleExcusa,
  cerrarExcusaIndefinida,
  timelineEstudiante
} from '../controllers/excusa.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { uploadAnexoSingle } from '../middlewares/upload.middleware.js';

const router = Router();

// Todas las rutas de excusas requieren autenticación institucional
router.use(verifyToken);

// HU-02: Radicación de excusa
router.post('/', uploadAnexoSingle, crearExcusa);

// HU-04: Consulta diaria y filtros avanzados (novedades del día, filtros por fecha, grado, etc.)
router.get('/', listarExcusas);

// HU-05: Línea de tiempo del estudiante
router.get('/timeline/:id_estudiante', timelineEstudiante);

// Detalle individual
router.get('/:id', detalleExcusa);

// HU-08: Cierre formal de excusas indefinidas con soporte médico
router.patch('/:id/cerrar', uploadAnexoSingle, cerrarExcusaIndefinida);

export default router;
