import multer from 'multer';

export function errorHandler(err, req, res, next) {
  console.error('[Error Handler]:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo excede el tamaño máximo permitido (10MB).'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error al procesar archivo adjunto: ${err.message}`
    });
  }

  if (err.message && err.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor institucional.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}
