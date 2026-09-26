import { useState, useRef } from 'react';
import { Upload, FileText, X, AlertTriangle, HardDrive, Lock, Unlock } from 'lucide-react';

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];

export default function MultiFileUpload({
  files = [],
  onChange,
  maxFiles = 5,
  maxTotalSizeMB = 30,
  themeColor = 'blue',
  title = 'Soporte Documental (Opcional)',
  hint = 'Formatos permitidos: PDF, JPG, PNG, DOC, DOCX. Máximo 5 archivos y hasta 30 MB en conjunto.',
  inputId = 'multi-file-upload'
}) {
  const [errorLocal, setErrorLocal] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Normalizar items: { file: File, esRestringido: boolean }
  const normalizedFiles = files.map(item => {
    if (item instanceof File) {
      return { file: item, esRestringido: false };
    }
    return {
      file: item.file || item,
      esRestringido: Boolean(item.esRestringido)
    };
  });

  const maxTotalBytes = maxTotalSizeMB * 1024 * 1024;
  const totalBytes = normalizedFiles.reduce((acc, item) => acc + (item.file?.size || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const percentUsed = Math.min(100, Math.round((totalBytes / maxTotalBytes) * 100));

  const isAmber = themeColor === 'amber';
  const buttonBg = isAmber
    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
    : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200';
  const buttonIconColor = isAmber ? 'text-amber-700' : 'text-blue-700';
  const dragActiveBorder = isAmber
    ? 'border-amber-500 bg-amber-50/50'
    : 'border-blue-500 bg-blue-50/50';

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const procesarArchivos = (nuevosArchivosLista) => {
    setErrorLocal(null);
    const nuevos = Array.from(nuevosArchivosLista || []);
    if (nuevos.length === 0) return;

    // 1. Filtrar extensiones válidas
    const validos = [];
    for (const f of nuevos) {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setErrorLocal(`El archivo "${f.name}" no tiene un formato admitido. Solo se permiten PDF, JPG, PNG, DOC y DOCX.`);
        return;
      }
      validos.push(f);
    }

    // 2. Comprobar si ya existen por nombre
    const archivosExistentesNombres = new Set(normalizedFiles.map(i => i.file.name));
    const sinDuplicados = validos.filter(f => !archivosExistentesNombres.has(f.name));

    if (sinDuplicados.length < validos.length) {
      setErrorLocal('Algunos archivos ya se encontraban en la lista y fueron omitidos.');
    }

    // 3. Validar cantidad máxima total
    const nuevosObjetos = sinDuplicados.map(f => ({
      file: f,
      esRestringido: false
    }));
    const combinado = [...normalizedFiles, ...nuevosObjetos];

    if (combinado.length > maxFiles) {
      setErrorLocal(`No se pueden adjuntar más de ${maxFiles} archivos por operación. Se seleccionaron ${combinado.length}.`);
      return;
    }

    // 4. Validar peso conjunto (30 MB)
    const nuevoTotalBytes = combinado.reduce((acc, item) => acc + (item.file?.size || 0), 0);
    if (nuevoTotalBytes > maxTotalBytes) {
      const nuevoTotalMB = (nuevoTotalBytes / (1024 * 1024)).toFixed(2);
      setErrorLocal(`El peso conjunto de los archivos seleccionados (${nuevoTotalMB} MB) superaría el límite máximo de ${maxTotalSizeMB} MB.`);
      return;
    }

    if (onChange) {
      onChange(combinado);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      procesarArchivos(e.target.files);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setErrorLocal(null);
    const actualizados = normalizedFiles.filter((_, idx) => idx !== indexToRemove);
    if (onChange) {
      onChange(actualizados);
    }
  };

  const handleToggleRestringido = (indexToToggle) => {
    const actualizados = normalizedFiles.map((item, idx) => {
      if (idx !== indexToToggle) return item;
      return {
        ...item,
        esRestringido: !item.esRestringido
      };
    });
    if (onChange) {
      onChange(actualizados);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarArchivos(e.dataTransfer.files);
    }
  };

  const hayRestringidos = normalizedFiles.some(f => f.esRestringido);

  return (
    <div className="space-y-3">
      {/* Título y descripción */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-0.5">
          {title}
        </label>
        {hint && (
          <p className="text-[11px] text-slate-500 leading-tight">
            {hint}
          </p>
        )}
      </div>

      {/* Zona de Carga / Botón */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-3.5 sm:p-4 text-center transition-colors ${
          isDragging
            ? dragActiveBorder
            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileChange}
          className="sr-only"
        />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <label
            htmlFor={inputId}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs ${buttonBg}`}
          >
            <Upload className={`w-4 h-4 ${buttonIconColor}`} />
            <span>Seleccionar archivo(s)</span>
          </label>
          <span className="text-xs text-slate-500">
            o arrastra y suelta aquí hasta {maxFiles} archivos
          </span>
        </div>
      </div>

      {/* Alerta de Error local de validación */}
      {errorLocal && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorLocal}</span>
        </div>
      )}

      {/* Medidor de Cuota Conjunta (máx 30 MB) */}
      {normalizedFiles.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-semibold flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>Peso conjunto: <strong>{totalMB} MB</strong> de {maxTotalSizeMB} MB</span>
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              {normalizedFiles.length} de {maxFiles} archivos
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                percentUsed > 85 ? 'bg-rose-500' : percentUsed > 60 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>
      )}

      {/* Lista de archivos seleccionados con toggle individual de confidencialidad */}
      {normalizedFiles.length > 0 ? (
        <div className="space-y-2">
          {normalizedFiles.map((item, idx) => (
            <div
              key={`${item.file.name}-${idx}`}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border text-xs transition-colors ${
                item.esRestringido
                  ? 'bg-rose-50/50 border-rose-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className={`w-4 h-4 shrink-0 ${item.esRestringido ? 'text-rose-500' : 'text-slate-400'}`} />
                <span className="font-semibold text-slate-800 truncate" title={item.file.name}>
                  {item.file.name}
                </span>
                <span className="text-slate-400 text-[11px] shrink-0 font-mono">
                  ({formatFileSize(item.file.size)})
                </span>
              </div>

              {/* Controles por archivo: Toggle Confidencial + Eliminar */}
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <button
                  type="button"
                  onClick={() => handleToggleRestringido(idx)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                    item.esRestringido
                      ? 'bg-rose-100 border-rose-300 text-rose-800 hover:bg-rose-200'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title={
                    item.esRestringido
                      ? 'Restringido: Solo Coordinación y estudiante autor pueden descargarlo'
                      : 'Público institucional: Docentes y Coordinación pueden descargarlo'
                  }
                >
                  {item.esRestringido ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-rose-700" />
                      <span>Confidencial</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-500 font-normal">Visible a Docentes</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Quitar este archivo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Nota pedagógica sobre la privacidad */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Privacidad por archivo:</strong> Haz clic en el candado de cada archivo para marcarlo como <strong>Confidencial</strong> (reserva médica accesible solo por Coordinación) o dejarlo <strong>Visible a Docentes</strong> para justificar inasistencias en clase.
              {hayRestringidos && (
                <span className="text-rose-700 font-medium block mt-0.5">
                  Hay archivo(s) protegidos con reserva médica en esta solicitud.
                </span>
              )}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic text-center py-1">
          Ningún archivo seleccionado todavía (adjuntos opcionales).
        </p>
      )}
    </div>
  );
}
