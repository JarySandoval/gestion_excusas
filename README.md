# Módulo de Radicación y Seguimiento de Excusas Escolares
## Institución Educativa Distrital (IED) La Victoria • Vigencia 2026

Aplicación web integral para la radicación, gestión, seguimiento y trazabilidad cronológica de inasistencias escolares en la **IED La Victoria**, conectada a la base de datos MySQL `bdiedlavictoria` y desarrollada con una arquitectura desacoplada bajo estándares de alta calidad técnica.

---

## 🏛️ Contexto Institucional y Reglas Operativas

1. **Sin Aprobaciones ni Rechazos Arbitrarios:**
   - La excusa escolar nace formalmente **radicada** al ser registrada por el estudiante/acudiente.
   - En inasistencias indefinidas (médicas/quirúrgicas), el cierre formal se efectúa al reincorporarse a la jornada mediante el registro de la `fecha_retorno`, siendo el adjunto de soporte documental o alta médica opcional (**HU-08**).
2. **Estructura de Credenciales de Acceso:**
   - **Usuario:** `[inicial primer nombre][primer apellido][número]` (ejemplo: `jperez1`, `cgomez1`, `mrodriguez1`).
   - **Contraseña:** Número de documento de identidad del usuario (hasheada con `bcryptjs`).
3. **Roles y Estados de Cuenta:**
   - Roles (`rol`): `1: Coordinador`, `2: Docente`, `3: Estudiante`.
   - Estados (`estado`): `1: Activo`, `2: Bloqueado`. Las cuentas bloqueadas no pueden iniciar sesión (**HU-01**).
4. **Protección, Confidencialidad y Soporte Multi-Archivo (HU-03 y HU-09):**
   - Los archivos adjuntos se guardan en un directorio privado fuera del webroot (`uploads/anexos/`) con renombrado a hash criptográfico (`nombre_tecnico`) (**HU-03**).
   - Se admite la carga de **hasta 5 archivos por operación** con un **límite conjunto de 30 MB acumulados**, tanto en la radicación inicial de la inasistencia como en el cierre formal de excusas indefinidas.
   - Si los anexos se marcan con la bandera `es_restringido = true` (**HU-09**, disponible en radicación y en cierre), únicamente el **Coordinador** (`rol = 1`) y el estudiante autor pueden descargarlos. En la vista de los **Docentes** se muestra un aviso explícito de confidencialidad médica e institucional y se bloquea la descarga.
5. **Control de Solapamiento de Excusas:**
   - Se impide que un mismo estudiante radique excusas que colisionen o se pisen en fechas con excusas previamente registradas. Si existe solapamiento, el sistema rechaza la solicitud indicando el radicado y período en conflicto.
6. **Estado "Anulada" e Inmutabilidad de Auditoría:**
   - Ningún registro se borra físicamente. Al corregir errores de radicación, una excusa pasa a estado **Anulada**, liberando el calendario escolar para permitir nuevas radicaciones y excluyéndose de las estadísticas de inasistencia activa.
   - **Estudiantes:** Cuentan con una ventana de **15 minutos** posterior a la radicación para anular directamente errores de dedo. Tras 15 minutos, el registro se congela y deben utilizar la opción **Solicitar Anulación / Reportar Error**.
   - **Docentes y Coordinadores:** Pueden anular directamente cualquier excusa en cualquier momento especificando el motivo, el cual queda sellado en la bitácora de seguimiento institucional (`G1-seguimiento`).

---

## 🚀 Historias de Usuario Satisfechas (HU-01 a HU-09)

| Historia | Título | Descripción de Implementación |
| :---: | :--- | :--- |
| **HU-01** | **Autenticación Institucional** | Login seguro con JWT y verificación de estado activo. El estudiante (`rol 3`) ingresa a su portal de radicación y seguimiento; docentes (`rol 2`) y coordinadores (`rol 1`) acceden al portal administrativo. |
| **HU-02** | **Radicación de Excusas** | Formulario para radicar ausencias: rango de fechas o toggle `es_indefinida`, motivo institucional, descripción, datos de contacto y anexo opcional. Genera consecutivo único `RAD-YYYY-XXXXX`. |
| **HU-03** | **Almacenamiento Seguro de Anexos** | Guardado de archivos mediante `multer` en almacenamiento privado desacoplado. Streaming y descarga protegida por token JWT. |
| **HU-04** | **Consulta Diaria y Filtros Avanzados** | Panel administrativo que carga por defecto las novedades activas del día (`CURDATE()`) con filtros reactivos por rango de fechas, curso/grado, estudiante y motivo. |
| **HU-05** | **Línea de Tiempo del Estudiante** | Componente interactivo y cronológico (`StudentTimeline`) que visualiza el historial acumulado de inasistencias a través de las diferentes vigencias académicas y cursos cursados. |
| **HU-06** | **Seguimiento Institucional** | Registro de actuaciones y observaciones en `` `G1-seguimiento` `` por parte de docentes y coordinadores. Las observaciones son editables por su autor durante los primeros 15 minutos; posterior a ese lapso, pueden ser eliminadas. |
| **HU-07** | **Exportación CSV** | Descarga de reporte consolidado en Excel/CSV según los filtros activos, habilitado y visible **únicamente para `id_rol = 1` (Coordinador)** con codificación UTF-8 BOM. |
| **HU-08** | **Cierre de Excusas Indefinidas** | Módulo para listar excusas abiertas (`es_indefinida = 1 AND fecha_retorno IS NULL`), fijar fecha de retorno y adjuntar soporte médico o de reincorporación (opcional). |
| **HU-09** | **Anexos Restringidos** | Control estricto de confidencialidad para archivos sensibles: descarga reservada para Coordinación y aviso preventivo en la vista de Docentes. |

