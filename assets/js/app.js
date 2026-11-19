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
      '<div class="exp__a">' + eyebrow(s.eyebrow) + '<h2 class="h2 h2--mb16">' + s.title + '</h2><p class="serif-19">' + s.text + "</p></div>" +
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
      '<div class="hero2__panel"><p class="hero2__lbl">' + s.pillarsLabel + '</p><ul class="pills">' + pills + "</ul></div></div></section>" + weave();
  };

  R.pagehead = function (s) {
    return '<section class="phead on-dark"' + idAttr(s) + '><div class="phead__in">' + eyebrow(s.eyebrow) + "<h1>" + s.title + "</h1>" +
      (s.lead ? '<p class="lead">' + s.lead + "</p>" : "") + btns(s.actions) + "</div></section>";
  };

  // Bloque de texto: título, párrafos, viñetas, enlace o botones
  R.prose = function (s) {
    var bg = s.bg || "paper";
    var body = (s.paragraphs || []).map(function (p) { return '<p class="serif-19 mb16">' + p + "</p>"; }).join("") +
      (s.bullets ? bullets(s.bullets) : "") +
      (s.note ? '<p class="note">' + s.note + "</p>" : "") +
      (s.link ? '<p class="mt16">' + a(s.link, "link-strong") + "</p>" : "") + btns(s.actions);
    var layout = s.split
      ? '<div class="split"><div class="split__a">' + eyebrow(s.eyebrow) + '<h2 class="h2">' + s.title + '</h2></div><div class="split__b">' + body + "</div></div>"
      : '<div class="prose">' + eyebrow(s.eyebrow) + (s.title ? '<h2 class="h2 h2--mb24">' + s.title + "</h2>" : "") + body + "</div>";
    return '<section class="sec sec--' + bg + (bg === "ink" || bg === "indigo" ? " on-dark" : "") + ' sec--bb"' + idAttr(s) + '><div class="wrap' + (s.wide ? "" : " wrap--narrow") + '">' + layout + "</div></section>";
  };

  // Tarjetas: pilares, entradas, catálogo, entregables, pasos, recursos
  R.cards = function (s) {
    var v = s.variant || "front";
    var items = s.items.map(function (c, i) {
      var top = (s.numbered ? '<p class="card__n">' + (i + 1 < 10 ? "0" : "") + (i + 1) + "</p>" : "") +
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
      (f.turnstileSiteKey ? '<div class="cf-turnstile" data-sitekey="' + esc(f.turnstileSiteKey) + '"></div>' : "") +
      '<p class="form__msg" role="status" aria-live="polite"></p>' +
      '<button class="btn btn--primary" type="submit">' + s.labels.submit + "</button></form>" + mail + "</div></section>";
  };

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
