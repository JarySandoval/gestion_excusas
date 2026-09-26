import { Router } from 'express';
import {
  crearExcusa,
  listarExcusas,
  detalleExcusa,
  cerrarExcusaIndefinida,
  timelineEstudiante,
  anularExcusa,
  solicitarAnulacionExcusa
} from '../controllers/excusa.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { uploadAnexosMultiples } from '../middlewares/upload.middleware.js';

const router = Router();

// Todas las rutas de excusas requieren autenticación institucional
router.use(verifyToken);

// HU-02: Radicación de excusa (admite hasta 5 archivos y máx 30 MB en conjunto)
router.post('/', uploadAnexosMultiples, crearExcusa);

// HU-04: Consulta diaria y filtros avanzados (novedades del día, filtros por fecha, grado, etc.)
router.get('/', listarExcusas);

// HU-05: Línea de tiempo del estudiante
router.get('/timeline/:id_estudiante', timelineEstudiante);

// Detalle individual
router.get('/:id', detalleExcusa);

// HU-08: Cierre formal de excusas indefinidas con soporte médico (admite hasta 5 archivos y máx 30 MB en conjunto)
router.patch('/:id/cerrar', uploadAnexosMultiples, cerrarExcusaIndefinida);

// Anulación de excusa (Docente/Coordinador en cualquier momento; Estudiante en primeros 15 min)
router.post('/:id/anular', anularExcusa);

// Solicitud de anulación enviada por el estudiante cuando expiraron los 15 minutos
router.post('/:id/solicitar-anulacion', solicitarAnulacionExcusa);

export default router;
