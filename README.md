# CreativaLabs.io — sitio web

Sitio estático publicado en GitHub Pages: https://artemano.github.io/creativalabs.io/

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

## Dominio propio

Para servir el sitio en `creativalabs.io`: cree un archivo `CNAME` con `creativalabs.io`, configure el DNS del dominio según la guía de GitHub Pages, cambie `baseUrl` en `data/site.json` a `https://creativalabs.io/` y ejecute `node scripts/build.mjs`.

## Pendientes conocidos

- Enlaces sin destino aún (`"href": "#"`): política de tratamiento de datos, LinkedIn, lectura de la guía, PDF y autoevaluación.
