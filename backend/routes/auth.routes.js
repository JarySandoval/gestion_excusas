import { Router } from 'express';
import { login, getProfile } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', verifyToken, getProfile);

export default router;
