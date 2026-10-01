import { txt, dot, rgba } from '../core/draw.js';
import { lb, fmt } from '../core/texts.js';

/**
 * Curva ilustrativa de decaimento (log dB/dt × log t). O "ombro" aparece
 * no tempo em que a difusão do campo alcança a camada condutiva:
 * camadas mais profundas aparecem em tempos mais longos.
 */
export function tdemCurve(u, depth) {
	const uc = 0.15 + 0.7 * (depth - 20) / 280;
	return 0.08 + 0.75 * u + 0.12 * Math.exp(-((u - uc) ** 2) / 0.01);
}

export default {
	id: 'tdem',
	params: [
		{ key: 'profundidade', unit: 'm', min: 20, max: 300, step: 10, value: 120 }
	],

	draw(S, t) {
		const { ctx: c, w, h, C, p } = S;
		const depth = p.profundidade;
		const curve = (u) => tdemCurve(u, depth);

		if (S.mini) {
			c.strokeStyle = C.accent;
			c.lineWidth = 2;
			c.beginPath();
			for (let u = 0; u <= 1.0001; u += 0.02) {
				const x = u * w, y = 4 + curve(u) * (h - 8);
				if (u === 0) c.moveTo(x, y); else c.lineTo(x, y);
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

		const ph = S.still ? 0.3 : (t * 0.5) % 1;
		for (let k = 0; k < 4; k++) {
			const rr = (ph + k / 4) % 1;
			c.strokeStyle = rgba(C.accent2, Math.max(0, 1 - rr));
			c.beginPath();
			c.ellipse(lx, ly + s * 0.25 + rr * s * (split ? 0.9 : 0.45), s * 0.4 * (1 + rr * 1.6), s * 0.12 * (1 + rr * 1.6), 0, 0, Math.PI * 2);
			c.stroke();
		}
		txt(S, lb('loop'), lx, ly - s * 0.25, C.fg, 'center');

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
		txt(S, lb('dbdt'), px + 6, py + 14);
		txt(S, lb('logt'), px + pw - 6, py + ph2 - 6, C.muted, 'right');

		c.strokeStyle = C.accent;
		c.lineWidth = 2;
		c.beginPath();
		for (let u = 0; u <= 1.0001; u += 0.01) {
			const x = px + u * pw, y = py + curve(u) * ph2 * 0.95;
			if (u === 0) c.moveTo(x, y); else c.lineTo(x, y);
		}
		c.stroke();
		c.lineWidth = 1;

		const u = S.still ? 0.55 : (t * 0.25) % 1;
		c.fillStyle = C.fg;
		dot(c, px + u * pw, py + curve(u) * ph2 * 0.95, 5);
		const uc = 0.15 + 0.7 * (depth - 20) / 280;
		const lxT = px + uc * pw;
		const right = uc > 0.6;
		txt(S, lb('conductive', fmt(depth)), right ? lxT - 10 : lxT + 10, py + curve(uc) * ph2 * 0.95 - 14, C.accent2, right ? 'right' : 'left');
	}
};
