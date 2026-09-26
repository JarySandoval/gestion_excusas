import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { env } from '../config/env.js';

// Asegurar que el directorio de anexos exista de manera privada
if (!fs.existsSync(env.upload.dir)) {
  fs.mkdirSync(env.upload.dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.upload.dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const nombreTecnico = `${hash}-${timestamp}${ext}`;
    cb(null, nombreTecnico);
  }
});

const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se admiten PDF, JPG, PNG y DOC/DOCX.'), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: env.upload.maxTotalSize
  },
  fileFilter
});

export const uploadAnexoSingle = upload.single('anexo');

/**
 * Middleware para carga múltiple de anexos con validación de:
 * 1. Máximo 5 archivos por operación.
 * 2. Máximo 30 MB en conjunto (tamaño total acumulado).
 * 3. Limpieza inmediata de archivos en disco si se violan los límites.
 */
export const uploadAnexosMultiples = (req, res, next) => {
  const uploadHandler = upload.fields([
    { name: 'anexos', maxCount: env.upload.maxFilesCount },
    { name: 'anexo', maxCount: 1 }
  ]);

  uploadHandler(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          const maxMB = (env.upload.maxTotalSize / (1024 * 1024)).toFixed(0);
          return res.status(400).json({
            success: false,
            message: `Uno de los archivos excede el tamaño máximo permitido de ${maxMB} MB.`
          });
        }
        if (err.code === 'LIMIT_MAX_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `No se pueden adjuntar más de ${env.upload.maxFilesCount} archivos por operación.`
          });
        }
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Error al procesar los archivos adjuntos.'
      });
    }

    // Normalizar arreglo de archivos recibidos
    const rawFiles = [];
    if (req.files) {
      if (Array.isArray(req.files.anexos)) rawFiles.push(...req.files.anexos);
      if (Array.isArray(req.files.anexo)) rawFiles.push(...req.files.anexo);
    } else if (req.file) {
      rawFiles.push(req.file);
    }

    // Función auxiliar para eliminar archivos del disco en caso de error
    const limpiarArchivos = (files) => {
      files.forEach((f) => {
        try {
          if (f.path && fs.existsSync(f.path)) {
            fs.unlinkSync(f.path);
          }
        } catch (_) {}
      });
    };

    // 1. Validar límite de cantidad de archivos (máximo 5)
    if (rawFiles.length > env.upload.maxFilesCount) {
      limpiarArchivos(rawFiles);
      return res.status(400).json({
        success: false,
        message: `Se excedió la cantidad máxima permitida de ${env.upload.maxFilesCount} archivos por operación (recibidos: ${rawFiles.length}).`
      });
    }

    // 2. Validar peso total acumulado del conjunto (máximo 30 MB)
    const totalBytes = rawFiles.reduce((acc, f) => acc + (f.size || 0), 0);
    if (totalBytes > env.upload.maxTotalSize) {
      limpiarArchivos(rawFiles);
      const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
      const maxMB = (env.upload.maxTotalSize / (1024 * 1024)).toFixed(0);
      return res.status(400).json({
        success: false,
        message: `El peso conjunto de los archivos (${totalMB} MB) supera el límite máximo permitido de ${maxMB} MB.`
      });
    }

    // Inyectar archivos validados en la petición
    req.archivosAdjuntos = rawFiles;
    if (rawFiles.length > 0) {
      req.file = rawFiles[0]; // Retrocompatibilidad
    }
    next();
  });
};
