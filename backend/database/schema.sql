-- Script DDL Institucional para bdiedlavictoria
CREATE DATABASE IF NOT EXISTS bdiedlavictoria;
USE bdiedlavictoria;

CREATE TABLE IF NOT EXISTS rol(
    id INT,
    nombre VARCHAR(30) NOT NULL,
    CONSTRAINT pk_rol PRIMARY KEY(id),
    CONSTRAINT uq_rol_nombre UNIQUE(nombre)
);

CREATE TABLE IF NOT EXISTS estado(
    id INT,
    nombre VARCHAR(30) NOT NULL,
    CONSTRAINT pk_estado PRIMARY KEY(id),
    CONSTRAINT uq_estado_nombre UNIQUE(nombre)
);

CREATE TABLE IF NOT EXISTS usuario(
    id INT,
    identificacion VARCHAR(20) NOT NULL,
    usuario VARCHAR(20) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    nombre VARCHAR(60) NOT NULL,
    apellido VARCHAR(60) NOT NULL,
    email VARCHAR(120) NOT NULL,    
    id_estado INT NOT NULL,
    id_rol INT NOT NULL,
    CONSTRAINT pk_usuario PRIMARY KEY(id),
    CONSTRAINT uq_usuario_identificacion UNIQUE(identificacion),
    CONSTRAINT uq_usuario_usuario UNIQUE(usuario),
    CONSTRAINT uq_usuario_email UNIQUE(email),
    CONSTRAINT fk_usuario_estado FOREIGN KEY(id_estado) REFERENCES estado(id),
    CONSTRAINT fk_usuario_rol FOREIGN KEY(id_rol) REFERENCES rol(id)
);

CREATE TABLE IF NOT EXISTS curso(
    id INT,
    grado VARCHAR(20) NOT NULL,
    CONSTRAINT pk_curso PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS vigencia(
    id INT,    
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    CONSTRAINT pk_vigencia PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS usuario_curso_vigencia(
    id_curso INT,
    id_vigencia INT,
    id_usuario INT,
    CONSTRAINT pk_usuario_curso_vigencia PRIMARY KEY(id_curso, id_vigencia, id_usuario),
    CONSTRAINT fk_usuario_curso_vigencia_curso FOREIGN KEY(id_curso) REFERENCES curso(id),
    CONSTRAINT fk_usuario_curso_vigencia_vigencia FOREIGN KEY(id_vigencia) REFERENCES vigencia(id),
    CONSTRAINT fk_usuario_curso_vigencia_usuario FOREIGN KEY(id_usuario) REFERENCES usuario(id)
);

CREATE TABLE IF NOT EXISTS configuracion(
    id INT,
    clave VARCHAR(50) NOT NULL,
    valor VARCHAR(255) NOT NULL,
    descripcion VARCHAR(255),
    CONSTRAINT pk_configuracion PRIMARY KEY(id),
    CONSTRAINT uq_configuracion_clave UNIQUE(clave)
);

-- ==========================================
-- TABLAS TRANSACCIONALES (PREFIJO "G1-")
-- ==========================================

CREATE TABLE IF NOT EXISTS `G1-excusa` (
    id INT,
    radicado VARCHAR(50) NOT NULL,
    id_estudiante INT NOT NULL,
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE NULL,
    es_indefinida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_retorno DATE NULL,
    motivo VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    datos_contacto VARCHAR(150) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_G1_excusa PRIMARY KEY(id),
    CONSTRAINT uq_G1_excusa_radicado UNIQUE(radicado),
    CONSTRAINT fk_G1_excusa_estudiante FOREIGN KEY(id_estudiante) REFERENCES usuario(id)
);

CREATE TABLE IF NOT EXISTS `G1-anexo` (
    id INT,
    id_excusa INT NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_tecnico VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(255) NOT NULL,
    es_restringido BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_G1_anexo PRIMARY KEY(id),
    CONSTRAINT fk_G1_anexo_excusa FOREIGN KEY(id_excusa) REFERENCES `G1-excusa`(id)
);

CREATE TABLE IF NOT EXISTS `G1-seguimiento` (
    id INT,
    id_excusa INT NOT NULL,
    id_usuario INT NOT NULL,
    observacion TEXT NOT NULL,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_G1_seguimiento PRIMARY KEY(id),
    CONSTRAINT fk_G1_seguimiento_excusa FOREIGN KEY(id_excusa) REFERENCES `G1-excusa`(id),
    CONSTRAINT fk_G1_seguimiento_usuario FOREIGN KEY(id_usuario) REFERENCES usuario(id)
);
