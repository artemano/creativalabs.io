-- Base D1 de CreativaLabs.io: solicitudes de contacto y autoevaluaciones.
-- Crear una vez:  npx wrangler d1 execute creativalabs --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creado TEXT NOT NULL,                 -- fecha ISO (UTC)
  tipo TEXT NOT NULL,                   -- 'contacto' | 'autoevaluacion'
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL,
  organizacion TEXT,
  cargo TEXT,
  tema TEXT,                            -- contacto: tema elegido
  descripcion TEXT,                     -- contacto: desafío descrito
  zona TEXT,                            -- autoevaluación: zona evaluada
  nivel INTEGER,                        -- autoevaluación: nivel 0 a 4
  respuestas TEXT,                      -- autoevaluación: respuestas en JSON
  novedades INTEGER NOT NULL DEFAULT 0, -- autorizó recibir novedades
  consentimiento_version TEXT NOT NULL, -- versión de la política aceptada (prueba de autorización)
  idioma TEXT,
  origen TEXT,
  pais TEXT,
  agente TEXT
);
CREATE INDEX IF NOT EXISTS leads_correo ON leads (correo);
CREATE INDEX IF NOT EXISTS leads_creado ON leads (creado);
