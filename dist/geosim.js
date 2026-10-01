var GeoSim = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.js
  var index_exports = {};
  __export(index_exports, {
    METHODS: () => METHODS,
    TEXTS: () => TEXTS,
    defaultParams: () => defaultParams,
    defineElements: () => defineElements,
    draw: () => draw,
    registerMethod: () => registerMethod,
    setTexts: () => setTexts,
    version: () => version
  });

  // src/core/draw.js
  var STOPS = ["#1f3f7a", "#2f6aa8", "#2fa3b0", "#5bd6b0", "#a6ec4a", "#f2c744", "#e8742c"].map((h) => {
    const n = parseInt(h.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  });
  function cmap(t, alpha) {
    t = Math.max(0, Math.min(1, t)) * (STOPS.length - 1);
    const i = Math.min(STOPS.length - 2, Math.floor(t));
    const f = t - i, a = STOPS[i], b = STOPS[i + 1];
    const r = a[0] + (b[0] - a[0]) * f | 0;
    const g = a[1] + (b[1] - a[1]) * f | 0;
    const bl = a[2] + (b[2] - a[2]) * f | 0;
    return alpha == null ? `rgb(${r},${g},${bl})` : `rgba(${r},${g},${bl},${alpha})`;
  }
  var probe = null;
  var cache = /* @__PURE__ */ new Map();
  function rgba(col, a) {
    const key = col + "|" + a;
    if (cache.has(key)) return cache.get(key);
    let out = col;
    if (typeof document !== "undefined") {
      if (!probe) probe = document.createElement("canvas").getContext("2d");
      if (probe) {
        probe.fillStyle = "#000";
        probe.fillStyle = col;
        const v = probe.fillStyle;
        if (v.charAt(0) === "#") {
          const n = parseInt(v.slice(1), 16);
          out = `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
        } else {
          const m = v.match(/[\d.]+/g);
          if (m) out = `rgba(${m[0]},${m[1]},${m[2]},${a * (m[3] != null ? +m[3] : 1)})`;
        }
      }
    } else if (/^#[0-9a-f]{6}$/i.test(col)) {
      const n = parseInt(col.slice(1), 16);
      out = `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
    }
    cache.set(key, out);
    return out;
  }
  var DEFAULT_COLORS = {
    bg: "#0e2236",
    fg: "#eaf2f7",
    muted: "#9cb2c5",
    accent: "#73f02c",
    accent2: "#5bd6b0",
    sky: "#5b8fd0",
    mono: "ui-monospace, monospace"
  };
  function readColors(el) {
    if (!el || typeof getComputedStyle !== "function") return { ...DEFAULT_COLORS };
    const cs = getComputedStyle(el);
    const g = (k) => cs.getPropertyValue("--_" + k).trim() || DEFAULT_COLORS[k];
    return { bg: g("bg"), fg: g("fg"), muted: g("muted"), accent: g("accent"), accent2: g("accent2"), sky: g("sky"), mono: g("mono") };
  }
  function txt(S, s, x, y, col, align, size) {
    if (!S.labels || S.mini) return;
    const c = S.ctx;
    c.fillStyle = col || S.C.muted;
    c.font = `${size || 11}px ${S.C.mono}`;
    c.textAlign = align || "left";
    c.textBaseline = "alphabetic";
    c.fillText(s, x, y);
  }
  function ground(S, y0, yEnd) {
    const { ctx: c, w, C } = S;
    c.fillStyle = rgba(C.sky, 0.08);
    c.fillRect(0, y0, w, yEnd - y0);
    c.strokeStyle = rgba(C.muted, 0.22);
    c.setLineDash([3, 5]);
    for (let k = 1; k < 5; k++) {
      const y = y0 + (yEnd - y0) * k / 5;
      c.beginPath();
      for (let x = 0; x <= w; x += 12) {
        const yy = y + Math.sin(x / 70 + k) * 3;
        if (x === 0) c.moveTo(x, yy);
        else c.lineTo(x, yy);
      }
      c.stroke();
    }
    c.setLineDash([]);
    c.strokeStyle = C.fg;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, y0);
    c.lineTo(w, y0);
    c.stroke();
    c.lineWidth = 1;
  }
  function dot(c, x, y, r) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  function plot(c, x0, x1, step, fy) {
    c.beginPath();
    for (let x = x0; x <= x1; x += step) {
      const y = fy(x);
      if (x === x0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  function ricker(tau, width, amp = 1) {
    const q = tau / width * (tau / width);
    return amp * (1 - 2 * q) * Math.exp(-q);
  }

  // src/core/texts.js
  var TEXTS = {
    locale: "pt-BR",
    methods: {
      mag: {
        name: "Magnetometria",
        unit: "nT",
        prop: "Susceptibilidade magn\xE9tica",
        app: "Explora\xE7\xE3o mineral, \xF3leo e g\xE1s, estruturas",
        meta: "Perfil \xB7 esfera magnetizada por indu\xE7\xE3o",
        desc: "O sensor registra pequenas varia\xE7\xF5es do campo magn\xE9tico da Terra causadas por rochas e minerais magn\xE9ticos. A forma da anomalia depende da inclina\xE7\xE3o do campo local, e a amplitude cai com o cubo da profundidade."
      },
      res: {
        name: "Eletrorresistividade",
        unit: "\u03A9\xB7m",
        prop: "Resistividade el\xE9trica",
        app: "\xC1gua subterr\xE2nea, barragens, obras, minera\xE7\xE3o",
        meta: "Pseudosse\xE7\xE3o \xB7 dipolo-dipolo",
        desc: "Injeta-se corrente no solo e mede-se a diferen\xE7a de potencial entre eletrodos. A pseudosse\xE7\xE3o mostra zonas condutivas, como argila e \xE1gua, e resistivas, como rocha s\xE3 e diques."
      },
      gpr: {
        name: "Georadar (GPR)",
        unit: "ns",
        prop: "Permissividade diel\xE9trica",
        app: "Interfer\xEAncias, pavimentos, ind\xFAstria, funda\xE7\xF5es",
        meta: "Radargrama \xB7 perfil de 10 m",
        desc: "Pulsos eletromagn\xE9ticos refletem em contrastes do subsolo. Tubula\xE7\xF5es aparecem como hip\xE9rboles, e a velocidade da onda, que depende da permissividade, define a abertura das hip\xE9rboles e a profundidade alcan\xE7ada."
      },
      seis: {
        name: "S\xEDsmica de refra\xE7\xE3o",
        unit: "m/s",
        prop: "Velocidade da onda P",
        app: "Topo rochoso, escavabilidade, obras",
        meta: "24 geofones \xB7 espa\xE7amento 5 m",
        desc: "Uma fonte gera ondas que se refratam no contato com a camada mais r\xE1pida. Depois da dist\xE2ncia cr\xEDtica, a onda refratada chega antes da direta, e a quebra na curva de tempos revela velocidade e profundidade do refrator."
      },
      grav: {
        name: "Gravimetria",
        unit: "mGal",
        prop: "Densidade",
        app: "Bacias, corpos densos, \xF3leo e g\xE1s",
        meta: "Anomalia Bouguer \xB7 esfera de 40 m de raio",
        desc: "Corpos mais densos aumentam levemente a acelera\xE7\xE3o da gravidade. Quanto mais profundo o corpo, mais larga e suave fica a anomalia medida em superf\xEDcie."
      },
      tdem: {
        name: "TDEM",
        unit: "V/A\xB7m\xB2",
        prop: "Condutividade el\xE9trica",
        app: "Aqu\xEDferos profundos, alvos condutivos",
        meta: "Loop coincidente 100 \xD7 100 m",
        desc: "A corrente na bobina \xE9 cortada de forma abrupta e mede-se o decaimento do campo induzido no subsolo. Tempos mais longos enxergam camadas mais profundas."
      }
    },
    params: {
      profundidade: "Profundidade",
      inclinacao: "Inclina\xE7\xE3o do campo",
      susceptibilidade: "Susceptibilidade",
      contraste: "Contraste de densidade",
      v1: "Velocidade da camada 1",
      v2: "Velocidade da camada 2",
      espessura: "Espessura da camada 1",
      rho: "Resistividade do alvo",
      permissividade: "Permissividade relativa"
    },
    labels: {
      surface: "superf\xEDcie",
      magBody: "corpo magn\xE9tico",
      densBody: "corpo denso",
      depth: "z = %s m",
      peak: "pico \u2248 %s",
      magAxis: "\u0394T (nT)",
      gravAxis: "\u0394g Bouguer (mGal)",
      electrodes: "eletrodos \xB7 espa\xE7amento 10 m",
      target: "alvo de %s \u03A9\xB7m a ~%s m",
      gprTime: "t (ns)",
      gprHint: "hip\xE9rboles = tubula\xE7\xF5es",
      velocity: "v = %s m/ns",
      source: "fonte",
      firstArrival: "tempo de 1\xAA chegada",
      v1: "V1 = %s m/s",
      v2: "V2 = %s m/s \xB7 refrator",
      crossover: "dist\xE2ncia cr\xEDtica \u2248 %s m \xB7 intercepto \u2248 %s ms",
      noRefraction: "sem refra\xE7\xE3o: V2 \u2264 V1",
      loop: "loop transmissor",
      dbdt: "log dB/dt",
      logt: "log t (\xB5s \u2192 ms)",
      conductive: "camada condutiva ~%s m"
    },
    ui: {
      property: "Propriedade",
      unit: "Unidade",
      applications: "Aplica\xE7\xF5es",
      methods: "M\xE9todos geof\xEDsicos",
      simulation: "Simula\xE7\xE3o ilustrativa",
      reset: "Restaurar valores"
    }
  };
  var listeners = /* @__PURE__ */ new Set();
  function isObj(v) {
    return v && typeof v === "object" && !Array.isArray(v);
  }
  function merge(target, patch) {
    Object.keys(patch).forEach((k) => {
      if (isObj(patch[k]) && isObj(target[k])) merge(target[k], patch[k]);
      else target[k] = patch[k];
    });
    return target;
  }
  function setTexts(patch) {
    if (isObj(patch)) merge(TEXTS, patch);
    listeners.forEach((fn) => fn());
  }
  function onTexts(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  function lb(key, ...args) {
    let s = TEXTS.labels[key] != null ? String(TEXTS.labels[key]) : key;
    args.forEach((a) => {
      s = s.replace("%s", a);
    });
    return s;
  }
  function fmt(n, decimals = 0) {
    try {
      return Number(n).toLocaleString(TEXTS.locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    } catch (e) {
      return Number(n).toFixed(decimals);
    }
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  // src/methods/mag.js
  var R = 40;
  var F = 25e3;
  function magShape(u, I) {
    const s2 = Math.sin(I) ** 2, c2 = Math.cos(I) ** 2;
    return ((2 - u * u) * s2 + (2 * u * u - 1) * c2 - 3 * u * Math.sin(2 * I)) / Math.pow(1 + u * u, 2.5);
  }
  function magAmplitude(depth, k) {
    return R ** 3 * k * F / (3 * depth ** 3);
  }
  var mag_default = {
    id: "mag",
    params: [
      { key: "profundidade", unit: "m", min: 20, max: 200, step: 5, value: 90 },
      { key: "inclinacao", unit: "\xB0", min: -90, max: 90, step: 1, value: -30 },
      { key: "susceptibilidade", unit: "SI", min: 1e-3, max: 0.2, step: 1e-3, value: 0.05, decimals: 3 }
    ],
    draw(S, t) {
      const { ctx: c, w, h, C, p } = S;
      const full = !S.mini;
      const y0 = h * 0.52, yb = h * 0.3, amp = h * 0.19;
      const k = full ? (h - y0) / 240 : w / 1e3;
      const depth = p.profundidade;
      const z = Math.max(4, depth * k);
      const I = p.inclinacao * Math.PI / 180;
      const bx = w * (0.5 + (S.still ? 0 : 0.18 * Math.sin(t * 0.45)));
      const A2 = magAmplitude(depth, p.susceptibilidade);
      const g = (x) => magShape((x - bx) / z, I);
      const dT = (x) => A2 * g(x);
      const yy = full ? (x) => yb - 1.3 * Math.tanh(dT(x) / 120) * amp : (x) => h * 0.55 - g(x) / 2 * h * 0.4;
      if (full) {
        ground(S, y0, h);
        const r = Math.max(6, R * k);
        c.fillStyle = rgba(C.accent, 0.9);
        dot(c, bx, y0 + z, r);
        const flip = bx > w * 0.6;
        txt(S, `${lb("magBody")} \xB7 ${lb("depth", fmt(depth))}`, flip ? bx - r - 10 : bx + r + 10, y0 + z + 4, C.fg, flip ? "right" : "left");
        c.strokeStyle = rgba(C.muted, 0.3);
        c.beginPath();
        c.moveTo(0, yb);
        c.lineTo(w, yb);
        c.stroke();
      }
      const prog = full && !S.still ? t * 0.18 % 1.15 : 1.1;
      const xe = Math.min(w, prog * w);
      c.strokeStyle = C.accent;
      c.lineWidth = 2;
      plot(c, 0, xe, 3, yy);
      c.lineWidth = 1;
      if (!full) return;
      c.fillStyle = C.fg;
      for (let x = 0; x <= xe; x += 24) dot(c, x, yy(x), 2);
      if (prog < 1) {
        c.save();
        c.translate(xe, h * 0.07);
        c.fillRect(-12, -2, 24, 4);
        c.fillRect(-2, -6, 4, 12);
        c.restore();
        c.strokeStyle = rgba(C.fg, 0.3);
        c.setLineDash([2, 3]);
        c.beginPath();
        c.moveTo(xe, h * 0.1);
        c.lineTo(xe, yb);
        c.stroke();
        c.setLineDash([]);
      }
      let peak = 0;
      for (let x = 0; x <= w; x += 4) {
        const v = dT(x);
        if (Math.abs(v) > Math.abs(peak)) peak = v;
      }
      txt(S, lb("magAxis"), 12, Math.max(14, yb - amp - 8));
      txt(S, lb("peak", `${peak >= 0 ? "+" : "\u2212"}${fmt(Math.abs(peak), Math.abs(peak) < 10 ? 1 : 0)} nT`), w - 12, Math.max(14, yb - amp - 8), C.fg, "right");
      txt(S, lb("surface"), w - 12, y0 - 6, C.muted, "right");
    }
  };

  // src/methods/res.js
  var A = 10;
  function logRho(cx, depthM, maxDepthM, target) {
    const dz = depthM / maxDepthM;
    let lr = 1.6 + 1.1 * dz + 0.12 * Math.sin(cx * 17 + depthM * 0.25);
    lr += 1.05 * Math.exp(-((cx - 0.27) ** 2 / 25e-4 + (dz - 0.65) ** 2 / 0.25));
    const wgt = Math.exp(-((cx - 0.62) ** 2 / 8e-3 + ((depthM - target.depth) / (maxDepthM * 0.22)) ** 2));
    return lr * (1 - wgt) + Math.log10(target.rho) * wgt;
  }
  var res_default = {
    id: "res",
    params: [
      { key: "profundidade", unit: "m", min: 5, max: 40, step: 1, value: 22 },
      { key: "rho", unit: "\u03A9\xB7m", min: 1, max: 2e3, step: 1, value: 10, log: true }
    ],
    draw(S, t) {
      const { ctx: c, w, h, C, p, mini } = S;
      const N2 = mini ? 14 : Math.max(16, Math.floor(w / 28));
      const cw = w / N2;
      const top = mini ? 3 : h * 0.17;
      const rows = mini ? 5 : 8;
      const rh = (mini ? h - 6 : h * 0.66) / rows;
      const maxDepth = (rows + 0.5) * A * 0.5;
      const rev = S.still || mini ? Infinity : t * 3.2 % (N2 + 10);
      const target = { depth: p.profundidade, rho: p.rho };
      for (let r = 0; r < rows; r++) {
        const depthM = (r + 1) * A * 0.5;
        for (let k = 0; k < N2 - r; k++) {
          if (k + r * 0.5 > rev) continue;
          const x = (k + r * 0.5) * cw;
          const lr = logRho((x + cw / 2) / w, depthM, maxDepth, target);
          c.fillStyle = cmap((lr - 1) / 2.3);
          c.fillRect(x + 1, top + r * rh + 1, cw - 2, rh - 2);
        }
      }
      if (mini) return;
      c.fillStyle = C.fg;
      for (let k = 0; k <= N2; k++) c.fillRect(k * cw - 1, top - 12, 2, 8);
      txt(S, lb("electrodes"), 12, top - 18);
      txt(S, lb("target", fmt(p.rho), fmt(p.profundidade)), w - 12, top - 18, C.fg, "right");
      if (S.labels) {
        const lw = Math.min(180, w * 0.35), lx = w - lw - 12, ly = h - 18;
        for (let i = 0; i < lw; i++) {
          c.fillStyle = cmap(i / lw);
          c.fillRect(lx + i, ly, 1, 8);
        }
        txt(S, "10", lx, ly - 4);
        txt(S, "100", lx + lw * 0.435, ly - 4, null, "center");
        txt(S, "2.000 \u03A9\xB7m", lx + lw, ly - 4, C.muted, "right");
      }
    }
  };

  // src/methods/gpr.js
  var C0 = 0.3;
  var LEN = 10;
  var WINDOW = 60;
  var PULSE = 2.2;
  function gprVelocity(er) {
    return C0 / Math.sqrt(er);
  }
  function diffractionTime(x, x0, d, v) {
    return 2 * Math.sqrt(d * d + (x - x0) ** 2) / v;
  }
  var gpr_default = {
    id: "gpr",
    params: [
      { key: "permissividade", unit: "\u03B5r", min: 3, max: 30, step: 1, value: 9 },
      { key: "profundidade", unit: "m", min: 0.3, max: 2.5, step: 0.1, value: 1, decimals: 1 }
    ],
    draw(S, t) {
      const { ctx: c, w, h, C, p, mini } = S;
      const top = mini ? 4 : h * 0.13;
      const bot = h - (mini ? 2 : h * 0.06);
      const ns2y = (ns) => top + ns / WINDOW * (bot - top);
      const pxPerNs = (bot - top) / WINDOW;
      const sweep = S.still || mini ? w + 1 : t * 90 % (w + 140);
      const dx = mini ? 4 : Math.max(3, w / 220);
      const v = gprVelocity(p.permissividade);
      const d = p.profundidade;
      const pipes = [[2.4, d], [5.5, d * 0.75], [7.9, d * 1.35]];
      const width = PULSE * (mini ? 0.8 : 1);
      const atten = (ns) => Math.exp(-ns / 45);
      c.strokeStyle = rgba(C.fg, 0.85);
      c.lineWidth = mini ? 0.6 : 0.8;
      for (let x = 4; x < Math.min(w, sweep); x += dx) {
        const xm = x / w * LEN;
        const t1 = 2 * (0.5 + 0.05 * Math.sin(xm * 0.9)) / v;
        const t2 = 2 * (2 + 0.1 * Math.sin(xm * 0.6 + 2)) / v;
        c.beginPath();
        for (let y = top; y < bot; y += 2) {
          const ns = (y - top) / pxPerNs;
          let s = ricker(ns - 2, width, 1);
          s += ricker(ns - t1, width, 0.6 * atten(t1));
          s += ricker(ns - t2, width, 0.5 * atten(t2));
          for (const [x0, dd] of pipes) {
            const tp = diffractionTime(xm, x0, dd, v);
            s += ricker(ns - tp, width, 0.95 * atten(tp) * Math.exp(-Math.abs(xm - x0) / 1.6));
          }
          const xx = x + s * dx * 1.6;
          if (y === top) c.moveTo(xx, y);
          else c.lineTo(xx, y);
        }
        c.stroke();
      }
      c.lineWidth = 1;
      if (mini) return;
      if (sweep < w) {
        c.fillStyle = C.accent;
        c.fillRect(sweep - 14, top - 18, 28, 10);
      }
      txt(S, lb("gprTime"), 8, top - 6);
      txt(S, `${WINDOW} ns`, 8, ns2y(WINDOW) - 4);
      txt(S, lb("velocity", fmt(v, 3)), w - 10, top - 6, C.fg, "right");
      txt(S, lb("gprHint"), w - 10, h - 6, C.accent, "right");
    }
  };

  // src/methods/seis.js
  var N = 24;
  var DX = 5;
  var LEN2 = N * DX;
  function firstArrival(x, v1, v2, h) {
    const direct = x / v1;
    if (v2 <= v1) return direct;
    const ti = 2 * h * Math.sqrt(1 - (v1 / v2) ** 2) / v1;
    return Math.min(direct, x / v2 + ti);
  }
  function crossover(v1, v2, h) {
    return v2 > v1 ? 2 * h * Math.sqrt((v2 + v1) / (v2 - v1)) : Infinity;
  }
  var seis_default = {
    id: "seis",
    params: [
      { key: "v1", unit: "m/s", min: 300, max: 1500, step: 50, value: 600 },
      { key: "v2", unit: "m/s", min: 800, max: 5e3, step: 100, value: 2400 },
      { key: "espessura", unit: "m", min: 2, max: 30, step: 1, value: 12 }
    ],
    draw(S, t) {
      const { ctx: c, w, h, C, p } = S;
      if (S.mini) {
        const n0 = 12;
        for (let i = 0; i < n0; i++) {
          const x = 6 + (w - 12) * i / (n0 - 1);
          const tp = Math.min(i * 0.6, 1.8 + i * 0.22);
          c.strokeStyle = rgba(C.fg, 0.6);
          c.beginPath();
          for (let y = 0; y < h; y += 2) {
            const wx = x + ricker(y - tp * h / 9 - 6, 3) * 5;
            if (y === 0) c.moveTo(wx, y);
            else c.lineTo(wx, y);
          }
          c.stroke();
          c.fillStyle = C.accent;
          dot(c, x, tp * h / 9 + 6, 2.5);
        }
        return;
      }
      const { v1, v2, espessura: hz } = p;
      const y0 = h * 0.6, xs = w * 0.06;
      const pxm = (w - 2 * xs) / LEN2;
      const pzm = Math.min(pxm, (h - y0) * 0.8 / 30);
      const yr = y0 + hz * pzm;
      const gx = (m) => xs + m * pxm;
      c.fillStyle = rgba(C.accent2, 0.14);
      c.fillRect(0, yr, w, h - yr);
      ground(S, y0, yr);
      c.strokeStyle = C.accent2;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(0, yr);
      c.lineTo(w, yr);
      c.stroke();
      c.lineWidth = 1;
      const tf = (m) => firstArrival(m, v1, v2, hz) * 1e3;
      const tmax = tf(LEN2) * 1.08;
      const phase = S.still ? 99 : t * 1.1 % 5.5;
      const tau = Math.min(1, phase / 4.5) * tmax;
      if (tau < tmax) {
        c.save();
        c.beginPath();
        c.rect(0, y0, w, yr - y0);
        c.clip();
        c.strokeStyle = rgba(C.accent, 0.85);
        for (let i = 0; i < 3; i++) {
          const rm = tau / 1e3 * v1 - i * 2;
          if (rm > 0) {
            c.beginPath();
            c.ellipse(xs, y0, rm * pxm, rm * pzm, 0, 0, Math.PI);
            c.stroke();
          }
        }
        c.restore();
      }
      c.fillStyle = C.accent;
      c.beginPath();
      c.moveTo(xs, y0 - 14);
      c.lineTo(xs - 6, y0 - 2);
      c.lineTo(xs + 6, y0 - 2);
      c.fill();
      txt(S, lb("source"), xs, y0 - 18, C.fg, "center");
      const tTop = h * 0.06, tH = h * 0.4;
      const ty = (ms) => tTop + tH - ms / tmax * tH;
      c.strokeStyle = rgba(C.muted, 0.3);
      c.beginPath();
      c.moveTo(xs, tTop);
      c.lineTo(xs, tTop + tH);
      c.lineTo(w - xs, tTop + tH);
      c.stroke();
      txt(S, lb("firstArrival"), xs + 6, tTop + 10);
      if (S.labels) {
        c.setLineDash([4, 4]);
        c.strokeStyle = rgba(C.fg, 0.25);
        c.beginPath();
        c.moveTo(gx(0), ty(0));
        c.lineTo(gx(LEN2), ty(Math.min(tmax, LEN2 / v1 * 1e3)));
        c.stroke();
        if (v2 > v1) {
          const ti = 2 * hz * Math.sqrt(1 - (v1 / v2) ** 2) / v1 * 1e3;
          c.strokeStyle = rgba(C.accent2, 0.45);
          c.beginPath();
          c.moveTo(gx(0), ty(ti));
          c.lineTo(gx(LEN2), ty(ti + LEN2 / v2 * 1e3));
          c.stroke();
          const xc = crossover(v1, v2, hz);
          if (xc < LEN2) {
            c.strokeStyle = rgba(C.accent, 0.35);
            c.beginPath();
            c.moveTo(gx(xc), tTop);
            c.lineTo(gx(xc), y0 - 10);
            c.stroke();
          }
        }
        c.setLineDash([]);
      }
      for (let i = 0; i < N; i++) {
        const m = (i + 1) * DX;
        const x = gx(m);
        c.fillStyle = C.fg;
        c.beginPath();
        c.moveTo(x, y0);
        c.lineTo(x - 4, y0 - 8);
        c.lineTo(x + 4, y0 - 8);
        c.fill();
        const ms = tf(m);
        if (ms <= tau) {
          c.fillStyle = C.accent;
          dot(c, x, ty(ms), 3);
        }
      }
      txt(S, lb("v1", fmt(v1)), 12, y0 + 18, C.fg);
      txt(S, lb("v2", fmt(v2)), 12, Math.min(h - 8, yr + 18), C.accent2);
      if (v2 > v1) {
        const ti = 2 * hz * Math.sqrt(1 - (v1 / v2) ** 2) / v1 * 1e3;
        txt(S, lb("crossover", fmt(crossover(v1, v2, hz)), fmt(ti)), w - xs, tTop + 10, C.fg, "right");
      } else {
        txt(S, lb("noRefraction"), w - xs, tTop + 10, C.accent, "right");
      }
    }
  };

  // src/methods/grav.js
  var R2 = 40;
  var G = 6674e-14;
  function gravAnomaly(xm, depth, contrast) {
    const M = 4 / 3 * Math.PI * R2 ** 3 * contrast * 1e3;
    return G * M * depth / Math.pow(xm * xm + depth * depth, 1.5) * 1e5;
  }
  var grav_default = {
    id: "grav",
    params: [
      { key: "profundidade", unit: "m", min: 20, max: 200, step: 5, value: 80 },
      { key: "contraste", unit: "g/cm\xB3", min: 0.1, max: 2, step: 0.05, value: 0.6, decimals: 2 }
    ],
    draw(S, t) {
      const { ctx: c, w, h, C, p } = S;
      const full = !S.mini;
      const y0 = h * 0.52, yb = h * 0.3, amp = h * 0.19;
      const k = full ? (h - y0) / 240 : w / 1e3;
      const depth = S.user || S.still ? p.profundidade : 50 + 60 * (1 + Math.sin(t * 0.6));
      const z = Math.max(4, depth * k);
      const bx = w * 0.52;
      const dg = (x) => gravAnomaly((x - bx) / k, depth, p.contraste);
      const yy = full ? (x) => yb - 1.3 * Math.tanh(dg(x) / 0.12) * amp : (x) => h * 0.7 - z ** 3 / Math.pow((x - bx) ** 2 + z * z, 1.5) * h * 0.55;
      if (full) {
        ground(S, y0, h);
        const r = Math.max(6, R2 * k);
        c.fillStyle = rgba(C.accent, 0.9);
        dot(c, bx, y0 + z, r);
        txt(S, `${lb("densBody")} \xB7 ${lb("depth", fmt(depth))}`, bx + r + 10, y0 + z + 4, C.fg);
        c.strokeStyle = rgba(C.muted, 0.3);
        c.beginPath();
        c.moveTo(0, yb);
        c.lineTo(w, yb);
        c.stroke();
      }
      c.strokeStyle = C.accent;
      c.lineWidth = 2;
      plot(c, 0, w, 3, yy);
      c.lineWidth = 1;
      if (!full) return;
      c.fillStyle = C.fg;
      for (let x = 0; x <= w; x += 24) dot(c, x, yy(x), 2);
      const peak = gravAnomaly(0, depth, p.contraste);
      txt(S, lb("gravAxis"), 12, Math.max(14, yb - amp - 8));
      txt(S, lb("peak", `${fmt(peak, peak < 0.1 ? 3 : 2)} mGal`), w - 12, Math.max(14, yb - amp - 8), C.fg, "right");
      txt(S, lb("surface"), w - 12, y0 - 6, C.muted, "right");
    }
  };

  // src/methods/tdem.js
  function tdemCurve(u, depth) {
    const uc = 0.15 + 0.7 * (depth - 20) / 280;
    return 0.08 + 0.75 * u + 0.12 * Math.exp(-((u - uc) ** 2) / 0.01);
  }
  var tdem_default = {
    id: "tdem",
    params: [
      { key: "profundidade", unit: "m", min: 20, max: 300, step: 10, value: 120 }
    ],
    draw(S, t) {
      const { ctx: c, w, h, C, p } = S;
      const depth = p.profundidade;
      const curve = (u2) => tdemCurve(u2, depth);
      if (S.mini) {
        c.strokeStyle = C.accent;
        c.lineWidth = 2;
        c.beginPath();
        for (let u2 = 0; u2 <= 1.0001; u2 += 0.02) {
          const x = u2 * w, y = 4 + curve(u2) * (h - 8);
          if (u2 === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
        c.lineWidth = 1;
        return;
      }
      const split = w < 560 ? 0 : w * 0.36;
      const lx = split ? split / 2 : w * 0.5;
      const ly = split ? h * 0.3 : h * 0.12;
      const s = split ? split * 0.5 : Math.min(w * 0.3, 90);
      c.strokeStyle = C.accent;
      c.lineWidth = 2;
      c.strokeRect(lx - s / 2, ly - s * 0.18, s, s * 0.36);
      c.lineWidth = 1;
      const ph = S.still ? 0.3 : t * 0.5 % 1;
      for (let k = 0; k < 4; k++) {
        const rr = (ph + k / 4) % 1;
        c.strokeStyle = rgba(C.accent2, Math.max(0, 1 - rr));
        c.beginPath();
        c.ellipse(lx, ly + s * 0.25 + rr * s * (split ? 0.9 : 0.45), s * 0.4 * (1 + rr * 1.6), s * 0.12 * (1 + rr * 1.6), 0, 0, Math.PI * 2);
        c.stroke();
      }
      txt(S, lb("loop"), lx, ly - s * 0.25, C.fg, "center");
      const px = split ? split + 30 : 40;
      const pw = w - px - 20;
      const py = split ? h * 0.1 : h * 0.48;
      const ph2 = split ? h * 0.78 : h * 0.46;
      c.strokeStyle = rgba(C.muted, 0.35);
      c.strokeRect(px, py, pw, ph2);
      for (let k = 1; k < 4; k++) {
        c.beginPath();
        c.moveTo(px + pw * k / 4, py);
        c.lineTo(px + pw * k / 4, py + ph2);
        c.stroke();
      }
      txt(S, lb("dbdt"), px + 6, py + 14);
      txt(S, lb("logt"), px + pw - 6, py + ph2 - 6, C.muted, "right");
      c.strokeStyle = C.accent;
      c.lineWidth = 2;
      c.beginPath();
      for (let u2 = 0; u2 <= 1.0001; u2 += 0.01) {
        const x = px + u2 * pw, y = py + curve(u2) * ph2 * 0.95;
        if (u2 === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      c.lineWidth = 1;
      const u = S.still ? 0.55 : t * 0.25 % 1;
      c.fillStyle = C.fg;
      dot(c, px + u * pw, py + curve(u) * ph2 * 0.95, 5);
      const uc = 0.15 + 0.7 * (depth - 20) / 280;
      const lxT = px + uc * pw;
      const right = uc > 0.6;
      txt(S, lb("conductive", fmt(depth)), right ? lxT - 10 : lxT + 10, py + curve(uc) * ph2 * 0.95 - 14, C.accent2, right ? "right" : "left");
    }
  };

  // src/methods/index.js
  var METHODS = { mag: mag_default, res: res_default, gpr: gpr_default, seis: seis_default, grav: grav_default, tdem: tdem_default };
  function registerMethod(def) {
    if (!def || typeof def.id !== "string" || typeof def.draw !== "function") {
      throw new TypeError("GeoSim.registerMethod: informe { id, draw(S, t), params? }");
    }
    METHODS[def.id] = Object.assign({ params: [] }, def);
    return METHODS[def.id];
  }
  function defaultParams(method) {
    const out = {};
    (method.params || []).forEach((p) => {
      out[p.key] = p.value;
    });
    return out;
  }
  function paramKeys() {
    const set = /* @__PURE__ */ new Set();
    Object.values(METHODS).forEach((m) => (m.params || []).forEach((p) => set.add(p.key)));
    return Array.from(set);
  }

  // src/core/runner.js
  var hasWindow = typeof window !== "undefined";
  var mqReduce = hasWindow && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var mqDark = hasWindow && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var live = /* @__PURE__ */ new Set();
  function listen(mq, fn) {
    if (!mq) return;
    if (mq.addEventListener) mq.addEventListener("change", fn);
    else if (mq.addListener) mq.addListener(fn);
  }
  listen(mqDark, () => live.forEach((r) => r.refreshColors()));
  listen(mqReduce, () => live.forEach((r) => r.start()));
  var prefersReducedMotion = () => !!(mqReduce && mqReduce.matches);
  var now = () => typeof performance !== "undefined" ? performance.now() : Date.now();
  var Runner = class {
    constructor(host, canvas, paint, opts = {}) {
      this.host = host;
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.paint = paint;
      this.opts = Object.assign({ animate: true, autoHeight: false }, opts);
      this.S = { ctx: this.ctx, w: 0, h: 0, C: null, still: false };
      this.visible = false;
      this.running = false;
      this.t0 = now();
      this._loop = this._loop.bind(this);
    }
    attach() {
      live.add(this);
      this.S.C = readColors(this.host);
      this.fit();
      if ("ResizeObserver" in window) {
        this.ro = new ResizeObserver(() => {
          this.fit();
          this.drawNow();
        });
        this.ro.observe(this.canvas);
      } else {
        this._onResize = () => {
          this.fit();
          this.drawNow();
        };
        window.addEventListener("resize", this._onResize);
      }
      if ("IntersectionObserver" in window) {
        this.io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            this.visible = e.isIntersecting;
            if (this.visible) this.start();
          });
        }, { rootMargin: "80px" });
        this.io.observe(this.host);
      } else {
        this.visible = true;
        this.start();
      }
    }
    detach() {
      live.delete(this);
      if (this.ro) this.ro.disconnect();
      if (this.io) this.io.disconnect();
      if (this._onResize) window.removeEventListener("resize", this._onResize);
      this.visible = false;
      this.running = false;
    }
    get still() {
      return prefersReducedMotion() || this.opts.animate === false;
    }
    fit() {
      const cv = this.canvas;
      const w = cv.clientWidth;
      if (!w) return;
      if (this.opts.autoHeight) {
        const target = Math.round(Math.max(260, Math.min(430, w * 0.56))) + "px";
        if (cv.style.height !== target) cv.style.height = target;
      }
      const h = cv.clientHeight || 300;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
      if (cv.width !== W) cv.width = W;
      if (cv.height !== H) cv.height = H;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.S.w = w;
      this.S.h = h;
    }
    draw(t) {
      if (!this.S.w || !this.S.h) return;
      if (!this.S.C) this.S.C = readColors(this.host);
      this.S.still = this.still;
      this.paint(this.S, this.S.still ? 0 : t);
    }
    drawNow() {
      this.draw((now() - this.t0) / 1e3);
    }
    restart() {
      this.t0 = now();
      this.drawNow();
      this.start();
    }
    start() {
      if (!this.visible) return;
      if (this.still) {
        this.drawNow();
        return;
      }
      if (this.running) return;
      this.running = true;
      requestAnimationFrame(this._loop);
    }
    _loop(ts) {
      if (!this.visible || this.still) {
        this.running = false;
        this.drawNow();
        return;
      }
      this.draw((ts - this.t0) / 1e3);
      requestAnimationFrame(this._loop);
    }
    refreshColors() {
      this.S.C = readColors(this.host);
      this.drawNow();
    }
  };

  // src/core/field.js
  var BODIES = [
    { x: 0.8, y: 0.22, A: 240, s: 0.12 },
    { x: 0.92, y: 0.7, A: -150, s: 0.09 },
    { x: 0.62, y: 0.85, A: 110, s: 0.07 },
    { x: 0.45, y: 0.15, A: -90, s: 0.08 },
    { x: 0.18, y: 0.6, A: 70, s: 0.1 }
  ];
  function createFieldState() {
    return { cur: { x: 0.68, y: 0.45, tx: 0.68, ty: 0.45 }, user: false, v: null, gw: 0, gh: 0, value: 0 };
  }
  function drawField(S, t, F2) {
    const { ctx: c, w, h, C } = S;
    const cs = w < 700 ? 10 : 13;
    const gw = Math.ceil(w / cs) + 1, gh = Math.ceil(h / cs) + 1;
    if (!F2.v || F2.gw !== gw || F2.gh !== gh) {
      F2.v = new Float32Array(gw * gh);
      F2.gw = gw;
      F2.gh = gh;
    }
    const v = F2.v, Sc = Math.min(Math.max(w, h), 1300), cur = F2.cur;
    if (!F2.user && !S.still) {
      cur.tx = 0.66 + 0.12 * Math.sin(t * 0.35);
      cur.ty = 0.45 + 0.16 * Math.sin(t * 0.27);
    }
    const ease = S.still ? 1 : 0.08;
    cur.x += (cur.tx - cur.x) * ease;
    cur.y += (cur.ty - cur.y) * ease;
    const src = BODIES.map((b2, i) => ({
      x: (b2.x + (S.still ? 0 : 0.012 * Math.sin(t * 0.2 + i * 1.7))) * w,
      y: (b2.y + (S.still ? 0 : 0.012 * Math.cos(t * 0.17 + i))) * h,
      A: b2.A,
      s: b2.s * Sc
    }));
    src.push({ x: cur.x * w, y: cur.y * h, A: 380, s: 0.1 * Sc });
    const at = (px, py) => {
      let val = 0;
      for (const o of src) {
        const dx = px - o.x, dy = py - o.y, s2 = o.s * o.s;
        val += o.A * Math.exp(-(dx * dx + dy * dy) / s2) - 0.45 * o.A * Math.exp(-(dx * dx + (dy + 0.95 * o.s) ** 2) / s2);
      }
      return val;
    };
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) v[j * gw + i] = at(i * cs, j * cs);
    c.clearRect(0, 0, w, h);
    const cx = cur.x * w, cy = cur.y * h;
    const glow = c.createRadialGradient(cx, cy, 0, cx, cy, Sc * 0.22);
    glow.addColorStop(0, rgba(C.accent, 0.16));
    glow.addColorStop(1, rgba(C.accent, 0));
    c.fillStyle = glow;
    c.fillRect(0, 0, w, h);
    let L, a, b, cc, d, x, y;
    const T = () => [x + cs * (L - a) / (b - a), y];
    const R3 = () => [x + cs, y + cs * (L - b) / (cc - b)];
    const B = () => [x + cs * (L - d) / (cc - d), y + cs];
    const Lf = () => [x, y + cs * (L - a) / (d - a)];
    const seg = (p, q) => {
      c.moveTo(p[0], p[1]);
      c.lineTo(q[0], q[1]);
    };
    for (L = -275; L <= 575; L += 25) {
      if (L === 0) continue;
      const strong = L % 100 === 0;
      c.strokeStyle = cmap((L + 275) / 850, strong ? 0.85 : 0.38);
      c.lineWidth = strong ? 1.3 : 0.8;
      c.beginPath();
      for (let j = 0; j < gh - 1; j++) {
        for (let i = 0; i < gw - 1; i++) {
          a = v[j * gw + i];
          b = v[j * gw + i + 1];
          cc = v[(j + 1) * gw + i + 1];
          d = v[(j + 1) * gw + i];
          const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (cc > L ? 2 : 0) | (d > L ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          x = i * cs;
          y = j * cs;
          switch (idx) {
            case 1:
            case 14:
              seg(Lf(), B());
              break;
            case 2:
            case 13:
              seg(B(), R3());
              break;
            case 3:
            case 12:
              seg(Lf(), R3());
              break;
            case 4:
            case 11:
              seg(T(), R3());
              break;
            case 6:
            case 9:
              seg(T(), B());
              break;
            case 7:
            case 8:
              seg(T(), Lf());
              break;
            case 5:
              seg(Lf(), T());
              seg(B(), R3());
              break;
            case 10:
              seg(T(), R3());
              seg(Lf(), B());
              break;
            default:
              break;
          }
        }
      }
      c.stroke();
    }
    c.lineWidth = 1;
    c.strokeStyle = C.fg;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(cx - 9, cy);
    c.lineTo(cx + 9, cy);
    c.moveTo(cx, cy - 9);
    c.lineTo(cx, cy + 9);
    c.stroke();
    c.beginPath();
    c.arc(cx, cy, 16, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 1;
    F2.value = at(cx, cy);
  }

  // src/core/styles.js
  var DARK = `
	--_bg: var(--gs-bg, #0e2236);
	--_bg2: var(--gs-bg2, #14304a);
	--_fg: var(--gs-fg, #eaf2f7);
	--_muted: var(--gs-muted, #9cb2c5);
	--_accent: var(--gs-accent, #73f02c);
	--_accent2: var(--gs-accent2, #5bd6b0);
	--_sky: var(--gs-sky, #5b8fd0);
	--_line: var(--gs-line, rgba(150, 190, 220, .18));
	color-scheme: dark;`;
  var LIGHT = `
	--_bg: var(--gs-bg, #f2f6f9);
	--_bg2: var(--gs-bg2, #e5edf3);
	--_fg: var(--gs-fg, #0f263c);
	--_muted: var(--gs-muted, #4e6578);
	--_accent: var(--gs-accent, #2c9a12);
	--_accent2: var(--gs-accent2, #13807a);
	--_sky: var(--gs-sky, #2f6aa8);
	--_line: var(--gs-line, rgba(16, 45, 72, .14));
	color-scheme: light;`;
  var BASE_CSS = `
:host {
	${DARK}
	--_radius: var(--gs-radius, 14px);
	--_mono: var(--gs-mono, ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace);
	display: block;
	position: relative;
	box-sizing: border-box;
	background: var(--_bg);
	color: var(--_fg);
	border-radius: var(--_radius);
	overflow: hidden;
	line-height: 1.5;
	font-family: var(--gs-font, inherit);
}
:host([theme="light"]) { ${LIGHT} }
@media (prefers-color-scheme: light) {
	:host(:not([theme="dark"])) { ${LIGHT} }
}
:host([hidden]) { display: none; }
*, *::before, *::after { box-sizing: border-box; }
canvas { display: block; width: 100%; }
:focus-visible { outline: 2px solid var(--_accent); outline-offset: 2px; }
`;
  var SIM_CSS = `
.controls {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 12px 24px;
	padding: 16px 20px;
	border-top: 1px solid var(--_line);
}
.controls[hidden], .info[hidden] { display: none; }
.ctl { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; font-size: .85rem; color: var(--_muted); }
.ctl input { grid-column: 1 / -1; width: 100%; accent-color: var(--_accent); margin: 0; }
.ctl output { font-family: var(--_mono); color: var(--_fg); font-size: .8rem; font-variant-numeric: tabular-nums; }
.reset {
	justify-self: start;
	align-self: end;
	font: inherit;
	font-size: .85rem;
	color: var(--_fg);
	background: transparent;
	border: 1px solid var(--_line);
	border-radius: 999px;
	padding: 6px 14px;
	cursor: pointer;
}
.reset:hover { border-color: var(--_fg); }
.info { border-top: 1px solid var(--_line); padding: 18px 20px 20px; display: grid; gap: 12px; }
.info__head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 16px; }
.info__name { font-size: 1.15rem; font-weight: 700; }
.info__meta { color: var(--_muted); font-size: .85rem; }
.info dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px 20px; margin: 0; }
.info dt { color: var(--_muted); font-size: .78rem; }
.info dd { margin: 2px 0 0; font-weight: 600; font-size: .95rem; }
.info p { margin: 0; color: var(--_muted); max-width: 70ch; font-size: .95rem; }
`;
  var LAB_CSS = `
.lab { display: grid; grid-template-columns: minmax(200px, 250px) 1fr; }
.nav { display: flex; flex-direction: column; gap: 2px; padding: 12px; border-right: 1px solid var(--_line); background: var(--_bg2); }
.btn {
	all: unset;
	box-sizing: border-box;
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 10px;
	padding: 11px 12px;
	border-radius: calc(var(--_radius) * .6);
	color: var(--_muted);
	cursor: pointer;
	font-size: .95rem;
	transition: background .2s, color .2s;
}
.btn:hover { color: var(--_fg); background: var(--_line); }
.btn[aria-pressed="true"] { color: var(--_fg); background: var(--_bg); box-shadow: inset 3px 0 0 var(--_accent); }
.btn:focus-visible { outline: 2px solid var(--_accent); }
.unit { font-family: var(--_mono); font-size: .75rem; opacity: .8; white-space: nowrap; }
.main { min-width: 0; }
.main geo-sim { border-radius: 0; background: transparent; }
@media (max-width: 760px) {
	.lab { grid-template-columns: 1fr; }
	.nav { flex-direction: row; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--_line); padding: 8px; }
	.btn { flex: 0 0 auto; }
	.btn[aria-pressed="true"] { box-shadow: inset 0 -3px 0 var(--_accent); }
}
`;
  var CARDS_CSS = `
:host { background: var(--_line); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 1px; }
.grid.fixed { grid-template-columns: repeat(var(--_cols, 3), minmax(0, 1fr)); }
@media (max-width: 760px) { .grid.fixed { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.card { display: grid; gap: 4px; padding: 16px; background: var(--_bg); color: var(--_fg); text-decoration: none; transition: background .2s; }
a.card:hover { background: var(--_bg2); }
.card geo-sim { border-radius: 0; background: transparent; margin-bottom: 8px; }
.card b { font-size: 1rem; }
.card span { color: var(--_muted); font-size: .85rem; }
`;
  var FIELD_CSS = `
:host { min-height: var(--_h, 520px); display: flex; align-items: center; }
canvas { position: absolute; inset: 0; height: 100%; }
.overlay { position: relative; z-index: 2; width: 100%; max-width: 760px; padding: clamp(28px, 6vw, 72px) clamp(20px, 5vw, 64px); pointer-events: none; }
::slotted(*) { pointer-events: auto; }
.readout {
	position: absolute; z-index: 3; right: 14px; bottom: 12px;
	display: flex; gap: 14px; padding: 6px 12px; border-radius: 999px;
	background: color-mix(in srgb, var(--_bg) 75%, transparent);
	border: 1px solid var(--_line);
	font-family: var(--_mono); font-size: .75rem; color: var(--_muted);
	pointer-events: none;
	-webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
}
.readout[hidden] { display: none; }
.readout b { color: var(--_fg); font-weight: 600; font-variant-numeric: tabular-nums; }
@media (max-width: 520px) { .readout { left: 12px; right: 12px; justify-content: center; } }
`;

  // src/elements/index.js
  var FALSY = /^(no|nao|não|false|0|off)$/i;
  function flag(el, name, dflt) {
    if (!el.hasAttribute(name)) return dflt;
    return !FALSY.test((el.getAttribute(name) || "").trim());
  }
  var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function parseList(str) {
    const all = Object.keys(METHODS);
    if (!str) return all;
    const out = str.split(",").map((s) => s.trim()).filter((k) => METHODS[k]);
    return out.length ? Array.from(new Set(out)) : all;
  }
  function infoHTML(id) {
    const m = TEXTS.methods[id] || {};
    const u = TEXTS.ui;
    return `<div class="info__head"><strong class="info__name">${esc(m.name || id)}</strong><span class="info__meta">${esc(m.meta || "")}</span></div>
<dl><div><dt>${esc(u.property)}</dt><dd>${esc(m.prop || "")}</dd></div><div><dt>${esc(u.unit)}</dt><dd>${esc(m.unit || "")}</dd></div><div><dt>${esc(u.applications)}</dt><dd>${esc(m.app || "")}</dd></div></dl>
<p>${esc(m.desc || "")}</p>`;
  }
  var LOG_STEPS = 1e3;
  var toSlider = (pr, v) => pr.log ? Math.round(Math.log(v / pr.min) / Math.log(pr.max / pr.min) * LOG_STEPS) : v;
  var fromSlider = (pr, s) => {
    if (!pr.log) return Number(s);
    const raw = pr.min * Math.pow(pr.max / pr.min, Number(s) / LOG_STEPS);
    return Math.round(raw / pr.step) * pr.step || pr.min;
  };
  var showVal = (pr, v) => `${fmt(v, pr.decimals || 0)} ${pr.unit || ""}`.trim();
  function defineElements() {
    if (typeof window === "undefined" || !window.customElements) return;
    const define = (name, cls) => {
      if (!customElements.get(name)) customElements.define(name, cls);
    };
    class GeoSim extends HTMLElement {
      static get observedAttributes() {
        return ["metodo", "height", "theme", "labels", "animate", "mini", "controls", "info"].concat(paramKeys());
      }
      constructor() {
        super();
        const root = this.attachShadow({ mode: "open" });
        root.innerHTML = `<style>${BASE_CSS}${SIM_CSS}</style>
<div class="stage" part="stage"><canvas part="canvas" role="img"></canvas></div>
<div class="controls" part="controls" hidden></div>
<div class="info" part="info" hidden></div>`;
        this._canvas = root.querySelector("canvas");
        this._controls = root.querySelector(".controls");
        this._info = root.querySelector(".info");
        this._params = {};
        this._user = false;
        this._for = null;
        this._runner = new Runner(this, this._canvas, (S, t) => this._paint(S, t));
      }
      connectedCallback() {
        this._sync();
        this._runner.attach();
        this._offTexts = onTexts(() => this._sync(true));
      }
      disconnectedCallback() {
        this._runner.detach();
        if (this._offTexts) this._offTexts();
      }
      attributeChangedCallback(name, oldV, newV) {
        if (oldV === newV || !this.isConnected) return;
        if (name === "theme") {
          this._runner.refreshColors();
          return;
        }
        this._sync(name !== "metodo");
        if (name === "metodo") this._runner.restart();
        else this._runner.drawNow();
      }
      get metodo() {
        const v = this.getAttribute("metodo");
        return METHODS[v] ? v : "mag";
      }
      set metodo(v) {
        this.setAttribute("metodo", v);
      }
      get params() {
        return Object.assign({}, this._params);
      }
      /** Altera um parâmetro, congela a animação desse parâmetro e emite "geosim-change". */
      setParam(key, value) {
        const pr = (METHODS[this.metodo].params || []).find((x) => x.key === key);
        if (!pr || !isFinite(value)) return;
        this._params[key] = clamp(Number(value), pr.min, pr.max);
        this._user = true;
        const input = this._controls.querySelector(`input[data-key="${key}"]`);
        if (input) {
          input.value = toSlider(pr, this._params[key]);
          input.nextElementSibling.textContent = showVal(pr, this._params[key]);
        }
        this._runner.drawNow();
        this.dispatchEvent(new CustomEvent("geosim-change", { bubbles: true, composed: true, detail: { metodo: this.metodo, params: this.params } }));
      }
      reset() {
        this._for = null;
        this._sync();
        this._runner.restart();
      }
      _sync(keepParams) {
        const m = METHODS[this.metodo];
        const mini = flag(this, "mini", false);
        this._mini = mini;
        this._labels = flag(this, "labels", true);
        this._runner.opts.animate = flag(this, "animate", true);
        const hAttr = (this.getAttribute("height") || "").trim();
        this._runner.opts.autoHeight = hAttr === "auto";
        if (hAttr !== "auto") {
          const hv = parseInt(hAttr, 10);
          this._canvas.style.height = clamp(hv || (mini ? 90 : 360), 40, 1400) + "px";
        }
        if (!keepParams || this._for !== m.id) {
          this._params = defaultParams(m);
          this._user = false;
          this._for = m.id;
        }
        (m.params || []).forEach((pr) => {
          const a = this.getAttribute(pr.key);
          if (a !== null && a.trim() !== "" && isFinite(parseFloat(a))) {
            this._params[pr.key] = clamp(parseFloat(a), pr.min, pr.max);
            this._user = true;
          }
        });
        const name = TEXTS.methods[m.id] && TEXTS.methods[m.id].name || m.id;
        this._canvas.setAttribute("aria-label", `${TEXTS.ui.simulation}: ${name}`);
        const showInfo = !mini && flag(this, "info", false);
        this._info.hidden = !showInfo;
        this._info.innerHTML = showInfo ? infoHTML(m.id) : "";
        this._buildControls(!mini && flag(this, "controls", false) && (m.params || []).length > 0);
        this._runner.fit();
      }
      _buildControls(show) {
        const box = this._controls;
        box.hidden = !show;
        if (!show) {
          box.innerHTML = "";
          return;
        }
        const m = METHODS[this.metodo];
        box.innerHTML = m.params.map((pr) => {
          const id = `ctl-${pr.key}`;
          const min = pr.log ? 0 : pr.min, max = pr.log ? LOG_STEPS : pr.max, step = pr.log ? 1 : pr.step;
          return `<label class="ctl" for="${id}"><span>${esc(TEXTS.params[pr.key] || pr.key)}</span>
<input id="${id}" type="range" data-key="${esc(pr.key)}" min="${min}" max="${max}" step="${step}" value="${toSlider(pr, this._params[pr.key])}"><output for="${id}">${esc(showVal(pr, this._params[pr.key]))}</output></label>`;
        }).join("") + `<button type="button" class="reset">${esc(TEXTS.ui.reset)}</button>`;
        box.querySelectorAll("input").forEach((input) => {
          const pr = m.params.find((x) => x.key === input.dataset.key);
          const out = input.nextElementSibling;
          input.addEventListener("input", () => {
            const v = fromSlider(pr, input.value);
            out.textContent = showVal(pr, v);
            this.setParam(pr.key, v);
          });
        });
        box.querySelector(".reset").addEventListener("click", () => this.reset());
      }
      _paint(S, t) {
        S.mini = this._mini;
        S.labels = this._labels;
        S.p = this._params;
        S.user = this._user;
        S.ctx.clearRect(0, 0, S.w, S.h);
        METHODS[this.metodo].draw(S, t);
      }
    }
    const PASS = ["theme", "controls", "labels", "animate"];
    class GeoSimLab extends HTMLElement {
      static get observedAttributes() {
        return ["metodos", "inicial", "height", "info"].concat(PASS);
      }
      constructor() {
        super();
        const root = this.attachShadow({ mode: "open" });
        root.innerHTML = `<style>${BASE_CSS}${LAB_CSS}</style>
<div class="lab"><div class="nav" part="nav" role="group"></div><div class="main"><geo-sim part="sim"></geo-sim></div></div>`;
        this._nav = root.querySelector(".nav");
        this._sim = root.querySelector("geo-sim");
        this._nav.addEventListener("click", (e) => {
          const b = e.target.closest(".btn");
          if (b) this.metodo = b.dataset.method;
        });
        this._nav.addEventListener("keydown", (e) => {
          if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].indexOf(e.key) === -1) return;
          const btns = Array.from(this._nav.querySelectorAll(".btn"));
          const i = btns.indexOf(root.activeElement);
          if (i === -1) return;
          e.preventDefault();
          const next = btns[(i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) + btns.length) % btns.length];
          next.focus();
          this.metodo = next.dataset.method;
        });
      }
      connectedCallback() {
        this._render();
        this._offTexts = onTexts(() => this._render());
      }
      disconnectedCallback() {
        if (this._offTexts) this._offTexts();
      }
      attributeChangedCallback(name, oldV) {
        if (this.isConnected && oldV !== void 0) this._render();
      }
      get metodo() {
        return this._current;
      }
      set metodo(key) {
        if (!METHODS[key] || this._keys && this._keys.indexOf(key) === -1) return;
        this._current = key;
        this._sim.setAttribute("metodo", key);
        this._nav.querySelectorAll(".btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.method === key)));
        this.dispatchEvent(new CustomEvent("geosim-method", { bubbles: true, composed: true, detail: { metodo: key } }));
      }
      /** Alias usado pelos cards. */
      select(key) {
        this.metodo = key;
      }
      _render() {
        this._keys = parseList(this.getAttribute("metodos"));
        this._nav.setAttribute("aria-label", TEXTS.ui.methods);
        this._nav.innerHTML = this._keys.map((k) => {
          const m = TEXTS.methods[k] || { name: k, unit: "" };
          return `<button type="button" class="btn" data-method="${k}" aria-pressed="false"><span>${esc(m.name)}</span><span class="unit">${esc(m.unit || "")}</span></button>`;
        }).join("");
        PASS.forEach((a) => {
          if (this.hasAttribute(a)) this._sim.setAttribute(a, this.getAttribute(a));
          else this._sim.removeAttribute(a);
        });
        this._sim.setAttribute("height", this.getAttribute("height") || "auto");
        this._sim.setAttribute("info", flag(this, "info", true) ? "yes" : "no");
        const start = this._current && this._keys.indexOf(this._current) > -1 ? this._current : this._keys.indexOf(this.getAttribute("inicial")) > -1 ? this.getAttribute("inicial") : this._keys[0];
        this.metodo = start;
      }
    }
    class GeoSimCards extends HTMLElement {
      static get observedAttributes() {
        return ["metodos", "alvo", "link", "colunas", "theme", "animate", "height"];
      }
      constructor() {
        super();
        const root = this.attachShadow({ mode: "open" });
        root.innerHTML = `<style>${BASE_CSS}${CARDS_CSS}</style><div class="grid" part="grid"></div>`;
        this._grid = root.querySelector(".grid");
        this._grid.addEventListener("click", (e) => {
          const card = e.target.closest("[data-method]");
          const target = this.getAttribute("alvo");
          if (!card || !target) return;
          const lab = document.getElementById(target);
          if (lab && typeof lab.select === "function") lab.select(card.dataset.method);
          else if (lab && lab.tagName === "GEO-SIM") lab.setAttribute("metodo", card.dataset.method);
        });
      }
      connectedCallback() {
        this._render();
        this._offTexts = onTexts(() => this._render());
      }
      disconnectedCallback() {
        if (this._offTexts) this._offTexts();
      }
      attributeChangedCallback(name, oldV) {
        if (this.isConnected && oldV !== void 0) this._render();
      }
      _render() {
        const keys = parseList(this.getAttribute("metodos"));
        const cols = clamp(parseInt(this.getAttribute("colunas"), 10) || 0, 0, 6);
        const target = this.getAttribute("alvo");
        const link = this.getAttribute("link");
        const href = target ? "#" + target : link || "";
        const h = clamp(parseInt(this.getAttribute("height"), 10) || 70, 40, 300);
        const pass = ["theme", "animate"].filter((a) => this.hasAttribute(a)).map((a) => ` ${a}="${esc(this.getAttribute(a))}"`).join("");
        this._grid.classList.toggle("fixed", cols > 0);
        if (cols) this._grid.style.setProperty("--_cols", cols);
        else this._grid.style.removeProperty("--_cols");
        this._grid.innerHTML = keys.map((k) => {
          const m = TEXTS.methods[k] || { name: k, prop: "" };
          const tag = href ? "a" : "div";
          return `<${tag} class="card" data-method="${k}"${href ? ` href="${esc(href)}"` : ""}>
<geo-sim metodo="${k}" mini height="${h}"${pass} aria-hidden="true"></geo-sim><b>${esc(m.name)}</b><span>${esc(m.prop || "")}</span></${tag}>`;
        }).join("");
      }
    }
    class GeoSimField extends HTMLElement {
      static get observedAttributes() {
        return ["height", "theme", "readout", "interativo", "animate"];
      }
      constructor() {
        super();
        const root = this.attachShadow({ mode: "open" });
        root.innerHTML = `<style>${BASE_CSS}${FIELD_CSS}</style>
<canvas part="canvas" aria-hidden="true"></canvas>
<div class="overlay" part="overlay"><slot></slot></div>
<div class="readout" part="readout" aria-hidden="true"><span>X <b data-r="x">0</b> m</span><span>Y <b data-r="y">0</b> m</span><span><b data-r="v">0 nT</b></span></div>`;
        this._canvas = root.querySelector("canvas");
        this._readout = root.querySelector(".readout");
        this._r = { x: root.querySelector('[data-r="x"]'), y: root.querySelector('[data-r="y"]'), v: root.querySelector('[data-r="v"]') };
        this._F = createFieldState();
        this._runner = new Runner(this, this._canvas, (S, t) => this._paint(S, t));
        this._onMove = (e) => {
          if (!flag(this, "interativo", true)) return;
          const r = this._canvas.getBoundingClientRect();
          if (!r.width || !r.height) return;
          this._F.cur.tx = (e.clientX - r.left) / r.width;
          this._F.cur.ty = (e.clientY - r.top) / r.height;
          this._F.user = true;
          if (this._runner.still) this._runner.drawNow();
        };
        this._onLeave = () => {
          this._F.user = false;
        };
      }
      connectedCallback() {
        this._sync();
        this.addEventListener("pointermove", this._onMove);
        this.addEventListener("pointerleave", this._onLeave);
        this._runner.attach();
      }
      disconnectedCallback() {
        this.removeEventListener("pointermove", this._onMove);
        this.removeEventListener("pointerleave", this._onLeave);
        this._runner.detach();
      }
      attributeChangedCallback(name, oldV, newV) {
        if (oldV === newV || !this.isConnected) return;
        if (name === "theme") {
          this._runner.refreshColors();
          return;
        }
        this._sync();
        this._runner.drawNow();
      }
      _sync() {
        const h = clamp(parseInt(this.getAttribute("height"), 10) || 520, 160, 1400);
        this.style.setProperty("--_h", h + "px");
        this._readout.hidden = !flag(this, "readout", true);
        this._runner.opts.animate = flag(this, "animate", true);
      }
      _paint(S, t) {
        S.labels = true;
        drawField(S, t, this._F);
        if (!this._readout.hidden) {
          const v = this._F.value;
          this._r.x.textContent = Math.round(this._F.cur.x * 2400);
          this._r.y.textContent = Math.round((1 - this._F.cur.y) * 1200);
          this._r.v.textContent = `${v >= 0 ? "+" : "\u2212"}${Math.abs(Math.round(v))} nT`;
        }
      }
    }
    define("geo-sim", GeoSim);
    define("geo-sim-lab", GeoSimLab);
    define("geo-sim-cards", GeoSimCards);
    define("geo-sim-field", GeoSimField);
  }

  // src/index.js
  /*!
   * GeoSim — simulações geofísicas didáticas em Canvas 2D, sem dependências.
   * https://github.com/qartt/geosim · MIT
   */
  var version = "1.0.0";
  if (typeof window !== "undefined" && window.GeoSimConfig && window.GeoSimConfig.texts) {
    setTexts(window.GeoSimConfig.texts);
  }
  defineElements();
  var draw = { cmap, rgba, txt, ground, dot, plot, ricker };
  return __toCommonJS(index_exports);
})();
