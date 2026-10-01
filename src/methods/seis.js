import { ground, txt, dot, rgba, ricker } from '../core/draw.js';
import { lb, fmt } from '../core/texts.js';

const N = 24;        // geofones
const DX = 5;        // espaçamento (m)
const LEN = N * DX;  // comprimento do arranjo (m)

/**
 * Tempo de primeira chegada (s) para duas camadas planas:
 *   direta:    t = x / V1
 *   refratada: t = x / V2 + 2·h·cos(ic) / V1,  sen(ic) = V1/V2
 */
export function firstArrival(x, v1, v2, h) {
	const direct = x / v1;
	if (v2 <= v1) return direct;
	const ti = (2 * h * Math.sqrt(1 - (v1 / v2) ** 2)) / v1;
	return Math.min(direct, x / v2 + ti);
}

export function crossover(v1, v2, h) {
	return v2 > v1 ? 2 * h * Math.sqrt((v2 + v1) / (v2 - v1)) : Infinity;
}

export default {
	id: 'seis',
	params: [
		{ key: 'v1', unit: 'm/s', min: 300, max: 1500, step: 50, value: 600 },
		{ key: 'v2', unit: 'm/s', min: 800, max: 5000, step: 100, value: 2400 },
		{ key: 'espessura', unit: 'm', min: 2, max: 30, step: 1, value: 12 }
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
					if (y === 0) c.moveTo(wx, y); else c.lineTo(wx, y);
				}
				c.stroke();
				c.fillStyle = C.accent;
				dot(c, x, tp * h / 9 + 6, 2.5);
			}
			return;
		}

		const { v1, v2, espessura: hz } = p;
		const y0 = h * 0.6, xs = w * 0.06;
		const pxm = (w - 2 * xs) / LEN;                     // px por metro (horizontal)
		const pzm = Math.min(pxm, ((h - y0) * 0.8) / 30);   // px por metro (vertical)
		const yr = y0 + hz * pzm;
		const gx = (m) => xs + m * pxm;

		// camadas
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

		// tempos (ms)
		const tf = (m) => firstArrival(m, v1, v2, hz) * 1000;
		const tmax = tf(LEN) * 1.08;
		const phase = S.still ? 99 : (t * 1.1) % 5.5;
		const tau = Math.min(1, phase / 4.5) * tmax;

		// frente de onda na camada 1 (elipse por causa da escala vertical)
		if (tau < tmax) {
			c.save();
			c.beginPath();
			c.rect(0, y0, w, yr - y0);
			c.clip();
			c.strokeStyle = rgba(C.accent, 0.85);
			for (let i = 0; i < 3; i++) {
				const rm = (tau / 1000) * v1 - i * 2;
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
		txt(S, lb('source'), xs, y0 - 18, C.fg, 'center');

		// dromocrônica
		const tTop = h * 0.06, tH = h * 0.4;
		const ty = (ms) => tTop + tH - (ms / tmax) * tH;
		c.strokeStyle = rgba(C.muted, 0.3);
		c.beginPath();
		c.moveTo(xs, tTop);
		c.lineTo(xs, tTop + tH);
		c.lineTo(w - xs, tTop + tH);
		c.stroke();
		txt(S, lb('firstArrival'), xs + 6, tTop + 10);

		if (S.labels) {
			// retas teóricas da onda direta e da refratada
			c.setLineDash([4, 4]);
			c.strokeStyle = rgba(C.fg, 0.25);
			c.beginPath();
			c.moveTo(gx(0), ty(0));
			c.lineTo(gx(LEN), ty(Math.min(tmax, (LEN / v1) * 1000)));
			c.stroke();
			if (v2 > v1) {
				const ti = (2 * hz * Math.sqrt(1 - (v1 / v2) ** 2)) / v1 * 1000;
				c.strokeStyle = rgba(C.accent2, 0.45);
				c.beginPath();
				c.moveTo(gx(0), ty(ti));
				c.lineTo(gx(LEN), ty(ti + (LEN / v2) * 1000));
				c.stroke();
				const xc = crossover(v1, v2, hz);
				if (xc < LEN) {
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

		txt(S, lb('v1', fmt(v1)), 12, y0 + 18, C.fg);
		txt(S, lb('v2', fmt(v2)), 12, Math.min(h - 8, yr + 18), C.accent2);
		if (v2 > v1) {
			const ti = (2 * hz * Math.sqrt(1 - (v1 / v2) ** 2)) / v1 * 1000;
			txt(S, lb('crossover', fmt(crossover(v1, v2, hz)), fmt(ti)), w - xs, tTop + 10, C.fg, 'right');
		} else {
			txt(S, lb('noRefraction'), w - xs, tTop + 10, C.accent, 'right');
		}
	}
};
