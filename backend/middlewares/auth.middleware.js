import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado: Token de acceso no proporcionado o formato inválido.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesión expirada. Por favor ingrese nuevamente al sistema.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token de acceso inválido.'
    });
  }
}
