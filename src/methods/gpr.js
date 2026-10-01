import { txt, rgba, ricker } from '../core/draw.js';
import { lb, fmt } from '../core/texts.js';

const C0 = 0.3;       // velocidade da luz (m/ns)
const LEN = 10;       // comprimento do perfil (m)
const WINDOW = 60;    // janela de tempo (ns)
const PULSE = 2.2;    // meia-largura da wavelet (ns)

/** Velocidade no meio: v = c / √εr (m/ns). */
export function gprVelocity(er) {
	return C0 / Math.sqrt(er);
}

/** Tempo duplo de um difrator pontual: t(x) = 2·√(d² + (x−x0)²) / v (ns). */
export function diffractionTime(x, x0, d, v) {
	return (2 * Math.sqrt(d * d + (x - x0) ** 2)) / v;
}

export default {
	id: 'gpr',
	params: [
		{ key: 'permissividade', unit: 'εr', min: 3, max: 30, step: 1, value: 9 },
		{ key: 'profundidade', unit: 'm', min: 0.3, max: 2.5, step: 0.1, value: 1, decimals: 1 }
	],

	draw(S, t) {
		const { ctx: c, w, h, C, p, mini } = S;
		const top = mini ? 4 : h * 0.13;
		const bot = h - (mini ? 2 : h * 0.06);
		const ns2y = (ns) => top + (ns / WINDOW) * (bot - top);
		const pxPerNs = (bot - top) / WINDOW;
		const sweep = S.still || mini ? w + 1 : (t * 90) % (w + 140);
		const dx = mini ? 4 : Math.max(3, w / 220);
		const v = gprVelocity(p.permissividade);
		const d = p.profundidade;
		const pipes = [[2.4, d], [5.5, d * 0.75], [7.9, d * 1.35]];
		const width = PULSE * (mini ? 0.8 : 1);
		const atten = (ns) => Math.exp(-ns / 45);

		c.strokeStyle = rgba(C.fg, 0.85);
		c.lineWidth = mini ? 0.6 : 0.8;
		for (let x = 4; x < Math.min(w, sweep); x += dx) {
			const xm = (x / w) * LEN;
			const t1 = (2 * (0.5 + 0.05 * Math.sin(xm * 0.9))) / v;
			const t2 = (2 * (2.0 + 0.1 * Math.sin(xm * 0.6 + 2))) / v;
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
				if (y === top) c.moveTo(xx, y); else c.lineTo(xx, y);
			}
			c.stroke();
		}
		c.lineWidth = 1;
		if (mini) return;

		if (sweep < w) {
			c.fillStyle = C.accent;
			c.fillRect(sweep - 14, top - 18, 28, 10);
		}
		txt(S, lb('gprTime'), 8, top - 6);
		txt(S, `${WINDOW} ns`, 8, ns2y(WINDOW) - 4);
		txt(S, lb('velocity', fmt(v, 3)), w - 10, top - 6, C.fg, 'right');
		txt(S, lb('gprHint'), w - 10, h - 6, C.accent, 'right');
	}
};
