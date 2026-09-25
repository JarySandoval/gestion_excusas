import { Router } from 'express';
import {
  listarCursos,
  listarMotivos,
  getVigenciaActiva,
  listarEstudiantes
} from '../controllers/catalogo.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { requireStaff } from '../middlewares/rbac.middleware.js';

const router = Router();

router.get('/cursos', listarCursos);
router.get('/motivos', listarMotivos);
router.get('/vigencia', getVigenciaActiva);
router.get('/estudiantes', verifyToken, requireStaff, listarEstudiantes);

export default router;
