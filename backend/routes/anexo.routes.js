import { Router } from 'express';
import { descargarAnexo, obtenerInfoAnexo } from '../controllers/anexo.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

// HU-03 y HU-09: Descarga y streaming seguro con validación RBAC
router.get('/:id/descargar', descargarAnexo);
router.get('/:id/info', obtenerInfoAnexo);

export default router;
