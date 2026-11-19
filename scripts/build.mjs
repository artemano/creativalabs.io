// Genera las páginas HTML (cascarones), sitemap.xml y robots.txt a partir de data/site.json.
// El contenido de cada página NO se genera aquí: el navegador lo lee de data/<lang>/<page>.json.
// Uso: node scripts/build.mjs   (solo hace falta al cambiar metadata, rutas o páginas)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(readFileSync(join(ROOT, "data/site.json"), "utf8"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const FONTS = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=JetBrains+Mono:wght@500;700&display=swap";
const OG_LOCALE = { es: "es_CO", en: "en_US" };

function shell(page, lang) {
  const meta = site.pages[page][lang];
  const depth = meta.path.split("/").filter(Boolean).length;
  const root = depth ? "../".repeat(depth) : "./";
  const url = site.baseUrl + meta.path;
  const alternates = site.languages
    .map((l) => `<link rel="alternate" hreflang="${l}" href="${site.baseUrl + site.pages[page][l].path}">`)
    .join("\n") + `\n<link rel="alternate" hreflang="x-default" href="${site.baseUrl + site.pages[page][site.defaultLanguage].path}">`;
  return `<!doctype html>
<!-- Generado por scripts/build.mjs desde data/site.json. No editar a mano. -->
<html lang="${lang}" data-page="${page}" data-root="${root}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<meta name="theme-color" content="${esc(site.themeColor)}">
<link rel="canonical" href="${url}">
${alternates}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.brand.full)}">
<meta property="og:locale" content="${OG_LOCALE[lang] || lang}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:image" content="${site.baseUrl + site.ogImage}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${root}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="${root}assets/css/site.css">
<script src="${root}assets/js/app.js" defer></script>
</head>
<body>
<main id="app" aria-busy="true"></main>
<noscript><p style="padding:32px;font-family:system-ui">${lang === "es" ? "Este sitio necesita JavaScript para mostrar su contenido." : "This site needs JavaScript to display its content."}</p></noscript>
</body>
</html>
`;
}

const urls = [];
for (const page of Object.keys(site.pages)) {
  for (const lang of site.languages) {
    const p = site.pages[page][lang].path;
    const file = join(ROOT, p, "index.html");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, shell(page, lang));
    urls.push(site.baseUrl + p);
    console.log("✓", p || "/", "→", page, lang);
  }
}

// 404: Cloudflare lo sirve para cualquier ruta inexistente (not_found_handling); redirige al inicio.
writeFileSync(join(ROOT, "404.html"), `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>${esc(site.brand.full)}</title>
<meta http-equiv="refresh" content="0; url=${site.baseUrl}"></head>
<body><p><a href="${site.baseUrl}">${esc(site.brand.full)}</a></p></body></html>
`);
writeFileSync(join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>
`);
writeFileSync(join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${site.baseUrl}sitemap.xml\n`);
console.log("✓ 404.html, sitemap.xml, robots.txt");
