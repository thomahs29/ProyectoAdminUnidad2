-- Inicialización DB para Docker (init.sql)

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- tabla roles
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL CHECK (name IN ('ciudadano','funcionario','admin'))
);

INSERT INTO roles (name) VALUES ('ciudadano'), ('funcionario'), ('admin')
ON CONFLICT DO NOTHING;

-- tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut              VARCHAR(12)  NOT NULL UNIQUE CHECK (rut ~ '^[0-9]{7,8}-[0-9Kk]$'),
  nombre           TEXT         NOT NULL,
  email            CITEXT       NOT NULL UNIQUE,
  password_hash    TEXT         NOT NULL,         
  role_id          INT          NOT NULL REFERENCES roles(id),
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at ON usuarios;
CREATE TRIGGER trg_set_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Insertar usuarios de prueba
INSERT INTO usuarios (rut, nombre, email, password_hash, role_id)
VALUES 
('11111111-1', 'Usuario Ciudadano', 'ciudadano@test.com', 
  crypt('12345678', gen_salt('bf')), 
  (SELECT id FROM roles WHERE name = 'ciudadano')),
('22222222-2', 'Usuario Funcionario', 'funcionario@test.com',
  crypt('12345678', gen_salt('bf')),
  (SELECT id FROM roles WHERE name = 'funcionario')),
('33333333-3', 'Usuario Admin', 'admin@test.com',
  crypt('12345678', gen_salt('bf')),
  (SELECT id FROM roles WHERE name = 'admin'))
ON CONFLICT DO NOTHING;

-- tabla datos_municipales (información ciudadana: licencias, patentes, etc)
CREATE TABLE IF NOT EXISTS datos_municipales (
  id SERIAL PRIMARY KEY,
  rut VARCHAR(12) UNIQUE NOT NULL,
  nombre VARCHAR(100),
  
  licencia_numero VARCHAR(50),
  licencia_fecha_vencimiento DATE,
  licencia_estado VARCHAR(50),
  
  patente_numero VARCHAR(50),
  patente_estado VARCHAR(50),
  
  permiso_estado VARCHAR(50),
  
  juzgado_estado VARCHAR(50),
  
  aseo_estado VARCHAR(50),
  
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos de prueba para datos_municipales
INSERT INTO datos_municipales (rut, nombre, licencia_numero, licencia_fecha_vencimiento, licencia_estado, patente_numero, patente_estado, permiso_estado, juzgado_estado, aseo_estado)
VALUES
('11111111-1', 'Usuario Ciudadano', 'LIC-1762721594474-9797', '2026-03-17', 'al_día', 'FT-64', 'al_día', 'con_deuda', 'al_día', 'al_día')
ON CONFLICT DO NOTHING;

-- tabla tramites
CREATE TABLE IF NOT EXISTS tramites (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  requisitos TEXT,
  duracion_estimada INTEGER DEFAULT 30
);

-- Asegurar unicidad en 'tramites.nombre' para poder usar ON CONFLICT DO NOTHING
CREATE UNIQUE INDEX IF NOT EXISTS ux_tramites_nombre ON tramites(nombre);

-- tabla reservas
CREATE TABLE IF NOT EXISTS reservas (
  id SERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tramite_id INT NOT NULL REFERENCES tramites(id),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'confirmada', 'anulada', 'completada')),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- datos iniciales para tramites
INSERT INTO tramites (nombre, descripcion, requisitos)
VALUES
('Licencia Clase B', 'Otorgamiento de licencia clase B', 'Cédula de identidad, certificado médico, examen psicotécnico'),
('Renovación Clase B', 'Renovación de licencia clase B', 'Cédula vigente, certificado médico'),
('Licencia Clase C', 'Otorgamiento licencia motocicleta', 'Certificado escuela conductores, cédula de identidad')
ON CONFLICT DO NOTHING;

-- tabla documentos
CREATE TABLE IF NOT EXISTS documentos (
  id SERIAL PRIMARY KEY,
  reserva_id INT NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  nombre_archivo TEXT NOT NULL,
  ruta_archivo TEXT NOT NULL,
  tipo_mime TEXT,
  peso_mb NUMERIC(6,2),
  subido_en TIMESTAMPTZ DEFAULT now()
);

-- tabla ia_faqs (preguntas sugeridas para que la IA las responda)
CREATE TABLE IF NOT EXISTS ia_faqs (
  id SERIAL PRIMARY KEY,
  pregunta TEXT NOT NULL UNIQUE,
  categoria VARCHAR(50),
  palabras_clave TEXT[],
  activa BOOLEAN DEFAULT TRUE,
  creada_en TIMESTAMPTZ DEFAULT now(),
  actualizada_en TIMESTAMPTZ DEFAULT now()
);

-- Insertar preguntas sugeridas de ejemplo
INSERT INTO ia_faqs (pregunta, categoria, palabras_clave)
VALUES
('¿Cómo solicito una licencia de conducir?', 
 'licencia',
 ARRAY['licencia', 'solicitar', 'conducir', 'documento']),

('¿Cuáles son los requisitos para renovar mi licencia?',
 'renovacion',
 ARRAY['renovar', 'licencia', 'vencida', 'requisitos']),

('¿Cuál es el costo de una licencia de conducir?',
 'costos',
 ARRAY['costo', 'precio', 'aranceles', 'licencia', 'pagar']),

('¿Cuáles son los horarios de atención de la municipalidad?',
 'horarios',
 ARRAY['horario', 'atención', 'abierto', 'cerrado', 'municipalidad']),

('¿Cómo agendo una cita para trámite?',
 'reservas',
 ARRAY['cita', 'reserva', 'agendar', 'hora', 'fecha'])
ON CONFLICT DO NOTHING;

-- Tabla de historial de conversaciones con la IA
CREATE TABLE IF NOT EXISTS ia_conversaciones (
    id SERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    modelo VARCHAR(50),
    creado_en TIMESTAMP DEFAULT NOW()
);
