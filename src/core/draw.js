/**
 * Cores e primitivas de desenho compartilhadas pelos métodos.
 */

const STOPS = ['#1f3f7a', '#2f6aa8', '#2fa3b0', '#5bd6b0', '#a6ec4a', '#f2c744', '#e8742c'].map((h) => {
	const n = parseInt(h.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
});

/** Rampa de cores (0..1) usada em pseudosseções e isolinhas. */
export function cmap(t, alpha) {
	t = Math.max(0, Math.min(1, t)) * (STOPS.length - 1);
	const i = Math.min(STOPS.length - 2, Math.floor(t));
	const f = t - i, a = STOPS[i], b = STOPS[i + 1];
	const r = (a[0] + (b[0] - a[0]) * f) | 0;
	const g = (a[1] + (b[1] - a[1]) * f) | 0;
	const bl = (a[2] + (b[2] - a[2]) * f) | 0;
	return alpha == null ? `rgb(${r},${g},${bl})` : `rgba(${r},${g},${bl},${alpha})`;
}

let probe = null;
const cache = new Map();

/** Converte qualquer cor CSS em rgba() com alfa. */
export function rgba(col, a) {
	const key = col + '|' + a;
	if (cache.has(key)) return cache.get(key);
	let out = col;
	if (typeof document !== 'undefined') {
		if (!probe) probe = document.createElement('canvas').getContext('2d');
		if (probe) {
			probe.fillStyle = '#000';
			probe.fillStyle = col;
			const v = probe.fillStyle;
			if (v.charAt(0) === '#') {
				const n = parseInt(v.slice(1), 16);
				out = `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
			} else {
				const m = v.match(/[\d.]+/g);
				if (m) out = `rgba(${m[0]},${m[1]},${m[2]},${a * (m[3] != null ? +m[3] : 1)})`;
			}
		}
	} else if (/^#[0-9a-f]{6}$/i.test(col)) {
		const n = parseInt(col.slice(1), 16);
		out = `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
	}
	cache.set(key, out);
	return out;
}

export const DEFAULT_COLORS = {
	bg: '#0e2236',
	fg: '#eaf2f7',
	muted: '#9cb2c5',
	accent: '#73f02c',
	accent2: '#5bd6b0',
	sky: '#5b8fd0',
	mono: 'ui-monospace, monospace'
};

/** Lê as cores resolvidas do componente (variáveis internas --_*). */
export function readColors(el) {
	if (!el || typeof getComputedStyle !== 'function') return { ...DEFAULT_COLORS };
	const cs = getComputedStyle(el);
	const g = (k) => cs.getPropertyValue('--_' + k).trim() || DEFAULT_COLORS[k];
	return { bg: g('bg'), fg: g('fg'), muted: g('muted'), accent: g('accent'), accent2: g('accent2'), sky: g('sky'), mono: g('mono') };
}

/** Texto no canvas (omitido em modo mini ou com labels desligados). */
export function txt(S, s, x, y, col, align, size) {
	if (!S.labels || S.mini) return;
	const c = S.ctx;
	c.fillStyle = col || S.C.muted;
	c.font = `${size || 11}px ${S.C.mono}`;
	c.textAlign = align || 'left';
	c.textBaseline = 'alphabetic';
	c.fillText(s, x, y);
}

/** Faixa de subsolo com estratificação tracejada e linha de superfície. */
export function ground(S, y0, yEnd) {
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
			if (x === 0) c.moveTo(x, yy); else c.lineTo(x, yy);
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

export function dot(c, x, y, r) {
	c.beginPath();
	c.arc(x, y, r, 0, Math.PI * 2);
	c.fill();
}

/** Desenha uma polilinha a partir de uma função y(x). */
export function plot(c, x0, x1, step, fy) {
	c.beginPath();
	for (let x = x0; x <= x1; x += step) {
		const y = fy(x);
		if (x === x0) c.moveTo(x, y); else c.lineTo(x, y);
	}
	c.stroke();
}

/** Wavelet de Ricker (chapéu mexicano). */
export function ricker(tau, width, amp = 1) {
	const q = (tau / width) * (tau / width);
	return amp * (1 - 2 * q) * Math.exp(-q);
}