---

## 📁 Estructura del Proyecto

```text
gestion_excusas/
├── backend/                         # Servidor API REST en Node.js + Express
│   ├── config/                      # Configuración de base de datos MySQL (pool) y variables de entorno
│   ├── controllers/                 # Controladores para Auth, Excusas, Anexos, Seguimiento, Catálogos, Reportes
│   ├── database/                    # Script DDL oficial (schema.sql) y seeder (seed.js)
│   ├── middlewares/                 # Verificación JWT, RBAC, Multer privado y error handler
│   ├── routes/                      # Enrutadores REST (/auth, /excusas, /anexos, /catalogos, /reportes)
│   ├── services/                    # Generador de radicado único y normalizador de usuarios
│   ├── uploads/anexos/              # Directorio privado de almacenamiento fuera del webroot
│   ├── test-suite.js                # Pruebas automatizadas de reglas institucionales
│   ├── package.json
│   └── server.js                    # Punto de entrada del backend
│
├── frontend/                        # Aplicación SPA en React 19 + Tailwind CSS + Vite
│   ├── src/
│   │   ├── api/client.js            # Cliente HTTP con interceptores JWT y descarga de archivos
│   │   ├── components/
│   │   │   ├── common/              # Navbar, Sidebar institucional, Badges, Modales, Toast
│   │   │   ├── excusas/             # FormularioRadicacion, TablaExcusas, ModalCierreIndefinida, DetalleExcusaModal
│   │   │   ├── filters/             # AdvancedFilterBar con novedades del día y exportación CSV
│   │   │   └── timeline/            # StudentTimeline con agrupación cronológica por año lectivo
│   │   ├── context/AuthContext.jsx  # Gestión global de sesión, token y RBAC
│   │   ├── hooks/                   # useAuth, useExcusas, useCatalogos
│   │   ├── pages/                   # LoginPage, EstudianteDashboard, RadicarExcusaPage, ExcusasAbiertasPage, AdminDashboard, HistorialEstudiantePage
│   │   ├── routes/                  # AppRoutes y ProtectedRoute con control de acceso por rol
│   │   ├── App.jsx
│   │   └── index.css                # Estilos globales y Tailwind CSS
│   ├── vite.config.js               # Proxy hacia backend en :4000 y plugin Tailwind
│   └── package.json
│
├── package.json                     # Scripts de ejecución raíz
└── README.md
```

---

## 🔑 Credenciales de Prueba Preconfiguradas

| Rol | Nombre | Usuario | Contraseña (Documento) | Permisos Clave |
| :--- | :--- | :--- | :--- | :--- |
| **Coordinador** (`rol = 1`) | María Elena Rodríguez | `mrodriguez1` | `51987456` | Acceso a todo, descarga de anexos restringidos (HU-09) y Exportación CSV (HU-07) |
| **Docente** (`rol = 2`) | Carlos Andrés Gómez | `cgomez1` | `79654123` | Consulta diaria (HU-04), seguimiento (HU-06). Aviso de confidencialidad en restringidos |
| **Estudiante** (`rol = 3`) | Juan Camilo Pérez | `jperez1` | `1012345678` | Portal estudiantil, radicación (HU-02), cierre de abiertas (HU-08), timeline propio |
| **Estudiante** (`rol = 3`) | Valentina Mendoza | `vmendoza1` | `1098765432` | Estudiante con excusas radicadas |
| **Bloqueado** (`estado = 2`) | Diego Fernando López | `dlopez1` | `1034567890` | Verificación de rechazo por cuenta inactiva (HU-01) |

---

## ⚙️ Puesta en Marcha

### 1. Requisitos Previos
- **Node.js**: v18 o superior (v24 recomendado).
- **MySQL**: Servidor MySQL con base de datos `bdiedlavictoria`.

### 2. Configuración de Base de Datos
En `backend/.env`, configure las credenciales de su MySQL:
```env
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=su_contraseña
DB_NAME=bdiedlavictoria
```

Si desea inicializar la base de datos con los datos institucionales y de prueba:
```bash
cd backend
npm run seed
```

### 3. Iniciar Backend
```bash
cd backend
npm run dev
```
El servidor quedará disponible en `http://localhost:4000` con su endpoint de salud en `http://localhost:4000/api/health`.

### 4. Iniciar Frontend
En una nueva terminal:
```bash
cd frontend
npm run dev
```
Abra en su navegador `http://localhost:5173`.

---

## 🧪 Pruebas Automatizadas
Para ejecutar la suite de pruebas unitarias y de reglas de negocio en el backend:
```bash
cd backend
node test-suite.js
```
Verifica:
- Regla de conformación de nombres de usuario institucionales.
- Cifrado y validación de contraseñas con `bcryptjs`.
- Generación de tokens JWT y roles.
- Control RBAC en descarga de anexos restringidos (HU-09).
- Restricción de exportación CSV exclusiva para Coordinación (HU-07).
- Regla de cierre formal de excusas indefinidas con fecha de retorno y soporte opcional (HU-08).
- Detección y bloqueo de solapamiento de fechas entre excusas activas.
- Regla institucional de anulación con ventana de 15 minutos para estudiantes y acceso directo docente/coordinador.
- Validación de carga múltiple de anexos con tope conjunto de 30 MB y máximo 5 archivos por operación.
- Protección de reserva médica y confidencialidad en soportes de cierre formal de excusas indefinidas.