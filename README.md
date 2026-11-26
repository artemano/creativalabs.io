# CreativaLabs.io — sitio web

Sitio estático publicado en Cloudflare Workers (assets estáticos): https://creativalabs.io/

## Dónde está cada cosa

Todo el texto, los datos y la metadata del sitio viven en archivos JSON. El HTML y el JavaScript no contienen contenido: solo leen esos archivos y los dibujan.

| Archivo | Contenido |
|---|---|
| `data/site.json` | Marca, correo de contacto, empresa, **indicadores**: `companyIndicators` (los de la empresa, en el inicio) y `people.rafael-pino.indicators` (los de Rafael, en TELAR y Equipo), personas, datos del libro, rutas, título y descripción de cada página, pie de página y bloque de cierre |
| `data/es/home.json`, `data/en/home.json` | Inicio: servicios (cuatro frentes), modalidades, banda TELAR, libro, equipo |
| `data/es/telar.json`, `data/en/telar.json` | Página del método TELAR |
| `data/es/equipo.json`, `data/en/equipo.json` | Equipo y trayectoria |
| `assets/js/app.js` | Lee los JSON y dibuja cada tipo de sección (`hero`, `fronts`, `method`, `team`, …) |
| `assets/css/site.css` | Estilos |
| `assets/img/` | Imágenes |
| `scripts/build.mjs` | Genera los `index.html` de cada ruta, `sitemap.xml`, `robots.txt` y `404.html` desde `data/site.json` |

## Cómo editar

- **Cambiar un texto o una cifra:** edite el JSON correspondiente y suba el cambio. No hace falta compilar nada.
- **Cambiar un indicador:** los de la empresa están en `companyIndicators` y se ven en el inicio; los de Rafael están en `people.rafael-pino.indicators` y se ven en TELAR y en Equipo. Cada lista se edita una sola vez para ambos idiomas.
- **Cambiar títulos o descripciones de página, rutas o la URL base:** edite `data/site.json` y ejecute `node scripts/build.mjs` para regenerar los `index.html` (llevan la metadata en el `<head>` para buscadores y redes sociales).

### Convenciones de enlaces en los JSON

- `"@telar#metodo"` → página TELAR, sección `metodo`, en el idioma actual (`@home`, `@telar`, `@equipo`).
- `"@alt"` → la misma página en el otro idioma.
- `"mail:Asunto"` → `mailto:` al correo de `site.json` con ese asunto; `"mail:"` sin asunto.
- `"#seccion"` → ancla en la misma página.

Los textos admiten HTML en línea (`<em>`, `<b>`, `<br>`).

### Estilos de botón (`style`)

`primary` (naranja), `indigo`, `outline`, `light`, `light-sm`, `ghost`, `purple`.

## Probar en local

```bash
python3 -m http.server 8000
# abrir http://localhost:8000/
```

(Abrir el HTML con doble clic no funciona: el navegador bloquea la lectura de los JSON desde `file://`.)

## Publicación (Cloudflare)

- `wrangler.jsonc` publica la raíz del repo como sitio estático en el Worker `creativalabs-io`, con los dominios `creativalabs.io` y `www.creativalabs.io`. Las páginas no encontradas sirven `404.html`.
- `.assetsignore` excluye lo que no debe publicarse (`scripts/`, `README.md`, configuración).
- Cloudflare despliega en cada push a `main` (Workers & Pages → Import a repository; sin comando de build; deploy: `npx wrangler deploy`).
- Si cambia el dominio, actualice `baseUrl` en `data/site.json` y ejecute `node scripts/build.mjs` antes del push.
- Prueba local con el mismo comportamiento de Cloudflare: `npx wrangler dev`.


## Formularios (contacto y autoevaluación)

- `worker/index.js` atiende `POST /api/contacto` y `POST /api/autoevaluacion`; el resto lo sirve `ASSETS` como sitio estático.
- Cada envío se guarda en la base D1 `creativalabs` (tabla `leads`, ver `schema.sql`) con la versión de la política aceptada.
- Los correos salen por Resend desde `MAIL_FROM`: aviso a `MAIL_TO` y, en la autoevaluación, el informe a la persona. El informe se arma con el mismo `data/es/autoevaluacion.json` que usa la página.
- Secretos: `RESEND_API_KEY` y `TURNSTILE_SECRET` (`npx wrangler secret put …`). La clave pública de Turnstile va en `site.json → form.turnstileSiteKey`. Sin secretos, el Worker omite el correo o la verificación y lo deja en el registro (útil en `wrangler dev`).
- Prueba local: `npx wrangler d1 execute creativalabs --local --file=schema.sql` y luego `npx wrangler dev`.

## Sitio fusionado (v2, 19 nov 2026)

- Diez páginas en español: inicio, servicios, diagnóstico, arquitectura empresarial, TELAR, SPIRAL, CTO fraccional, acerca de (`equipo/`), recursos y contacto. El inglés queda pendiente: `site.json → languages` solo tiene `es` y los JSON de `data/en/` se conservan para la siguiente entrega.
- Menú y botón principal comunes en `site.json → nav` y `cta`; pie en `footer.es` (los enlaces con `href: "#"` no se muestran).
- Tipos de sección nuevos en `app.js`: `heroWeave` (inicio con tela, foco de luz y destellos), `pagehead`, `prose`, `cards`, `collision` (por qué ahora, en TELAR) y `contactForm`.
- Formulario: `site.json → form.enabled` está en `false` hasta publicar la política de tratamiento de datos; mientras tanto la página de contacto ofrece el correo. El envío va a `form.endpoint` (`/api/contacto`, función del Worker por construir) y admite `?tema=` para preseleccionar el tema.
- Brochure de TELAR en `assets/docs/`.

## Pendientes conocidos

- Enlaces sin destino aún (`"href": "#"`): política de tratamiento de datos, LinkedIn, lectura de la guía, PDF y autoevaluación.
