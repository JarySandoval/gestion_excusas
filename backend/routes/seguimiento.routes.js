import { Router } from 'express';
import {
  registrarSeguimiento,
  listarSeguimientos,
  editarSeguimiento,
  eliminarSeguimiento
} from '../controllers/seguimiento.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { requireStaff } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(verifyToken);

// HU-06: Registrar observación institucional (Coordinador y Docente)
router.post('/excusas/:id/seguimiento', requireStaff, registrarSeguimiento);

// Listar observaciones de una excusa
router.get('/excusas/:id/seguimiento', listarSeguimientos);

// Editar observación (Solo durante los primeros 15 minutos, solo el autor docente/coordinador)
router.put('/seguimientos/:id', requireStaff, editarSeguimiento);
router.patch('/seguimientos/:id', requireStaff, editarSeguimiento);
router.put('/excusas/:idExcusa/seguimiento/:id', requireStaff, editarSeguimiento);
router.patch('/excusas/:idExcusa/seguimiento/:id', requireStaff, editarSeguimiento);

// Eliminar observación (Autor o Coordinador institucional)
router.delete('/seguimientos/:id', requireStaff, eliminarSeguimiento);
router.delete('/excusas/:idExcusa/seguimiento/:id', requireStaff, eliminarSeguimiento);

export default router;
