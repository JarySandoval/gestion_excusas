export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado.'
      });
    }

    const userRoleId = Number(req.user.id_rol);
    const normalizedAllowed = allowedRoles.map(Number);

    if (!normalizedAllowed.includes(userRoleId)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: No tiene los permisos institucionales requeridos para esta acción.',
        rolRequerido: allowedRoles,
        rolActual: userRoleId
      });
    }

    next();
  };
}

export const requireCoordinador = requireRole([1]);
export const requireStaff = requireRole([1, 2]); // Coordinador y Docente
export const requireEstudiante = requireRole([3]);
