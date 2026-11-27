// Worker de CreativaLabs.io
// - Sirve el sitio estático (binding ASSETS).
// - POST /api/contacto: guarda la solicitud en D1 y avisa a hablemos@.
// - POST /api/autoevaluacion: guarda el resultado en D1, envía el informe
//   a la persona y avisa a hablemos@.
// Secretos (wrangler secret put): RESEND_API_KEY, TURNSTILE_SECRET.
// Variables (wrangler.jsonc → vars): MAIL_FROM, MAIL_TO, SITE_URL.
// Sin RESEND_API_KEY o sin TURNSTILE_SECRET (por ejemplo en `wrangler dev`)
// se omite ese paso y se deja constancia en el registro.

const CONSENT_VERSION = "2026-11-19";
const MAX = { corto: 200, largo: 4000 };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contacto" || url.pathname === "/api/autoevaluacion") {
      if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);
      try {
        return url.pathname === "/api/contacto"
          ? await contacto(request, env, ctx)
          : await autoevaluacion(request, env, ctx);
      } catch (err) {
        console.error(err && err.stack || err);
        return json({ ok: false, error: "server" }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};

/* ---------------- endpoints ---------------- */

async function contacto(request, env, ctx) {
  const f = await readBody(request);
  if (f.web) return json({ ok: true }); // campo trampa: bots
  const d = {
    nombre: txt(f.nombre), correo: txt(f.correo).toLowerCase(), organizacion: txt(f.organizacion),
    tema: txt(f.tema), descripcion: txt(f.descripcion, MAX.largo),
    novedades: on(f.novedades), consentimiento: on(f.consentimiento),
    idioma: txt(f.idioma) || "es", origen: txt(f.origen, 500),
  };
  const bad = missing(d, ["nombre", "correo", "organizacion", "descripcion"]) || (!isEmail(d.correo) && "correo") || (!d.consentimiento && "consentimiento");
  if (bad) return json({ ok: false, error: "invalid", field: bad }, 400);
  const hv = await human(f["cf-turnstile-response"], request, env);
  if (!hv.ok) return json({ ok: false, error: "captcha", codes: hv.codes }, 403);

  await save(env, request, { tipo: "contacto", ...d });
  ctx.waitUntil(send(env, {
    to: env.MAIL_TO, reply_to: d.correo,
    subject: `Solicitud de contacto: ${d.organizacion} · ${d.tema || "sin tema"}`,
    html: notice("Nueva solicitud de contacto", [
      ["Nombre", d.nombre], ["Correo", d.correo], ["Organización", d.organizacion], ["Tema", d.tema],
      ["Novedades", d.novedades ? "Sí" : "No"], ["Origen", d.origen], ["Descripción", d.descripcion],
    ]),
  }));
  return json({ ok: true });
}

async function autoevaluacion(request, env, ctx) {
  const f = await readBody(request);
  if (f.web) return json({ ok: true });
  const d = {
    nombre: txt(f.nombre), correo: txt(f.correo).toLowerCase(), organizacion: txt(f.organizacion),
    cargo: txt(f.cargo), zona: txt(f.zona), novedades: on(f.novedades), consentimiento: on(f.consentimiento),
    idioma: txt(f.idioma) || "es", origen: txt(f.origen, 500),
  };
  const bad = missing(d, ["nombre", "correo", "organizacion"]) || (!isEmail(d.correo) && "correo") || (!d.consentimiento && "consentimiento");
  if (bad) return json({ ok: false, error: "invalid", field: bad }, 400);
  const hv = await human(f["cf-turnstile-response"], request, env);
  if (!hv.ok) return json({ ok: false, error: "captcha", codes: hv.codes }, 403);

  // El modelo se lee del propio sitio: el informe usa las mismas preguntas y niveles que la página.
  const page = await env.ASSETS.fetch(new URL("/data/es/autoevaluacion.json", request.url)).then((r) => r.json());
  const D = page.sections.find((s) => s.type === "assessment").data;
  const raw = typeof f.respuestas === "string" ? safeJSON(f.respuestas) : f.respuestas || {};
  const ids = new Set([...D.preguntas.map((q) => q.id), ...D.contexto.map((c) => c.id)]);
  const ans = {};
  for (const k of Object.keys(raw || {})) if (ids.has(k)) ans[k] = String(raw[k]).slice(0, 10);
  if (!D.preguntas.some((q) => ans[q.id])) return json({ ok: false, error: "invalid", field: "respuestas" }, 400);

  const r = result(D, ans);
  await save(env, request, { tipo: "autoevaluacion", ...d, nivel: r.lv, respuestas: JSON.stringify(ans) });

  const site = env.SITE_URL || new URL(request.url).origin;
  ctx.waitUntil(Promise.all([
    send(env, {
      to: d.correo, reply_to: env.MAIL_TO,
      subject: `Su informe de madurez TELAR: nivel ${r.lv} · ${r.info.nombre}`,
      html: report(D, ans, r, d, site),
    }),
    send(env, {
      to: env.MAIL_TO, reply_to: d.correo,
      subject: `Autoevaluación: ${d.organizacion} · nivel ${r.lv} (${r.info.nombre})`,
      html: notice("Nueva autoevaluación completada", [
        ["Nombre", d.nombre], ["Correo", d.correo], ["Organización", d.organizacion], ["Cargo", d.cargo],
        ["Zona evaluada", d.zona], ["Nivel", `${r.lv} · ${r.info.nombre}`],
        ["Contexto", D.contexto.map((c) => `${c.texto} ${c.opciones[ans[c.id]] ?? "—"}`).join("\n")],
        ["Criterios pendientes", r.gaps.map((g) => `${g.q.id} (${label(ans[g.q.id])})`).join(", ") || "—"],
        ["Novedades", d.novedades ? "Sí" : "No"], ["Origen", d.origen],
      ]),
    }),
  ]));
  return json({ ok: true, nivel: r.lv });
}

/* ---------------- modelo de madurez ---------------- */

function result(D, ans) {
  const qsOf = (n) => D.preguntas.filter((q) => q.nivel === n);
  let lv = 0;
  for (let n = 1; n <= 4; n++) { if (qsOf(n).every((q) => ans[q.id] === "si")) lv = n; else break; }
  const val = (id) => (D.respuestas.find((x) => x.id === ans[id]) || { valor: 0 }).valor;
  const dims = [...new Set(D.preguntas.map((q) => q.dimension))].map((d) => {
    const qs = D.preguntas.filter((q) => q.dimension === d);
    return { d, pct: Math.round((100 * qs.reduce((a, q) => a + val(q.id), 0)) / qs.length) };
  });
  const gaps = D.preguntas.filter((q) => q.nivel > lv && ans[q.id] !== "si").map((q) => ({ q, part: ans[q.id] === "parcial" }));
  return { lv, info: D.niveles[lv], dims, gaps, qsOf };
}

function label(a) { return { si: "sí", parcial: "parcial", no: "no", nose: "no sabe" }[a] || "sin responder"; }

/* ---------------- correos ---------------- */

const C = { ink: "#16181F", paper: "#FBFAF6", cream: "#F5F1E8", indigo: "#3552A8", rust: "#E5784A", muted: "#5B6170", line: "#E2DDD2" };
const FONT = "font-family:Helvetica,Arial,sans-serif;";

function report(D, ans, r, d, site) {
  const { lv, info, dims, gaps } = r;
  const next = lv < 4 ? D.niveles[lv + 1] : null;
  const byLevel = [1, 2, 3, 4].filter((n) => n > lv).map((n) => ({ n, lvl: D.niveles[n], items: gaps.filter((g) => g.q.nivel === n) })).filter((x) => x.items.length);
  const zone = d.zona ? esc(d.zona) : "la zona evaluada";
  const clients = ans.C1 === "1" || ans.C1 === "2";
  const fab = clients ? "Su organización construye software para clientes: el nivel de madurez también define cómo cotizar, qué activos de especificación entregar y qué cláusulas acordar sobre dominio, acciones irreversibles y evidencia." : "";

  const dimRows = dims.map((x) => `<tr><td style="${FONT}font-size:14px;padding:6px 0;color:${C.ink}">${esc(x.d)}</td><td style="padding:6px 0 6px 12px;width:55%"><div style="background:${C.line};height:8px"><div style="background:${C.indigo};height:8px;width:${x.pct}%"></div></div></td><td style="${FONT}font-size:13px;padding:6px 0 6px 10px;color:${C.muted};text-align:right;width:44px">${x.pct}%</td></tr>`).join("");

  const gapBlocks = byLevel.map((b) => `
    <h3 style="${FONT}font-size:16px;margin:26px 0 4px;color:${C.ink}">Nivel ${b.n} · ${esc(b.lvl.nombre)}${b.n === 2 ? ` <span style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${C.rust}">Mínimo institucional</span>` : ""}${b.n === 4 ? ` <span style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${C.muted}">Opcional por zona</span>` : ""}</h3>
    <p style="${FONT}font-size:14px;line-height:1.5;color:${C.muted};margin:0 0 10px">${esc(b.lvl.significa)}</p>
    ${b.items.map((g) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid ${C.line}"><tr>
      <td style="${FONT}font-size:12px;font-weight:700;color:${g.part ? C.rust : C.indigo};padding:10px 12px 10px 0;width:44px;vertical-align:top">${g.q.id}</td>
      <td style="${FONT}font-size:14px;line-height:1.5;color:${C.ink};padding:10px 0">${g.part ? "<b>En camino.</b> " : ""}${esc(g.q.accion)}<br><span style="color:${C.muted};font-size:13px">Evidencia esperada: ${esc(g.q.evidencia)}</span></td></tr></table>`).join("")}`).join("");

  const answers = D.preguntas.map((q) => `<tr><td style="${FONT}font-size:12px;color:${C.muted};padding:6px 10px 6px 0;vertical-align:top;border-top:1px solid ${C.line}">${q.id}</td><td style="${FONT}font-size:13px;line-height:1.45;color:${C.ink};padding:6px 0;border-top:1px solid ${C.line}">${esc(q.texto)}</td><td style="${FONT}font-size:13px;color:${ans[q.id] === "si" ? C.indigo : C.ink};padding:6px 0 6px 10px;white-space:nowrap;vertical-align:top;border-top:1px solid ${C.line}">${label(ans[q.id])}</td></tr>`).join("");

  return shell(`
    <p style="${FONT}font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${C.rust};margin:0 0 10px">Informe de autoevaluación · TELAR</p>
    <h1 style="${FONT}font-size:24px;line-height:1.25;color:${C.ink};margin:0 0 16px">${esc(d.nombre)}, este es el resultado de ${zone}</h1>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.indigo};"><tr><td style="padding:22px 24px">
      <p style="${FONT}font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${C.cream};margin:0">Nivel de madurez</p>
      <p style="${FONT}font-size:40px;font-weight:800;color:#fff;margin:4px 0 0">${lv} · ${esc(info.nombre)}</p>
      <p style="${FONT}font-size:15px;line-height:1.5;color:${C.cream};margin:8px 0 0">${esc(info.resumen)}</p>
      <p style="${FONT}font-size:13px;color:${C.cream};margin:10px 0 0"><b>Supervisión típica:</b> ${esc(info.supervision)}</p>
    </td></tr></table>
    <p style="${FONT}font-size:14px;line-height:1.55;color:${C.ink};margin:18px 0 0">${lv >= 2 ? `La zona cumple el mínimo institucional (nivel 2).` : `La zona está por debajo del mínimo institucional (nivel 2): ahí las especificaciones sobreviven a la tarea, los gates exigen trazabilidad y las personas deciden y verifican.`} Una zona está en el nivel N cuando cumple todos los criterios de ese nivel y de los anteriores; «parcial» no acredita el nivel.</p>

    <h2 style="${FONT}font-size:18px;color:${C.ink};margin:30px 0 8px">Por dimensión</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${dimRows}</table>

    <h2 style="${FONT}font-size:18px;color:${C.ink};margin:30px 0 4px">${next ? `Qué falta, empezando por el nivel ${lv + 1}` : "Siguiente paso"}</h2>
    ${next ? `<p style="${FONT}font-size:14px;line-height:1.5;color:${C.muted};margin:0">Cada criterio pendiente con la acción que lo resuelve y la evidencia que lo demuestra. Empiece por el nivel ${lv + 1}: no se salta de nivel.</p>${gapBlocks}` : `<p style="${FONT}font-size:14px;line-height:1.55;color:${C.ink}">El nivel 4 es opcional por zona. Lo que sigue es sostenerlo y llevar otras zonas del portafolio al mínimo institucional.</p>`}

    ${fab ? `<p style="${FONT}font-size:14px;line-height:1.55;color:${C.ink};background:${C.cream};padding:14px 16px;margin:28px 0 0">${fab}</p>` : ""}

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:30px;background:${C.ink}"><tr><td style="padding:22px 24px">
      <p style="${FONT}font-size:18px;font-weight:700;color:#fff;margin:0">Revisemos su resultado</p>
      <p style="${FONT}font-size:14px;line-height:1.55;color:${C.cream};margin:8px 0 16px">En una conversación de 30 minutos revisamos su nivel, los criterios pendientes y por dónde empezar con TELAR. Puede responder este correo o solicitarla en el sitio.</p>
      <a href="${site}/contacto/?tema=telar" style="${FONT}display:inline-block;background:${C.rust};color:${C.ink};font-weight:700;font-size:14px;text-decoration:none;padding:12px 18px">Solicitar una conversación</a>
    </td></tr></table>

    <h2 style="${FONT}font-size:16px;color:${C.ink};margin:32px 0 8px">Sus respuestas</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${answers}</table>
  `, `Recibe este informe porque lo solicitó en ${site.replace(/^https?:\/\//, "")}/autoevaluacion. Creativa IT S.A.S. (CreativaLabs) trata sus datos conforme a su <a href="${site}/politica-de-datos/" style="color:${C.muted}">Política de tratamiento de datos personales</a>. Para actualizar o suprimir sus datos, o dejar de recibir correos, responda este mensaje.`);
}

function notice(title, rows) {
  return shell(`<h1 style="${FONT}font-size:20px;color:${C.ink};margin:0 0 16px">${esc(title)}</h1>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows.map(([k, v]) => `<tr><td style="${FONT}font-size:13px;color:${C.muted};padding:7px 14px 7px 0;vertical-align:top;white-space:nowrap;border-top:1px solid ${C.line}">${esc(k)}</td><td style="${FONT}font-size:14px;line-height:1.5;color:${C.ink};padding:7px 0;border-top:1px solid ${C.line};white-space:pre-line">${esc(v || "—")}</td></tr>`).join("")}</table>`, "Aviso automático de creativalabs.io");
}

function shell(body, foot) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:${C.cream}"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.cream}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:${C.paper}">
<tr><td style="background:${C.ink};padding:18px 28px"><span style="${FONT}font-size:20px;font-weight:800;color:${C.cream}">CreativaLabs<span style="color:${C.rust}">.io</span></span></td></tr>
<tr><td style="padding:28px">${body}</td></tr>
<tr><td style="${FONT}font-size:12px;line-height:1.5;color:${C.muted};padding:18px 28px;border-top:1px solid ${C.line}">${foot}</td></tr>
</table></td></tr></table></body></html>`;
}

async function send(env, msg) {
  if (!env.RESEND_API_KEY) { console.log("[correo omitido: falta RESEND_API_KEY]", msg.to, msg.subject); return; }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, ...msg, to: [msg.to] }),
  });
  if (!r.ok) console.error("Resend", r.status, await r.text());
}

/* ---------------- almacenamiento y validación ---------------- */

async function save(env, request, d) {
  if (!env.DB) { console.log("[registro omitido: falta la base DB]", d.tipo, d.correo); return; }
  await env.DB.prepare(
    `INSERT INTO leads (creado, tipo, nombre, correo, organizacion, cargo, tema, descripcion, zona, nivel, respuestas,
      novedades, consentimiento_version, idioma, origen, pais, agente)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)`
  ).bind(
    new Date().toISOString(), d.tipo, d.nombre, d.correo, d.organizacion, d.cargo ?? null, d.tema ?? null, d.descripcion ?? null,
    d.zona ?? null, d.nivel ?? null, d.respuestas ?? null, d.novedades ? 1 : 0, CONSENT_VERSION, d.idioma, d.origen || null,
    (request.cf && request.cf.country) || null, (request.headers.get("user-agent") || "").slice(0, 300)
  ).run();
}

async function human(token, request, env) {
  if (!env.TURNSTILE_SECRET) return { ok: true, codes: ["sin-secreto"] };
  if (!token) return { ok: false, codes: ["missing-input-response"] };
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET);
  body.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) body.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body }).then((x) => x.json());
  if (!r.success) console.log("Turnstile rechazó el token", r["error-codes"]);
  return { ok: !!r.success, codes: r["error-codes"] || [] };
}

async function readBody(request) {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await request.json().catch(() => ({}))) || {};
  const fd = await request.formData();
  const o = {};
  for (const [k, v] of fd.entries()) o[k] = typeof v === "string" ? v : "";
  return o;
}

const txt = (v, max = MAX.corto) => String(v ?? "").trim().slice(0, max);
const on = (v) => v === true || v === "on" || v === "true" || v === "1";
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const missing = (d, keys) => keys.find((k) => !d[k]);
const safeJSON = (s) => { try { return JSON.parse(s); } catch { return {}; } };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
