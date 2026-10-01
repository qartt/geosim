import { ground, txt, dot, plot, rgba } from '../core/draw.js';
import { lb, fmt } from '../core/texts.js';

const R = 40;     // raio da esfera (m)
const F = 25000;  // intensidade do campo geomagnético (nT), ordem de grandeza no Brasil

/**
 * Anomalia de campo total de uma esfera magnetizada por indução,
 * perfil ao longo do meridiano magnético (Telford et al., Applied Geophysics):
 *   ΔT(x) = R³·k·F / (3·z³) · g(u),  u = x/z
 *   g(u)  = [(2−u²)·sin²I + (2u²−1)·cos²I − 3u·sin2I] / (1+u²)^(5/2)
 */
export function magShape(u, I) {
	const s2 = Math.sin(I) ** 2, c2 = Math.cos(I) ** 2;
	return ((2 - u * u) * s2 + (2 * u * u - 1) * c2 - 3 * u * Math.sin(2 * I)) / Math.pow(1 + u * u, 2.5);
}

export function magAmplitude(depth, k) {
	return (R ** 3) * k * F / (3 * depth ** 3);
}

export default {
	id: 'mag',
	params: [
		{ key: 'profundidade', unit: 'm', min: 20, max: 200, step: 5, value: 90 },
		{ key: 'inclinacao', unit: '°', min: -90, max: 90, step: 1, value: -30 },
		{ key: 'susceptibilidade', unit: 'SI', min: 0.001, max: 0.2, step: 0.001, value: 0.05, decimals: 3 }
	],

	draw(S, t) {
		const { ctx: c, w, h, C, p } = S;
		const full = !S.mini;
		const y0 = h * 0.52, yb = h * 0.3, amp = h * 0.19;
		const k = full ? (h - y0) / 240 : w / 1000; // px por metro
		const depth = p.profundidade;
		const z = Math.max(4, depth * k);
		const I = (p.inclinacao * Math.PI) / 180;
		const bx = w * (0.5 + (S.still ? 0 : 0.18 * Math.sin(t * 0.45)));
		const A = magAmplitude(depth, p.susceptibilidade);

		const g = (x) => magShape((x - bx) / z, I);
		const dT = (x) => A * g(x);
		const yy = full
			? (x) => yb - 1.3 * Math.tanh(dT(x) / 120) * amp
			: (x) => h * 0.55 - (g(x) / 2) * h * 0.4;

		if (full) {
			ground(S, y0, h);
			const r = Math.max(6, R * k);
			c.fillStyle = rgba(C.accent, 0.9);
			dot(c, bx, y0 + z, r);
			const flip = bx > w * 0.6;
			txt(S, `${lb('magBody')} · ${lb('depth', fmt(depth))}`, flip ? bx - r - 10 : bx + r + 10, y0 + z + 4, C.fg, flip ? 'right' : 'left');
			c.strokeStyle = rgba(C.muted, 0.3);
			c.beginPath();
			c.moveTo(0, yb);
			c.lineTo(w, yb);
			c.stroke();
		}

		const prog = full && !S.still ? (t * 0.18) % 1.15 : 1.1;
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
		for (let x = 0; x <= w; x += 4) { const v = dT(x); if (Math.abs(v) > Math.abs(peak)) peak = v; }
		txt(S, lb('magAxis'), 12, Math.max(14, yb - amp - 8));
		txt(S, lb('peak', `${peak >= 0 ? '+' : '−'}${fmt(Math.abs(peak), Math.abs(peak) < 10 ? 1 : 0)} nT`), w - 12, Math.max(14, yb - amp - 8), C.fg, 'right');
		txt(S, lb('surface'), w - 12, y0 - 6, C.muted, 'right');
	}
};
