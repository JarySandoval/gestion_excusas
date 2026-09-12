import { Router } from 'express';
import { exportarCsvExcusas } from '../controllers/reporte.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { requireCoordinador } from '../middlewares/rbac.middleware.js';

const router = Router();

// HU-07: Exportación CSV restringida y habilitada ÚNICAMENTE para Coordinador (id_rol = 1)
router.get('/excusas/csv', verifyToken, requireCoordinador, exportarCsvExcusas);

export default router;
