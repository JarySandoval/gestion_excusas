import { Router } from 'express';
import { registrarSeguimiento, listarSeguimientos } from '../controllers/seguimiento.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { requireStaff } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(verifyToken);

// HU-06: Registrar observación institucional (Coordinador y Docente)
router.post('/excusas/:id/seguimiento', requireStaff, registrarSeguimiento);

// Listar observaciones de una excusa
router.get('/excusas/:id/seguimiento', listarSeguimientos);

export default router;
