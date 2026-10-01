import { ground, txt, dot, plot, rgba } from '../core/draw.js';
import { lb, fmt } from '../core/texts.js';

const R = 40;          // raio da esfera (m)
const G = 6.674e-11;   // constante gravitacional (m³·kg⁻¹·s⁻²)

/**
 * Anomalia de uma esfera:  Δg(x) = G·M·z / (x² + z²)^(3/2)
 * com M = 4/3·π·R³·Δρ. Resultado em mGal (1 mGal = 10⁻⁵ m/s²).
 */
export function gravAnomaly(xm, depth, contrast) {
	const M = (4 / 3) * Math.PI * R ** 3 * contrast * 1000;
	return (G * M * depth) / Math.pow(xm * xm + depth * depth, 1.5) * 1e5;
}

export default {
	id: 'grav',
	params: [
		{ key: 'profundidade', unit: 'm', min: 20, max: 200, step: 5, value: 80 },
		{ key: 'contraste', unit: 'g/cm³', min: 0.1, max: 2, step: 0.05, value: 0.6, decimals: 2 }
	],

	draw(S, t) {
		const { ctx: c, w, h, C, p } = S;
		const full = !S.mini;
		const y0 = h * 0.52, yb = h * 0.3, amp = h * 0.19;
		const k = full ? (h - y0) / 240 : w / 1000;
		// sem interação, o corpo "respira" em profundidade para mostrar o alargamento da anomalia
		const depth = S.user || S.still ? p.profundidade : 50 + 60 * (1 + Math.sin(t * 0.6));
		const z = Math.max(4, depth * k);
		const bx = w * 0.52;

		const dg = (x) => gravAnomaly((x - bx) / k, depth, p.contraste);
		const yy = full
			? (x) => yb - 1.3 * Math.tanh(dg(x) / 0.12) * amp
			: (x) => h * 0.7 - (z ** 3 / Math.pow((x - bx) ** 2 + z * z, 1.5)) * h * 0.55;

		if (full) {
			ground(S, y0, h);
			const r = Math.max(6, R * k);
			c.fillStyle = rgba(C.accent, 0.9);
			dot(c, bx, y0 + z, r);
			txt(S, `${lb('densBody')} · ${lb('depth', fmt(depth))}`, bx + r + 10, y0 + z + 4, C.fg);
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
		txt(S, lb('gravAxis'), 12, Math.max(14, yb - amp - 8));
		txt(S, lb('peak', `${fmt(peak, peak < 0.1 ? 3 : 2)} mGal`), w - 12, Math.max(14, yb - amp - 8), C.fg, 'right');
		txt(S, lb('surface'), w - 12, y0 - 6, C.muted, 'right');
	}
};
