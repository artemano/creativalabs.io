/*
 * CreativaLabs.io — renderer.
 * Todo el contenido y la metadata viven en data/*.json. Este archivo solo
 * sabe dibujar tipos de sección; no contiene textos del sitio.
 *   data/site.json           marca, contacto, indicadores, personas, rutas, metadata, footer
 *   data/<lang>/<page>.json  secciones de cada página
 * Los textos admiten HTML en línea (<em>, <b>, <br>): el contenido es propio.
 */
(function () {
  "use strict";

  var doc = document.documentElement;
  var LANG = doc.getAttribute("lang") || "es";
  var PAGE = doc.dataset.page || "home";
  var ROOT = doc.dataset.root || "./";
  var SITE = null;
  var uid = 0;

  /* ---------- utilidades ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function t(v) { // valor que puede ser {es,en} o texto
    if (v && typeof v === "object" && !Array.isArray(v)) return v[LANG] != null ? v[LANG] : "";
    return v == null ? "" : v;
  }
  function asset(p) { return ROOT + p; }
  function pagePath(page, lang) {
    var p = SITE.pages[page];
    return p ? ROOT + p[lang || LANG].path : ROOT;
  }
  // "@telar#metodo" → ruta interna; "@alt" → misma página en el otro idioma;
  // "mail:" o "mail:Asunto" → mailto con el correo de site.json
  function href(h) {
    if (!h) return "#";
    if (h.indexOf("mail:") === 0) {
      var subj = h.slice(5);
      return "mailto:" + SITE.contact.email + (subj ? "?subject=" + encodeURIComponent(subj) : "");
    }
    if (h === "@alt") {
      var other = SITE.languages.filter(function (l) { return l !== LANG; })[0];
      return pagePath(PAGE, other);
    }
    if (h.charAt(0) === "@") {
      var parts = h.slice(1).split("#");
      var target = parts[0] === PAGE ? "" : pagePath(parts[0]);
      return target + (parts[1] ? "#" + parts[1] : "") || "#";
    }
    return h;
  }
  function a(link, cls, extra) {
    if (!link) return "";
    return '<a class="' + (cls || "") + '" href="' + esc(href(link.href)) + '"' + (extra || "") + ">" + t(link.label) + "</a>";
  }
  function btn(link) {
    if (!link) return "";
    return a(link, "btn btn--" + (link.style || "primary"));
  }
  function btns(list, cls) {
    if (!list || !list.length) return "";
    return '<div class="' + (cls || "actions") + '">' + list.map(btn).join("") + "</div>";
  }
  function eyebrow(s) { return s ? '<p class="eyebrow">' + s + "</p>" : ""; }
  function idAttr(s) { return s.id ? ' id="' + esc(s.id) + '"' : ""; }
  function bullets(items, cls) {
    return '<ul class="' + (cls || "ticks") + '">' + items.map(function (i) {
      return '<li><span class="tick" aria-hidden="true">&gt;</span><span>' + i + "</span></li>";
    }).join("") + "</ul>";
  }
  // list: arreglo de indicadores (site.companyIndicators o people[id].indicators)
  function metrics(list, variant) {
    return '<div class="metrics metrics--' + (variant || "full") + '">' + list.map(function (m) {
      return '<div class="metric"><p class="metric__v">' + esc(m.value) + '</p><p class="metric__l">' + t(m.label) + "</p></div>";
    }).join("") + "</div>";
  }
  function person(id) { return SITE.people[id]; }

  /* ---------- elementos gráficos ---------- */
  function weave() {
    var n = "w" + (++uid);
    var gu = n + "u", gt = n + "t", p = n + "p";
    var h = ['<rect x="16" y="0.5" width="16" height="7"/>', '<rect x="-8" y="8.5" width="16" height="7"/>', '<rect x="24" y="8.5" width="16" height="7"/>', '<rect x="0" y="16.5" width="16" height="7"/>', '<rect x="8" y="24.5" width="16" height="7"/>'];
    var v = ['<rect x="0.5" y="-8" width="7" height="16"/>', '<rect x="0.5" y="24" width="7" height="16"/>', '<rect x="8.5" y="0" width="7" height="16"/>', '<rect x="16.5" y="8" width="7" height="16"/>', '<rect x="24.5" y="16" width="7" height="16"/>'];
    function stops(c) { return '<stop offset="0" stop-color="' + c[0] + '"/><stop offset=".28" stop-color="' + c[1] + '"/><stop offset=".5" stop-color="' + c[2] + '"/><stop offset=".72" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[0] + '"/>'; }
    return '<svg class="weave" aria-hidden="true" width="100%" height="24"><defs>' +
      '<linearGradient id="' + gu + '" x1="0" y1="0" x2="0" y2="1">' + stops(["#243676", "#3552A8", "#7B93E0"]) + "</linearGradient>" +
      '<linearGradient id="' + gt + '" x1="0" y1="0" x2="1" y2="0">' + stops(["#B65A33", "#E5784A", "#F4A882"]) + "</linearGradient>" +
      '<pattern id="' + p + '" width="32" height="32" patternUnits="userSpaceOnUse"><rect fill="#16181F" width="32" height="32"/>' +
      '<g fill="url(#' + gt + ')">' + h.join("") + '</g><g fill="url(#' + gu + ')">' + v.join("") + "</g></pattern></defs>" +
      '<rect width="100%" height="24" fill="url(#' + p + ')"/></svg>';
  }

  function loopsSvg(d) {
    var A = [[335, 145], [505, 215], [425, 310], [295, 250], [395, 190]];
    var mk = "m" + (++uid);
    var s = '<svg viewBox="0 0 600 470" width="100%" role="img" aria-label="' + esc(d.aria) + '">' +
      '<defs><marker id="' + mk + '" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#3552A8"/></marker></defs>' +
      '<ellipse cx="355" cy="240" rx="235" ry="165" fill="#F5F1E8" stroke="#3552A8" stroke-width="2"/>' +
      '<ellipse cx="355" cy="240" rx="225" ry="156" fill="none" stroke="#3552A8" stroke-width="0.8" opacity=".6"/>' +
      '<path d="M454.3,90.5 A235,165 0 0,1 521.2,123.3" fill="none" stroke="#3552A8" stroke-width="3" marker-end="url(#' + mk + ')"/>';
    [[150, 105, 145, 101, -8], [118, 80, 113, 76, 6], [86, 58, 81, 54, -4]].forEach(function (e) {
      s += '<ellipse cx="370" cy="245" rx="' + e[0] + '" ry="' + e[1] + '" fill="none" stroke="#5A6276" stroke-width="1.6" transform="rotate(' + e[4] + ' 370 245)"/>' +
        '<ellipse cx="370" cy="245" rx="' + e[2] + '" ry="' + e[3] + '" fill="none" stroke="#5A6276" stroke-width="0.6" opacity=".5" transform="rotate(' + e[4] + ' 370 245)"/>';
    });
    A.forEach(function (p) { s += '<line x1="68" y1="240" x2="' + p[0] + '" y2="' + p[1] + '" stroke="#AE4F27" stroke-width="1.3" opacity=".8"/>'; });
    A.forEach(function (p) {
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="15" fill="#FFFDF8" stroke="#3552A8" stroke-width="2"/><text x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle" class="svg-mono" font-size="13" fill="#3552A8">A</text>';
    });
    s += '<rect x="20" y="216" width="48" height="48" fill="#AE4F27"/><text x="44" y="248" text-anchor="middle" class="svg-mono" font-size="20" fill="#FFFDF8">H</text>' +
      '<text x="20" y="180" class="svg-sans" font-weight="700" font-size="15" fill="#AE4F27">' + esc(d.people[0]) + "</text>" +
      '<text x="20" y="198" class="svg-sans" font-size="13" fill="#5A6276">' + esc(d.people[1]) + "</text>" +
      '<text x="590" y="30" text-anchor="end" class="svg-sans" font-weight="700" font-size="15" fill="#3552A8">' + esc(d.why[0]) + "</text>" +
      '<text x="590" y="50" text-anchor="end" class="svg-sans" font-size="14" fill="#16181F">' + esc(d.why[1]) + "</text>" +
      '<text x="590" y="440" text-anchor="end" class="svg-sans" font-weight="700" font-size="15" fill="#5A6276">' + esc(d.how[0]) + "</text>" +
      '<text x="590" y="460" text-anchor="end" class="svg-sans" font-size="14" fill="#16181F">' + esc(d.how[1]) + "</text>" +
      '<circle cx="29" cy="436" r="9" fill="#FFFDF8" stroke="#3552A8" stroke-width="1.6"/><text x="29" y="440" text-anchor="middle" class="svg-mono" font-size="10" fill="#3552A8">A</text>' +
      '<text x="44" y="441" class="svg-sans" font-size="13" fill="#5A6276">' + esc(d.agents) + "</text></svg>";
    return s;
  }

  var TONE = { rust: "#AE4F27", indigo: "#3552A8", deep: "#243676", purple: "#6D1482" };

  function chainSvg(d) {
    var s = '<svg viewBox="0 0 1200 300" width="100%" role="img" aria-label="' + esc(d.aria) + '">' +
      '<line x1="0" y1="89" x2="1200" y2="89" stroke="#B65A33" stroke-width="9" opacity=".55"/>' +
      '<line x1="0" y1="86" x2="1200" y2="86" stroke="#E5784A" stroke-width="8"/>' +
      '<line x1="0" y1="84" x2="1200" y2="84" stroke="#F4A882" stroke-width="2"/>';
    var ticks = "";
    for (var x = 0; x < 1200; x += 10) ticks += "M" + x + ",90 L" + (x + 6) + ",82 ";
    s += '<path d="' + ticks + '" stroke="#B65A33" stroke-width="1.3" opacity=".6"/>';
    function X(i) { return 75 + 150 * i; }
    function oct(cx, r, rot) {
      var pts = [];
      for (var k = 0; k < 8; k++) {
        var ang = rot + k * Math.PI / 4;
        pts.push((cx + r * Math.cos(ang)).toFixed(1) + "," + (86 + r * Math.sin(ang)).toFixed(1));
      }
      return pts;
    }
    d.nodes.forEach(function (n, i) {
      var cx = X(i), o1 = oct(cx, 62, 0), o2 = oct(cx, 62, Math.PI / 8), star = "";
      for (var k = 0; k < 8; k++) star += "M" + o1[k] + " L" + o1[(k + 3) % 8] + " ";
      s += '<polygon points="' + o1.join(" ") + '" fill="none" stroke="#C9C1B0" stroke-width="1"/>' +
        '<polygon points="' + o2.join(" ") + '" fill="none" stroke="#C9C1B0" stroke-width="1"/>' +
        '<path d="' + star + '" fill="none" stroke="#C9C1B0" stroke-width="0.7" opacity=".7"/>' +
        '<circle cx="' + cx + '" cy="86" r="46" fill="#FFFDF8" stroke="' + TONE[n.tone] + '" stroke-width="3"/>' +
        '<circle cx="' + cx + '" cy="86" r="40" fill="none" stroke="#D8D1C2" stroke-width="1"/>';
      var small = n.code.length > 4;
      s += '<text x="' + cx + '" y="' + (small ? 91 : 92) + '" text-anchor="middle" class="svg-mono" font-size="' + (small ? 12 : 20) + '" fill="#16181F">' + esc(n.code) + "</text>" +
        '<text x="' + cx + '" y="168" text-anchor="middle" class="svg-sans" font-size="14" fill="#5A6276">' + esc(n.label) + "</text>" +
        '<text x="' + cx + '" y="14" text-anchor="middle" class="svg-mono" font-size="12" fill="#5A6276">' + esc(d.stageWord + " " + n.stage) + "</text>";
    });
    d.groups.forEach(function (g) {
      var L = X(g.from) - 50, R = X(g.to) + 50, C = (L + R) / 2, col = TONE[g.tone];
      s += '<path d="M' + L + ",196 q0,16 16,16 H" + (C - 16) + " q16,0 16,16 q0,-16 16,-16 H" + (R - 16) + ' q16,0 16,-16" fill="none" stroke="' + col + '" stroke-width="1.6"/>' +
        '<text x="' + C + '" y="256" text-anchor="middle" class="svg-sans" font-weight="700" font-size="20" fill="' + col + '">' + esc(g.label) + "</text>";
    });
    return s + "</svg>";
  }

  /* ---------- secciones ---------- */
  var R = {};

  R.header = function (s) {
    var ui = SITE.ui[LANG];
    var nav = (s.nav || SITE.nav[LANG]).map(function (l) {
      if (l.children) {
        return '<details class="nav__menu"><summary class="nav__link">' + t(l.label) + '</summary><div class="nav__sub">' +
          l.children.map(function (c) { return a(c, "nav__sublink"); }).join("") + "</div></details>";
      }
      return a(l, "nav__link");
    }).join("");
    if (SITE.languages.length > 1) nav += '<a class="nav__link nav__lang" href="' + esc(href("@alt")) + '" aria-label="' + esc(ui.switchAria) + '" lang="' + (LANG === "es" ? "en" : "es") + '">' + esc(ui.switchLabel) + "</a>";
    nav += '<a class="nav__link nav__cta" href="' + esc(href(SITE.cta[LANG].href)) + '">' + esc(SITE.cta[LANG].label) + "</a>";
    return '<header class="site-header"><div class="site-header__in">' +
      '<a class="logo" href="' + esc(pagePath("home")) + '">' + esc(SITE.brand.name) + "<span>" + esc(SITE.brand.tld) + "</span></a>" +
      '<nav class="nav" aria-label="' + esc(ui.navAria) + '">' + nav + "</nav></div></header>";
  };

  R.weave = function () { return weave(); };

  R.hero = function (s) {
    return '<section class="hero hero--' + (s.variant || "home") + '"' + idAttr(s) + ">" +
      '<img class="hero__img" src="' + asset(s.image) + '" alt="' + esc(s.alt || "") + '" style="object-position:' + (s.imagePosition || "50% 50%") + '">' +
      '<div class="hero__shade" aria-hidden="true"></div>' +
      '<div class="hero__in"><div class="hero__copy">' +
      '<p class="eyebrow">' + s.eyebrow + "</p><h1>" + s.title + '</h1><p class="lead">' + s.lead + "</p>" +
      btns(s.actions) + "</div></div>" +
      (s.caption ? '<p class="hero__caption">' + s.caption + "</p>" : "") + "</section>";
  };

  R.principle = function (s) {
    var sp = s.spec;
    var fields = sp.fields.map(function (f) {
      return '<span class="spec__k">' + f.k + "</span><span" + (f.accent ? ' class="spec__accent"' : "") + ">" +
        (f.ref ? '<span class="spec__ref">' + f.ref + "</span> " : "") + f.v + "</span>";
    }).join("");
    var gh = sp.criteria.map(function (g) { return '<p><span class="spec__kw">' + g.kw + "</span> " + g.text + "</p>"; }).join("");
    var trace = sp.trace.map(function (r) { return '<span class="spec__ref">' + r.ref + "</span>" + (r.text ? " " + r.text : ""); }).join(" · ");
    return '<section class="sec sec--cream sec--bb"' + idAttr(s) + '><div class="wrap wrap--wide">' +
      '<blockquote class="quote"><p lang="' + LANG + '">' + s.quote.text + '</p><p class="quote__by">— ' + s.quote.by + "</p></blockquote>" +
      '<div class="split split--end"><div class="split__a">' + eyebrow(s.eyebrow) + '<h2 class="h2 h2--xl">' + s.title + '</h2></div><p class="split__b serif-19">' + s.text + "</p></div>" +
      '<div class="pair">' +
      '<figure class="pair__fig"><div class="pair__box pair__box--img"><img src="' + asset(s.card.image) + '" alt="' + esc(s.card.alt) + '" style="object-position:' + (s.card.imagePosition || "50% 50%") + '"><p class="tag tag--light">' + s.card.tag + '</p></div><figcaption class="figcap">' + s.card.caption + "</figcaption></figure>" +
      '<figure class="pair__fig"><div class="pair__box spec"><p class="tag tag--orange">' + sp.tag + '</p><p class="spec__title">' + sp.id + " <span>· " + sp.title + '</span></p><div class="spec__grid">' + fields + '</div><div class="spec__crit"><p class="spec__k">' + sp.criteriaLabel + "</p>" + gh + '</div><p class="spec__trace">→ ' + trace + '</p></div><figcaption class="figcap">' + sp.caption + "</figcaption></figure>" +
      "</div></div></section>";
  };

  R.context = function (s) {
    var rows = s.bars.rows.map(function (r) {
      return '<div class="bars__row"><p class="bars__label">' + r.label + '</p><div class="bars__track">' + r.segments.map(function (g) {
        return '<div class="bars__seg bars__seg--' + g.tone + '" style="flex:' + g.weight + ' 1 0"><p class="bars__t">' + g.title + '</p><p class="bars__s">' + g.sub + "</p></div>";
      }).join("") + "</div></div>";
    }).join("");
    return '<section class="sec sec--paper sec--bt sec--bb"' + idAttr(s) + '><div class="wrap wrap--flush-b ctx">' +
      '<div class="ctx__a">' + eyebrow(s.eyebrow) + '<h2 class="h2">' + s.title + '</h2></div><div class="ctx__b">' + s.paragraphs.map(function (p) { return "<p>" + p + "</p>"; }).join("") + "</div></div>" +
      '<div class="wrap wrap--flush-t"><figure class="bars"><div role="img" aria-label="' + esc(s.bars.aria) + '" class="bars__body">' + rows + '<p class="bars__note">' + s.bars.note + '</p></div><figcaption class="figcap figcap--15">' + s.bars.caption + "</figcaption></figure></div></section>";
  };

  R.audiences = function (s) {
    var cards = s.cards.map(function (c) {
      return '<div class="aud aud--' + c.tone + '"><img class="aud__img" src="' + asset(c.image) + '" alt="' + esc(c.alt) + '" style="object-position:' + (c.imagePosition || "50% 50%") + '"><div class="aud__shade" aria-hidden="true"></div>' +
        '<div class="aud__blk"><p class="aud__kicker">' + c.kicker + '</p><h3 class="h3">' + c.title + "</h3></div>" +
        '<div class="aud__blk"><p class="aud__lbl">' + c.recognizeLabel + '</p><ul class="dots">' + c.bullets.map(function (b) { return '<li><span aria-hidden="true"></span><span>' + b + "</span></li>"; }).join("") + "</ul></div>" +
        '<div class="aud__blk"><p class="aud__lbl">' + c.getLabel + '</p><p class="aud__get">' + c.get + "</p></div>" +
        '<div class="aud__blk aud__cta">' + btn(c.action) + "</div></div>";
    }).join("");
    return '<section class="sec sec--cream"' + idAttr(s) + '><div class="wrap">' + eyebrow(s.eyebrow) + '<h2 class="h2 h2--mb40">' + s.title + '</h2><div class="aud-row">' + cards + "</div></div></section>";
  };

  R.method = function (s) {
    var lc = s.lifecycle;
    var stages = lc.stages.map(function (st) {
      return '<li class="stage stage--' + st.tone + '"><p class="stage__n">' + st.n + '</p><p class="stage__t">' + st.title + '</p><p class="stage__d">' + st.text + '</p><div class="stage__tags">' + st.tags.map(function (g) { return '<span class="chip">' + g + "</span>"; }).join("") + "</div></li>";
    }).join("");
    var arcs = lc.returns.map(function (r, i) {
      var off = i * 18, h = 34 + i * 58, top = h + (i ? 8 : 10), pad = i ? off : 34;
      var left = "calc(100% * " + (r.to - 0.5) + " / " + lc.stages.length + " + " + off + "px)";
      var width = "calc(100% * " + (r.from - r.to) + " / " + lc.stages.length + " - " + off + "px)";
      var tleft = "calc(100% * " + (r.to - 0.5) + " / " + lc.stages.length + " + " + pad + "px)";
      var twidth = "calc(100% * " + (r.from - r.to) + " / " + lc.stages.length + " - " + pad + "px)";
      return '<div class="arc arc--' + r.tone + '" style="left:' + left + ";width:" + width + ";height:" + h + 'px"><span aria-hidden="true"></span></div>' +
        '<p class="arc__t arc__t--' + r.tone + '" style="top:' + top + "px;left:" + tleft + ";width:" + twidth + '">' + r.text + "</p>";
    }).join("");
    var arcsTxt = lc.returns.map(function (r) { return '<p><b class="c-' + r.tone + '">' + r.label + "</b> " + r.text + "</p>"; }).join("");
    return '<section class="sec sec--paper sec--bt sec--bb"' + idAttr(s) + '><div class="wrap">' +
      '<div class="meth-top"><div class="meth-top__a">' + eyebrow(s.eyebrow) + '<h2 class="h2 h2--mb24">' + s.title + "</h2>" + s.paragraphs.map(function (p) { return '<p class="serif-19 mb16">' + p + "</p>"; }).join("") + "</div>" +
      '<figure class="meth-top__b">' + loopsSvg(s.loops) + '<figcaption class="figcap figcap--14">' + s.loops.caption + "</figcaption></figure></div>" +
      '<figure class="chain">' + chainSvg(s.chain) + '<figcaption class="figcap figcap--15">' + s.chain.caption + "</figcaption></figure>" +
      '<div class="lc"><div class="lc__head"><h3 class="h3 h3--34">' + lc.title + '</h3><p class="serif-18">' + lc.text + "</p></div>" +
      '<p class="lc__zero"><b>' + lc.zero.title + "</b> <span>" + lc.zero.text + "</span></p>" +
      '<ol class="stages" aria-label="' + esc(lc.aria) + '">' + stages + "</ol>" +
      '<div class="arcs">' + arcs + '</div><div class="arcs-txt">' + arcsTxt + "</div>" +
      '<div class="harness"><p class="harness__t">' + lc.harness.title + '</p><p class="harness__d">' + lc.harness.text + "</p></div>" +
      '<div class="legend">' + lc.legend.map(function (l) { return l.tone ? '<span class="legend__i"><span class="legend__sw legend__sw--' + l.tone + '" aria-hidden="true"></span>' + l.text + "</span>" : "<span>" + l.text + "</span>"; }).join("") + "</div></div>" +
      '<dl class="pillars">' + s.pillars.map(function (p) { return "<div><dt>" + p.term + "</dt><dd>" + p.text + "</dd></div>"; }).join("") + "</dl>" +
      "</div></section>";
  };

  R.adoption = function (s) {
    var cards = s.services.map(function (c) {
      return '<div class="svc svc--' + c.accent + '"><div class="svc__top"><p class="svc__n">' + c.label + "</p>" + (c.badge ? '<span class="badge">' + c.badge + "</span>" : "") + "</div>" +
        '<h3 class="h3 h3--32">' + c.title + "</h3>" + bullets(c.items, "ticks ticks--strong") +
        '<div class="svc__res"><p class="svc__rl">' + c.resultLabel + "</p><p>" + c.result + "</p></div><div>" + btn(c.action) + "</div></div>";
    }).join("");
    return '<section class="sec sec--cream"' + idAttr(s) + '><div class="wrap">' +
      '<div class="adopt-top"><figure class="adopt-top__img"><img src="' + asset(s.image) + '" alt="' + esc(s.alt) + '" style="object-position:' + (s.imagePosition || "50% 50%") + '"></figure>' +
      '<div class="adopt-top__copy">' + eyebrow(s.eyebrow) + '<h2 class="h2 h2--mb16">' + s.title + '</h2><p class="serif-19 muted">' + s.text + "</p></div></div>" +
      '<p class="serif-18 adopt-intro">' + s.intro + '</p><div class="svc-row">' + cards + "</div>" +
      (s.crosslink ? '<div class="xlink"><p class="serif-18">' + s.crosslink.text + "</p>" + a(s.crosslink.link, "link-strong") + "</div>" : "") +
      "</div></section>";
  };

  R.maturity = function (s) {
    var bars = s.levels.map(function (l, i) {
      return '<div class="mat__bar mat__bar--' + (l.style || "base") + '" style="height:' + l.height + '%"><p>' + i + "</p></div>";
    }).join("");
    var names = s.levels.map(function (l) { return "<p" + (l.style === "min" ? ' class="b"' : "") + ">" + l.name + "</p>"; }).join("");
    return '<section class="sec sec--indigo on-dark"' + idAttr(s) + '><div class="wrap mat">' +
      '<div class="mat__a">' + eyebrow(s.eyebrow) + '<h2 class="h2 h2--mb20">' + s.title + '</h2><p class="serif-19 mb32 c-indigo-lt">' + s.text + "</p>" + btn(s.action) + "</div>" +
      '<figure class="mat__b"><div class="mat__bars" role="img" aria-label="' + esc(s.aria) + '">' + bars + '</div><div class="mat__names">' + names + '</div><figcaption class="mat__cap">' + s.caption + "</figcaption></figure></div></section>";
  };

  R.personShort = function (s) {
    var p = person(s.person);
    return '<section class="sec sec--paper sec--bb"' + idAttr(s) + '><div class="wrap ps ps--' + (s.size || "md") + '">' +
      '<img class="ps__img" src="' + asset(p.photo) + '" alt="' + esc(t(p.photoAlt)) + '">' +
      '<div class="ps__copy">' + eyebrow(s.eyebrow) + '<h2 class="h2 h2--mb8">' + p.name + '</h2><p class="role">' + (s.role || t(p.role)) + '</p><p class="serif-18 ps__bio">' + s.bio + "</p>" +
      (s.indicators === "person" ? metrics(p.indicators, "compact") : "") + a(s.link, "link-strong") + "</div></div></section>";
  };

  function cover(size) {
    var b = SITE.book;
    return '<div class="cover cover--' + size + '" role="img" aria-label="' + esc(t(b.coverAlt)) + '">' +
      '<img src="' + asset(b.cover) + '" alt="">' +
      '<div class="cover__txt"><p class="cover__brand">' + esc(SITE.brand.name) + "<span>" + esc(SITE.brand.tld) + "</span></p>" +
      '<p class="cover__title">' + esc(t(b.title)) + '</p><div class="cover__rule"></div><p class="cover__sub">' + esc(t(b.subtitle)) + "</p></div>" +
      (size === "lg" ? '<p class="cover__author">' + esc(b.author) + "</p>" : "") + "</div>";
  }

  R.experience = function (s) {
    var list = s.indicators === "company" ? SITE.companyIndicators : person(s.indicators).indicators;
    return '<section class="sec sec--paper sec--bb"' + idAttr(s) + '><div class="wrap exp">' +
      '<div class="exp__a">' + eyebrow(s.eyebrow) + '<h2 class="h2 h2--mb16">' + s.title + '</h2><p class="serif-19">' + s.text + "</p>" +
      (s.person ? (function (p) { return '<div class="exp__who"><img src="' + asset(p.photo) + '" alt="' + esc(t(p.photoAlt)) + '" width="72" height="72"><p><b>' + p.name + "</b><br>" + t(p.role) + "</p></div>"; })(person(s.person)) : "") + "</div>" +
      '<div class="exp__b">' + metrics(list, "full") + a(s.link, "link-strong") + "</div></div></section>";
  };

  R.book = function (s) {
    var copy = '<div class="book__copy">' + eyebrow(s.eyebrow) + '<h2 class="h2 h2--mb20">' + t(SITE.book.title) + "</h2>" +
      s.paragraphs.map(function (p, i) { return '<p class="serif-19 ' + (i === s.paragraphs.length - 1 ? "mb28" : "mb16") + (p.muted ? " muted" : "") + '">' + (p.text || p) + "</p>"; }).join("") +
      btns(s.actions) + "</div>";
    var fig = '<figure class="book__fig book__fig--' + (s.coverSize || "lg") + '">' + cover(s.coverSize || "lg") + "</figure>";
    return '<section class="sec sec--cream' + (s.borderBottom ? " sec--bb" : "") + '"' + idAttr(s) + '><div class="wrap book">' +
      (s.coverFirst ? fig + copy : copy + fig) + "</div></section>";
  };

  R.faq = function (s) {
    return '<section class="sec sec--paper sec--bt"' + idAttr(s) + '><div class="wrap wrap--narrow"><h2 class="h2 h2--mb32">' + s.title + '</h2><div class="faq">' +
      s.items.map(function (q) { return "<details><summary>" + q.q + "</summary><p>" + q.a + "</p></details>"; }).join("") + "</div></div></section>";
  };

  R.closing = function (s) {
    var c = SITE.closing[LANG];
    var actions = s.actions || [{ label: SITE.cta[LANG].label, href: SITE.cta[LANG].href, style: "primary" }, { label: SITE.contact.email, href: "mail:", style: "light" }];
    return '<section class="sec sec--ink on-dark"' + idAttr(s) + '><div class="wrap closing"><div class="closing__a"><h2 class="h2 h2--50">' + (s.title || c.title) + '</h2><p class="serif-19 c-cream2 mt16">' + (s.text || c.text) + "</p></div>" +
      btns(actions, "closing__b") + "</div></section>";
  };

  R.footer = function () {
    var f = SITE.footer[LANG];
    var links = f.links.filter(function (l) { return l.href && l.href !== "#"; });
    return '<footer class="site-footer"><div class="site-footer__in"><nav class="site-footer__nav" aria-label="' + esc(f.navAria) + '">' +
      f.nav.map(function (l) { return a(l, ""); }).join("") + '</nav><div class="site-footer__legal"><p>' + f.text + '</p><p class="site-footer__links">' +
      links.map(function (l) { return a(l, "", /^https?:/.test(l.href) ? ' rel="noopener" target="_blank"' : ""); }).join("") + "</p></div></div></footer>";
  };

  R.fronts = function (s) {
    var cards = s.items.map(function (c) {
      return '<div class="front"><p class="front__k">' + c.kicker + '</p><h3 class="h3 h3--30">' + c.title + '</h3><p class="serif-17">' + c.text + "</p>" + bullets(c.items) + '<div class="front__cta">' + btn(c.action) + "</div></div>";
    }).join("");
    return '<section class="sec sec--cream"' + idAttr(s) + '><div class="wrap">' + head(s) + '<div class="fronts">' + cards + "</div></div></section>";
  };

  function head(s) {
    return '<div class="split split--end mb40"><div class="split__a">' + eyebrow(s.eyebrow) + '<h2 class="h2">' + s.title + "</h2></div>" +
      (s.text ? '<p class="split__b serif-18 muted">' + s.text + "</p>" : "") + "</div>";
  }

  R.modes = function (s) {
    var cards = s.items.map(function (m) {
      return '<div class="mode"><p><span class="chip">' + m.tag + '</span></p><h3 class="h3 h3--28">' + m.title + '</h3><p class="serif-17">' + m.text + "</p>" + a(m.action, "mode__cta") + "</div>";
    }).join("");
    return '<section class="sec sec--paper sec--bt"' + idAttr(s) + '><div class="wrap wrap--80">' + head(s) + '<div class="modes">' + cards + "</div></div></section>";
  };

  R.band = function (s) {
    return '<section class="sec sec--ink on-dark"' + idAttr(s) + '><div class="wrap wrap--80 band"><div class="band__a">' + eyebrow(s.eyebrow) + '<h2 class="h2 h2--44 h2--mb18">' + s.title + '</h2><p class="serif-19 c-cream2">' + s.text + "</p></div>" +
      btns(s.actions, "band__b") + "</div></section>";
  };

  R.team = function (s) {
    var p = person(s.person);
    var edu = s.education.map(function (e) { return "<li><p class=\"b\">" + e.title + "</p><p>" + e.place + "</p></li>"; }).join("");
    var tl = s.timeline.items.map(function (it) {
      var cls = "tl" + (it.accent ? " tl--accent" : "") + (it.featured ? " tl--featured" : "");
      return '<li class="' + cls + '"><p class="tl__y">' + it.year + (it.badge ? ' <span class="badge">' + it.badge + "</span>" : "") + '</p><p class="tl__o">' + it.org + '</p><p class="tl__r">' + it.role + '</p><p class="tl__d">' + it.text + "</p></li>";
    }).join("");
    return '<section class="sec sec--paper sec--bb"' + idAttr(s) + '><div class="wrap">' +
      '<div class="split split--end mb48"><div class="split__a split__a--520">' + eyebrow(s.eyebrow) + '<h2 class="h2">' + s.title + '</h2></div><p class="split__b split__b--360 serif-18 muted">' + s.text + "</p></div>" +
      '<div class="team"><figure class="team__card"><img src="' + asset(p.photo) + '" alt="' + esc(t(p.photoAlt)) + '"><figcaption><p class="team__name">' + p.name + '</p><p class="role role--15">' + t(p.role) + '</p><p class="team__bio">' + s.bio + '</p></figcaption><ul class="edu">' + edu + "</ul></figure>" +
      '<div class="team__main">' + metrics(p.indicators, "full") + '<h3 class="tl-h">' + s.timeline.title + '</h3><p class="tl-sub">' + s.timeline.subtitle + '</p><ol class="timeline">' + tl + "</ol>" +
      '<div class="sectors"><span class="sectors__l">' + s.sectors.label + "</span>" + s.sectors.items.map(function (x) { return '<span class="sector">' + x + "</span>"; }).join("") + "</div></div></div></div></section>";
  };

  /* ---------- tipos de sección del sitio fusionado (v2) ---------- */

  R.legal = function (s) {
    return '<section class="sec sec--paper"' + idAttr(s) + '><div class="wrap wrap--narrow legal">' + s.html + "</div></section>";
  };

  // Textura de tela índigo con red, foco de luz y destellos (hero del inicio)
  var TX_PATHS = ["765,85 925,85 925,165 1085,165 1085,45 1285,45",
    "685,605 845,605 845,525 1005,525 1005,645 1205,645 1205,565 1365,565",
    "1125,165 1125,285 1325,285", "565,725 725,725 725,685 925,685", "1365,405 1365,525"];
  function txPattern(id, c) {
    var s = '<pattern id="' + id + '" width="40" height="40" patternUnits="userSpaceOnUse">', r, k;
    for (k = 0; k < 4; k++) s += '<line x1="' + (k * 10 + 5) + '" y1="0" x2="' + (k * 10 + 5) + '" y2="40" stroke="' + c[0] + '" stroke-width="1" opacity="' + c[2] + '"/>';
    for (k = 0; k < 4; k++) s += '<line x1="0" y1="' + (k * 10 + 5) + '" x2="40" y2="' + (k * 10 + 5) + '" stroke="' + c[1] + '" stroke-width="1" opacity="' + c[3] + '"/>';
    for (r = 0; r < 4; r++) for (k = 0; k < 4; k++) {
      s += ((k - r + 4) % 4 < 2)
        ? '<rect x="' + (k * 10 + 4) + '" y="' + (r * 10) + '" width="2" height="10" fill="' + c[4] + '"/>'
        : '<rect x="' + (k * 10) + '" y="' + (r * 10 + 4) + '" width="10" height="2" fill="' + c[5] + '"/>';
    }
    return s + '</pattern><pattern id="' + id + 'n" width="80" height="80" patternUnits="userSpaceOnUse"><circle cx="45" cy="45" r="1.6" fill="' + c[6] + '"/></pattern>';
  }
  function txNet(col, op) {
    return TX_PATHS.map(function (pts) {
      return '<polyline points="' + pts + '" fill="none" stroke="' + col + '" stroke-width="1.6" opacity="' + op + '"/>' +
        pts.split(" ").map(function (p) { var q = p.split(","); return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3" fill="' + col + '" opacity="' + op + '"/>'; }).join("");
    }).join("");
  }
  function txSparks() {
    var out = "", seed = 4;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    TX_PATHS.forEach(function (pts) {
      var P = pts.split(" ").map(function (p) { return p.split(",").map(Number); });
      for (var i = 1; i < P.length; i++) {
        if (P[i][1] !== P[i - 1][1]) continue;
        var L = Math.abs(P[i][0] - P[i - 1][0]);
        out += '<line class="tx-spark" x1="' + P[i - 1][0] + '" y1="' + P[i][1] + '" x2="' + P[i][0] + '" y2="' + P[i][1] + '" stroke="#7B93E0" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="22 ' + (L + 40) + '" style="--len:' + (L + 62) + 'px;animation-duration:' + (2.4 + rnd() * 2.2).toFixed(2) + 's;animation-delay:' + (rnd() * 4).toFixed(2) + 's"/>';
      }
    });
    return out;
  }
  function texture() {
    var svg = '<svg class="tx__svg" aria-hidden="true" width="100%" height="100%">';
    return '<div class="tx" aria-hidden="true">' +
      '<div class="tx__layer">' + svg + "<defs>" + txPattern("txa", ["#1F2D63", "#1A2554", ".75", ".6", "#243676", "#141D44", "#2B3F86"]) + '</defs><rect width="100%" height="100%" fill="url(#txa)"/><rect width="100%" height="100%" fill="url(#txan)"/>' + txNet("#243676", ".8") + "</svg></div>" +
      '<div class="tx__layer tx__lit">' + svg + "<defs>" + txPattern("txb", ["#3552A8", "#2B3F86", ".9", ".8", "#4A66C4", "#2B3F86", "#4A66C4"]) +
      '<filter id="txg" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<rect width="100%" height="100%" fill="url(#txb)"/><rect width="100%" height="100%" fill="url(#txbn)"/><g filter="url(#txg)">' + txNet("#4A66C4", "1") + "</g></svg></div>" +
      '<div class="tx__sheen"></div>' +
      '<div class="tx__layer">' + svg + '<defs><filter id="txs" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#txs)">' + txSparks() + "</g></svg></div>" +
      '<div class="tx__shade"></div></div>';
  }
  function bindTexture() {
    var el = document.querySelector(".hero2");
    if (!el || !window.matchMedia("(hover: hover)").matches) return;
    var raf = 0, cx = 0, cy = 0;
    el.addEventListener("pointermove", function (e) {
      cx = e.clientX; cy = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((cx - r.left) / r.width * 100).toFixed(1) + "%");
        el.style.setProperty("--my", ((cy - r.top) / r.height * 100).toFixed(1) + "%");
      });
    });
  }

  R.heroWeave = function (s) {
    var pills = s.pillars.map(function (p, i) {
      return '<li class="pill"><span class="pill__n">0' + (i + 1) + '</span><span><span class="pill__t">' + p.title + '</span><span class="pill__d">' + p.text + "</span></span></li>";
    }).join("");
    return '<section class="hero2 on-dark"' + idAttr(s) + ">" + texture() +
      '<div class="hero2__in"><div class="hero2__copy">' + eyebrow(s.eyebrow) + "<h1>" + s.title + '</h1><p class="lead">' + s.lead + "</p>" + btns(s.actions) + "</div>" +
      pillsPanel(s.pillarsLabel, s.pillars) + "</div></section>" + weave();
  };

  function pillsPanel(label, items, numbered) {
    return '<div class="hero2__panel"><p class="hero2__lbl">' + label + '</p><ul class="pills">' + items.map(function (p, i) {
      return '<li class="pill"><span class="pill__n">' + (p.n || (numbered === false ? "" : "0" + (i + 1))) + '</span><span><span class="pill__t">' + p.title + "</span>" + (p.text ? '<span class="pill__d">' + p.text + "</span>" : "") + "</span></li>";
    }).join("") + "</ul></div>";
  }

  R.pagehead = function (s) {
    return '<section class="phead hero2 on-dark"' + idAttr(s) + ">" + texture() + '<div class="hero2__in phead__in"><div class="hero2__copy">' + eyebrow(s.eyebrow) + "<h1>" + s.title + "</h1>" +
      (s.lead ? '<p class="lead">' + s.lead + "</p>" : "") + btns(s.actions) + "</div>" +
      (s.aside ? pillsPanel(s.aside.label, s.aside.items, s.aside.numbered) : "") + "</div></section>";
  };

  // Bloque de texto: título, párrafos, viñetas, enlace o botones
  R.prose = function (s) {
    var bg = s.bg || "paper";
    var body = (s.paragraphs || []).map(function (p) { return '<p class="serif-19 mb16">' + p + "</p>"; }).join("") +
      (s.bullets ? bullets(s.bullets) : "") +
      (s.note ? '<p class="note">' + s.note + "</p>" : "") +
      (s.link ? '<p class="mt16">' + a(s.link, "link-strong") + "</p>" : "") + btns(s.actions);
    var layout = s.image
      ? '<div class="pimg' + (s.imageFirst ? " pimg--rev" : "") + '"><div class="pimg__txt">' + eyebrow(s.eyebrow) + '<h2 class="h2 h2--mb24">' + s.title + "</h2>" + body + '</div><figure class="pimg__fig"><img src="' + asset(s.image) + '" alt="' + esc(s.alt || "") + '" loading="lazy" style="object-position:' + (s.imagePosition || "50% 50%") + '">' + (s.caption ? '<figcaption class="figcap">' + s.caption + "</figcaption>" : "") + "</figure></div>"
      : s.split
      ? '<div class="split"><div class="split__a">' + eyebrow(s.eyebrow) + '<h2 class="h2">' + s.title + '</h2></div><div class="split__b">' + body + "</div></div>"
      : '<div class="prose">' + eyebrow(s.eyebrow) + (s.title ? '<h2 class="h2 h2--mb24">' + s.title + "</h2>" : "") + body + "</div>";
    return '<section class="sec sec--' + bg + (bg === "ink" || bg === "indigo" ? " on-dark" : "") + ' sec--bb"' + idAttr(s) + '><div class="wrap' + (s.wide ? "" : " wrap--narrow") + '">' + layout + "</div></section>";
  };

  // Tarjetas: pilares, entradas, catálogo, entregables, pasos, recursos
  // Iconos de línea (24x24, trazo) para tarjetas de servicio
  var ICONS = {
    diagnostico: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.3 15.3 21 21"/><path d="M7.5 10.5h6M10.5 7.5v6"/>',
    arquitectura: '<path d="M12 3 3 7.5l9 4.5 9-4.5L12 3z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/>',
    telar: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v4.5M9 10.5v3M9 16.5V21M15 3v1.5M15 7.5v9M15 19.5V21"/><path d="M3 9h4.5M10.5 9h3M16.5 9H21M3 15h1.5M7.5 15h9M19.5 15H21"/>',
    spiral: '<path d="M12.60 12.00 L12.65 12.04 L12.70 12.08 L12.74 12.13 L12.78 12.18 L12.82 12.23 L12.85 12.30 L12.88 12.36 L12.90 12.43 L12.92 12.51 L12.94 12.58 L12.94 12.66 L12.94 12.75 L12.94 12.83 L12.93 12.92 L12.91 13.01 L12.88 13.09 L12.85 13.18 L12.81 13.27 L12.76 13.36 L12.70 13.44 L12.64 13.53 L12.57 13.61 L12.50 13.68 L12.41 13.76 L12.32 13.83 L12.23 13.89 L12.12 13.95 L12.01 14.01 L11.90 14.06 L11.78 14.10 L11.65 14.13 L11.53 14.16 L11.39 14.18 L11.26 14.19 L11.12 14.19 L10.97 14.18 L10.83 14.16 L10.68 14.14 L10.54 14.10 L10.39 14.06 L10.25 14.00 L10.10 13.94 L9.96 13.86 L9.82 13.78 L9.68 13.68 L9.55 13.58 L9.42 13.46 L9.30 13.34 L9.18 13.21 L9.07 13.06 L8.97 12.91 L8.88 12.76 L8.79 12.59 L8.71 12.42 L8.64 12.23 L8.59 12.05 L8.54 11.85 L8.50 11.66 L8.48 11.45 L8.46 11.25 L8.46 11.04 L8.47 10.83 L8.50 10.61 L8.54 10.40 L8.59 10.18 L8.65 9.97 L8.73 9.76 L8.82 9.55 L8.92 9.34 L9.04 9.14 L9.17 8.94 L9.31 8.75 L9.47 8.56 L9.63 8.39 L9.82 8.22 L10.01 8.05 L10.21 7.90 L10.42 7.76 L10.65 7.63 L10.88 7.52 L11.12 7.41 L11.38 7.32 L11.63 7.24 L11.90 7.18 L12.17 7.13 L12.45 7.10 L12.73 7.08 L13.01 7.08 L13.30 7.09 L13.58 7.13 L13.87 7.18 L14.16 7.24 L14.44 7.33 L14.73 7.43 L15.01 7.54 L15.28 7.68 L15.55 7.83 L15.81 8.00 L16.06 8.18 L16.31 8.38 L16.55 8.60 L16.77 8.83 L16.98 9.08 L17.18 9.34 L17.37 9.61 L17.54 9.89 L17.70 10.19 L17.84 10.50 L17.96 10.82 L18.07 11.15 L18.16 11.48 L18.23 11.83 L18.28 12.18 L18.31 12.53 L18.32 12.89 L18.31 13.25 L18.28 13.61 L18.23 13.97 L18.15 14.34 L18.06 14.70 L17.94 15.05 L17.81 15.41 L17.65 15.75 L17.47 16.09 L17.27 16.42 L17.05 16.75 L16.82 17.06 L16.56 17.36 L16.28 17.64 L15.99 17.91 L15.68 18.17 L15.35 18.41 L15.01 18.63 L14.65 18.84 L14.28 19.02 L13.90 19.19 L13.51 19.33 L13.10 19.46 L12.69 19.56 L12.27 19.63 L11.84 19.69 L11.41 19.71 L10.97 19.72 L10.53 19.70 L10.09 19.65 L9.65 19.58 L9.22 19.49 L8.78 19.37 L8.35 19.22 L7.93 19.05 L7.52 18.85 L7.11 18.63 L6.72 18.39 L6.33 18.12 L5.96 17.83 L5.61 17.52 L5.27 17.18 L4.95 16.83 L4.65 16.45 L4.37 16.06 L4.11 15.65 L3.87 15.22 L3.66 14.78 L3.47 14.32 L3.30 13.85 L3.16 13.37 L3.05 12.88 L2.96 12.38 L2.91 11.87 L2.88 11.36 L2.88 10.85 L2.91 10.33 L2.96 9.81 L3.05 9.30 L3.17 8.79 L3.32 8.28 L3.49 7.78 L3.70 7.28 L3.93 6.80 L4.19 6.33"/>',
    cto: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2z"/><circle cx="12" cy="12" r=".8"/>'
  };
  function icon(name) {
    return ICONS[name] ? '<span class="card__i" aria-hidden="true"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + "</svg></span>" : "";
  }

  R.cards = function (s) {
    var v = s.variant || "front";
    var items = s.items.map(function (c, i) {
      var top = icon(c.icon) + (s.numbered ? '<p class="card__n">' + (i + 1 < 10 ? "0" : "") + (i + 1) + "</p>" : "") +
        (c.kicker ? '<p class="card__k">' + c.kicker + "</p>" : "") + (c.badge ? '<span class="badge card__badge">' + c.badge + "</span>" : "");
      return '<div class="card card--' + v + (c.featured ? " card--featured" : "") + '">' + top +
        (c.title ? '<h3 class="card__t">' + c.title + "</h3>" : "") +
        (c.text ? '<p class="card__d">' + c.text + "</p>" : "") +
        (c.bullets ? bullets(c.bullets) : "") +
        (c.effect ? '<p class="card__e">' + c.effect + "</p>" : "") +
        (c.status ? '<p class="card__s">' + c.status + "</p>" : "") +
        (c.link ? '<p class="card__cta">' + a(c.link, "card__link") + "</p>" : "") + "</div>";
    }).join("");
    var bg = s.bg || "cream";
    return '<section class="sec sec--' + bg + (bg === "ink" || bg === "indigo" ? " on-dark" : "") + ' sec--bb"' + idAttr(s) + '><div class="wrap">' +
      (s.title ? head(s) : "") + '<div class="cards cards--' + (s.columns || "auto") + '">' + items + "</div>" +
      (s.after ? '<div class="xlink">' + (s.after.text ? '<p class="serif-18">' + s.after.text + "</p>" : "") + (s.after.link ? a(s.after.link, "link-strong") : "") + btns(s.after.actions) + "</div>" : "") +
      "</div></section>";
  };

  // Por qué ahora: antes/hoy y el diagrama de cruces
  function graph(n, r) {
    var pts = [], i, j, s = "";
    for (i = 0; i < n; i++) pts.push([100 + r * Math.cos(2 * Math.PI * i / n - Math.PI / 2), 100 + r * Math.sin(2 * Math.PI * i / n - Math.PI / 2)]);
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) s += '<line x1="' + pts[i][0].toFixed(1) + '" y1="' + pts[i][1].toFixed(1) + '" x2="' + pts[j][0].toFixed(1) + '" y2="' + pts[j][1].toFixed(1) + '" stroke="#AE4F27" stroke-width="1.4" opacity=".75"/>';
    pts.forEach(function (p) { s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="9" fill="#3552A8"/>'; });
    return s;
  }
  R.collision = function (s) {
    var g = s.graphs.map(function (x) {
      return '<figure class="coll__g"><svg viewBox="0 0 200 200" width="100%" role="img" aria-label="' + esc(x.aria) + '">' + graph(x.changes, 80) + '</svg><figcaption><b>' + x.changes + " " + s.changesWord + "</b> · " + x.crossings + " " + s.crossingsWord + "</figcaption></figure>";
    }).join("");
    return '<section class="sec sec--paper sec--bb"' + idAttr(s) + '><div class="wrap">' + head(s) +
      '<div class="coll"><div class="coll__cols">' + s.columns.map(function (c) { return '<div class="coll__c"><p class="coll__k">' + c.label + '</p><p class="serif-18">' + c.text + "</p></div>"; }).join("") + "</div>" +
      '<div class="coll__fig"><div class="coll__gs">' + g + '</div><p class="coll__t">' + s.figTitle + '</p><p class="serif-17 muted">' + s.figText + "</p></div></div>" +
      (s.closingLine ? '<p class="coll__close">' + s.closingLine + "</p>" : "") + "</div></section>";
  };

  // Formulario de contacto (se publica cuando site.form.enabled es true)
  R.contactForm = function (s) {
    var f = SITE.form || {};
    var mail = '<p class="serif-18">' + s.altText + ' <a href="' + esc(href("mail:")) + '">' + esc(SITE.contact.email) + "</a></p>";
    if (!f.enabled) {
      return '<section class="sec sec--paper sec--bb"' + idAttr(s) + '><div class="wrap wrap--narrow"><div class="form-off">' +
        '<h2 class="h2 h2--mb16">' + s.offTitle + '</h2><p class="serif-19 mb28">' + s.offText + "</p>" +
        btns([{ label: SITE.contact.email, href: "mail:Solicitud de conversación", style: "primary" }]) + "</div></div></section>";
    }
    var topic = (new URLSearchParams(location.search)).get("tema") || "";
    var opts = s.topics.map(function (o) { return '<option value="' + esc(o.value) + '"' + (o.value === topic ? " selected" : "") + ">" + esc(o.label) + "</option>"; }).join("");
    return '<section class="sec sec--paper sec--bb"' + idAttr(s) + '><div class="wrap wrap--narrow">' +
      '<form class="form" action="' + esc(f.endpoint) + '" method="post" novalidate>' +
      '<div class="form__row"><label for="f-nombre">' + s.labels.name + '</label><input id="f-nombre" name="nombre" autocomplete="name" required></div>' +
      '<div class="form__row"><label for="f-correo">' + s.labels.email + '</label><input id="f-correo" name="correo" type="email" autocomplete="email" required></div>' +
      '<div class="form__row"><label for="f-org">' + s.labels.org + '</label><input id="f-org" name="organizacion" autocomplete="organization" required></div>' +
      '<div class="form__row"><label for="f-tema">' + s.labels.topic + '</label><select id="f-tema" name="tema">' + opts + "</select></div>" +
      '<div class="form__row"><label for="f-desc">' + s.labels.desc + '</label><textarea id="f-desc" name="descripcion" rows="5" required></textarea></div>' +
      '<input type="hidden" name="origen" value="' + esc(document.referrer) + '"><input type="hidden" name="idioma" value="' + LANG + '">' +
      '<div class="form__row form__check"><input id="f-ok" name="consentimiento" type="checkbox" required><label for="f-ok">' + s.labels.consent + "</label></div>" +
      (s.labels.news ? '<div class="form__row form__check"><input id="f-news" name="novedades" type="checkbox"><label for="f-news">' + s.labels.news + "</label></div>" : "") +
      (f.turnstileSiteKey ? '<div class="cf-turnstile" data-sitekey="' + esc(f.turnstileSiteKey) + '"></div>' : "") +
      '<p class="form__msg" role="status" aria-live="polite"></p>' +
      '<button class="btn btn--primary" type="submit">' + s.labels.submit + "</button>" + (s.privacy ? '<p class="form__privacy">' + s.privacy + "</p>" : "") + "</form>" + mail + "</div></section>";
  };

  /* ---------- autoevaluación de madurez (portada del prototipo del libro) ---------- */
  var AE = null;
  R.assessment = function (s) {
    AE = s;
    var L = s.labels;
    return '<section class="sec sec--paper sec--bb"' + idAttr(s) + '><div class="wrap ae">' +
      '<div class="ae__top"><label class="ae__zone" for="ae-zona">' + L.zone + ' <input id="ae-zona" type="text" placeholder="' + esc(L.zonePh) + '"></label><span id="ae-fecha"></span></div>' +
      '<nav class="ae__tabs" aria-label="' + esc(L.tabsAria) + '"><a href="#evaluar" data-view="evaluar">' + L.tabEval + '</a><a href="#niveles" data-view="niveles">' + L.tabLevels + '</a><a href="#glosario" data-view="glosario">' + L.tabGlos + "</a></nav>" +
      '<div class="ae__line" aria-hidden="true"><div class="ae__marker" id="ae-marker">' + L.marker + '</div><div class="ae__track" id="ae-track"></div></div>' +
      '<div class="ae__view" id="ae-view-evaluar"><div class="ae__layout"><div>' +
      '<div class="ae__reset"><span id="ae-banner">' + L.bannerExample + '</span><button type="button" class="ae__btn ae__btn--ghost" id="ae-reset">' + L.reset + "</button></div>" +
      '<div class="ae__ctx" id="ae-ctx"><h2 class="ae__h2">' + L.ctx + '</h2></div><div id="ae-levels"></div></div>' +
      '<aside class="ae__aside"><div class="ae__tag" aria-live="polite"><div class="ae__lbl"><span>' + L.tag + '</span><span id="ae-tagzone"></span></div><div class="ae__stamp" id="ae-stamp"></div>' +
      '<div class="ae__big"><b id="ae-lvlnum">0</b><div><small>' + L.level + '</small><span id="ae-lvlname"></span></div></div><p class="ae__sum" id="ae-lvlsum"></p>' +
      '<a class="ae__taglink" href="#niveles">' + L.tabLevels + '</a><div class="ae__dims" id="ae-dims"></div></div>' +
      '<div class="ae__todo"><h3 id="ae-gapsh"></h3><ul class="ae__gaps" id="ae-gaps"></ul></div>' +
      '<p class="ae__fab" id="ae-fab" hidden>' + L.fab + "</p>" +
      '<p class="ae__rule">' + L.rule + "</p>" +
      '<div class="ae__cta"><h3>' + L.ctaTitle + "</h3><p>" + L.ctaText + "</p>" + btn(s.action) + "</div>" +
      "</aside></div></div>" +
      '<div class="ae__view" id="ae-view-niveles" hidden><div class="ae__vh"><h2 class="ae__h2">' + L.tabLevels + "</h2><p>" + L.levelsIntro + '</p></div><div class="ae__lvgrid" id="ae-lvgrid"></div><div class="ae__reglas" id="ae-reglas"></div><a class="btn btn--primary ae__back" href="#evaluar">' + L.tabEval + "</a></div>" +
      '<div class="ae__view" id="ae-view-glosario" hidden><div class="ae__vh"><h2 class="ae__h2">' + L.tabGlos + "</h2><p>" + L.glosIntro + '</p></div><dl class="ae__glos" id="ae-glos"></dl><a class="btn btn--primary ae__back" href="#evaluar">' + L.tabEval + "</a></div>" +
      '<p class="ae__foot">' + L.foot + "</p></div></section>";
  };

  function bindAssessment() {
    if (!AE) return;
    var D = AE.data, L = AE.labels, $ = function (id) { return document.getElementById("ae-" + id); };
    var EXAMPLE = { P01: "si", P02: "si", P03: "parcial", P04: "no", P05: "no", P06: "parcial", P07: "no", P08: "parcial", P09: "no", P10: "no", P11: "no", P12: "no", P13: "no", P14: "no", C1: "1", C2: "1", C3: "0" };
    var LBL = { si: "Sí", parcial: "Parcial", no: "No", nose: "No sé" };
    var ans = Object.assign({}, EXAMPLE);
    var val = function (id) { var r = D.respuestas.filter(function (x) { return x.id === ans[id]; })[0]; return r ? r.valor : 0; };
    var qsOf = function (n) { return D.preguntas.filter(function (q) { return q.nivel === n; }); };

    $("fecha").textContent = L.date + " " + new Date().toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "2-digit" });
    $("track").innerHTML = D.niveles.map(function (n) { return '<div class="ae__st" data-n="' + n.n + '"><b>' + n.n + "</b><span>" + n.nombre + "</span><small>" + n.resumen.split(".")[0] + ".</small></div>"; }).join("");
    D.contexto.forEach(function (c) {
      var o = c.opciones.map(function (x, i) { return '<option value="' + i + '">' + x + "</option>"; }).join("");
      $("ctx").insertAdjacentHTML("beforeend", '<label class="ae__f" for="ae-' + c.id + '">' + c.texto + '<select id="ae-' + c.id + '" data-k="' + c.id + '"><option value="">' + L.choose + "</option>" + o + "</select></label>");
    });
    D.niveles.filter(function (n) { return n.n > 0; }).forEach(function (n) {
      var items = qsOf(n.n).map(function (q) {
        var o = D.respuestas.map(function (r) { return '<input type="radio" name="ae-' + q.id + '" id="ae-' + q.id + "-" + r.id + '" value="' + r.id + '" data-k="' + q.id + '"><label for="ae-' + q.id + "-" + r.id + '" title="' + esc(r.texto) + '">' + LBL[r.id] + "</label>"; }).join("");
        return '<div class="ae__q" id="ae-row-' + q.id + '" role="radiogroup" aria-labelledby="ae-' + q.id + '-t"><span class="ae__qid">' + q.id + '</span><div><p class="ae__qt" id="ae-' + q.id + '-t">' + q.texto + '</p><p class="ae__ev">' + L.evidence + " " + q.evidencia + '</p></div><div class="ae__opts">' + o + "</div></div>";
      }).join("");
      $("levels").insertAdjacentHTML("beforeend", '<div class="ae__sec"><div class="ae__sh"><h2 class="ae__h2"><span class="ae__n">' + n.n + "</span>" + n.nombre + '</h2><span class="ae__count" id="ae-count-' + n.n + '"></span></div><p class="ae__ss">' + n.resumen + "</p>" + items + "</div>");
    });
    $("lvgrid").innerHTML = D.niveles.map(function (n) {
      var flag = n.n === 2 ? '<span class="ae__flag">' + L.minFlag + "</span>" : n.n === 4 ? '<span class="ae__flag ae__flag--opt">' + L.optFlag + "</span>" : "";
      return '<article class="ae__lv' + (n.n === 2 ? " ae__lv--min" : "") + '"><span class="ae__step">' + n.n + "</span>" + flag + "<h3>" + n.nombre + '</h3><p class="ae__sig">' + n.significa + "</p><ul>" + n.reconoce.map(function (r) { return "<li>" + r + "</li>"; }).join("") + '</ul><p class="ae__sup"><b>' + L.supervision + "</b> " + n.supervision + "</p></article>";
    }).join("");
    $("reglas").innerHTML = D.reglas.map(function (r) { var i = r.indexOf(":"); return "<p><b>" + r.slice(0, i) + ".</b> " + r.slice(i + 1).trim() + "</p>"; }).join("");
    $("glos").innerHTML = D.glosario.map(function (g) { return "<div><dt>" + g.t + "</dt><dd>" + g.d + "</dd></div>"; }).join("");

    function level() { var lv = 0; for (var n = 1; n <= 4; n++) { if (qsOf(n).every(function (q) { return ans[q.id] === "si"; })) lv = n; else break; } return lv; }
    function marker() { var h = document.querySelector('.ae__st[data-n="' + level() + '"]'); if (h) $("marker").style.left = h.offsetLeft + "px"; }
    function fill() {
      D.preguntas.forEach(function (q) { D.respuestas.forEach(function (r) { $(q.id + "-" + r.id).checked = ans[q.id] === r.id; }); });
      D.contexto.forEach(function (c) { $(c.id).value = ans[c.id] == null ? "" : ans[c.id]; });
    }
    function render() {
      var lv = level(), info = D.niveles[lv];
      $("lvlnum").textContent = lv; $("lvlname").textContent = info.nombre; $("lvlsum").textContent = info.resumen;
      $("tagzone").textContent = ($("zona").value || L.noName).slice(0, 26);
      $("stamp").innerHTML = lv >= 2 ? L.stampOk.replace("{n}", lv) : L.stampLow;
      $("stamp").className = "ae__stamp" + (lv >= 2 ? " ae__stamp--ok" : "");
      [].forEach.call(document.querySelectorAll(".ae__st"), function (s) { var n = +s.dataset.n; s.classList.toggle("is-done", n < lv); s.classList.toggle("is-here", n === lv); });
      marker();
      D.preguntas.forEach(function (q) { $("row-" + q.id).dataset.a = ans[q.id] || ""; });
      D.niveles.filter(function (n) { return n.n > 0; }).forEach(function (n) { var qs = qsOf(n.n); $("count-" + n.n).textContent = qs.filter(function (q) { return ans[q.id] === "si"; }).length + " de " + qs.length + " en sí"; });
      var dims = D.preguntas.map(function (q) { return q.dimension; }).filter(function (d, i, a) { return a.indexOf(d) === i; });
      $("dims").innerHTML = dims.map(function (d) {
        var qs = D.preguntas.filter(function (q) { return q.dimension === d; });
        var pct = Math.round(100 * qs.reduce(function (a, q) { return a + val(q.id); }, 0) / qs.length);
        return '<div class="ae__dim"><span>' + d + '</span><div class="ae__gauge"><i style="width:' + pct + '%"></i></div><span class="ae__num">' + pct + "%</span></div>";
      }).join("");
      if (lv === 4) { $("gapsh").textContent = L.nextStep; $("gaps").innerHTML = '<li class="is-part"><span class="ae__k">—</span><span>' + L.lv4 + "</span></li>"; }
      else {
        var nx = lv + 1;
        $("gapsh").textContent = L.toReach.replace("{n}", nx).replace("{name}", D.niveles[nx].nombre);
        $("gaps").innerHTML = qsOf(nx).filter(function (q) { return ans[q.id] !== "si"; }).map(function (q) {
          var p = ans[q.id] === "parcial";
          return '<li class="' + (p ? "is-part" : "") + '"><span class="ae__k">' + q.id + "</span><span>" + (p ? L.onWay + " " : "") + q.accion + "</span></li>";
        }).join("");
      }
      $("fab").hidden = !(ans.C1 === "1" || ans.C1 === "2");
    }
    function route() {
      var h = location.hash.slice(1), v = h === "niveles" || h === "glosario" ? h : "evaluar";
      ["evaluar", "niveles", "glosario"].forEach(function (k) { $("view-" + k).hidden = k !== v; });
      [].forEach.call(document.querySelectorAll(".ae__tabs a"), function (a) { if (a.dataset.view === v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
      if (v === "evaluar") marker();
    }
    document.querySelector(".ae").addEventListener("change", function (e) {
      var k = e.target.dataset && e.target.dataset.k; if (!k) return;
      ans[k] = e.target.value; $("banner").textContent = L.bannerLive; render();
    });
    $("zona").addEventListener("input", render);
    $("reset").addEventListener("click", function () { ans = {}; fill(); $("banner").textContent = L.bannerBlank; render(); });
    window.addEventListener("hashchange", function () { route(); if (/^#(evaluar|niveles|glosario)$/.test(location.hash)) document.querySelector(".ae__tabs").scrollIntoView({ block: "start" }); });
    window.addEventListener("resize", marker);
    fill(); render(); route();
  }

  function bindForm() {
    var form = document.querySelector("form.form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.querySelector(".form__msg");
      var m = (SITE.form.messages || {})[LANG] || {};
      if (!form.checkValidity()) { msg.textContent = m.invalid || ""; form.reportValidity(); return; }
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      fetch(form.action, { method: "POST", body: new FormData(form) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); msg.textContent = m.ok || ""; })
        .catch(function () { msg.textContent = m.error || ""; })
        .then(function () { btn.disabled = false; });
    });
  }

  /* ---------- metadata ---------- */
  function setMeta(meta) {
    document.title = meta.title;
    function m(attr, key, val) {
      var el = document.head.querySelector("meta[" + attr + '="' + key + '"]');
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", val);
    }
    m("name", "description", meta.description);
    m("property", "og:title", meta.title);
    m("property", "og:description", meta.description);
  }

  /* ---------- arranque ---------- */
  function getJSON(p) {
    return fetch(ROOT + p, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(p + " → " + r.status);
      return r.json();
    });
  }

  Promise.all([getJSON("data/site.json"), getJSON("data/" + LANG + "/" + PAGE + ".json")])
    .then(function (res) {
      SITE = res[0];
      var page = res[1];
      setMeta(SITE.pages[PAGE][LANG]);
      var html = page.sections.map(function (s) {
        var fn = R[s.type];
        if (!fn) { console.warn("Tipo de sección desconocido:", s.type); return ""; }
        return fn(s);
      }).join("");
      var root = document.getElementById("app");
      root.innerHTML = html;
      root.removeAttribute("aria-busy");
      bindTexture();
      bindForm();
      bindAssessment();
      if (location.hash) {
        var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) target.scrollIntoView();
      }
    })
    .catch(function (err) {
      console.error(err);
      document.getElementById("app").innerHTML = '<p style="padding:48px 32px;font-family:system-ui">No se pudo cargar el contenido. / Content could not be loaded.</p>';
    });
})();
