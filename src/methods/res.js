import { txt, cmap } from '../core/draw.js';
import { lb, fmt } from '../core/texts.js';

const A = 10; // espaçamento entre eletrodos (m)

/**
 * Modelo ilustrativo de log10(ρ) para uma pseudosseção dipolo-dipolo:
 * fundo que fica mais resistivo em profundidade, um alvo condutivo
 * configurável (argila, água, sulfeto) e um dique resistivo estreito.
 * Não é uma inversão: é um modelo direto simplificado para ensino.
 */
export function logRho(cx, depthM, maxDepthM, target) {
	const dz = depthM / maxDepthM;
	let lr = 1.6 + 1.1 * dz + 0.12 * Math.sin(cx * 17 + depthM * 0.25);
	lr += 1.05 * Math.exp(-(((cx - 0.27) ** 2) / 0.0025 + ((dz - 0.65) ** 2) / 0.25));
	const wgt = Math.exp(-(((cx - 0.62) ** 2) / 0.008 + ((depthM - target.depth) / (maxDepthM * 0.22)) ** 2));
	return lr * (1 - wgt) + Math.log10(target.rho) * wgt;
}

export default {
	id: 'res',
	params: [
		{ key: 'profundidade', unit: 'm', min: 5, max: 40, step: 1, value: 22 },
		{ key: 'rho', unit: 'Ω·m', min: 1, max: 2000, step: 1, value: 10, log: true }
	],

	draw(S, t) {
		const { ctx: c, w, h, C, p, mini } = S;
		const N = mini ? 14 : Math.max(16, Math.floor(w / 28));
		const cw = w / N;
		const top = mini ? 3 : h * 0.17;
		const rows = mini ? 5 : 8;
		const rh = (mini ? h - 6 : h * 0.66) / rows;
		const maxDepth = (rows + 0.5) * A * 0.5;
		const rev = S.still || mini ? Infinity : (t * 3.2) % (N + 10);
		const target = { depth: p.profundidade, rho: p.rho };

		for (let r = 0; r < rows; r++) {
			const depthM = (r + 1) * A * 0.5; // pseudoprofundidade
			for (let k = 0; k < N - r; k++) {
				if (k + r * 0.5 > rev) continue;
				const x = (k + r * 0.5) * cw;
				const lr = logRho((x + cw / 2) / w, depthM, maxDepth, target);
				c.fillStyle = cmap((lr - 1) / 2.3);
				c.fillRect(x + 1, top + r * rh + 1, cw - 2, rh - 2);
			}
		}
		if (mini) return;

		c.fillStyle = C.fg;
		for (let k = 0; k <= N; k++) c.fillRect(k * cw - 1, top - 12, 2, 8);
		txt(S, lb('electrodes'), 12, top - 18);
		txt(S, lb('target', fmt(p.rho), fmt(p.profundidade)), w - 12, top - 18, C.fg, 'right');

		if (S.labels) {
			const lw = Math.min(180, w * 0.35), lx = w - lw - 12, ly = h - 18;
			for (let i = 0; i < lw; i++) {
				c.fillStyle = cmap(i / lw);
				c.fillRect(lx + i, ly, 1, 8);
			}
			txt(S, '10', lx, ly - 4);
			txt(S, '100', lx + lw * 0.435, ly - 4, null, 'center');
			txt(S, '2.000 Ω·m', lx + lw, ly - 4, C.muted, 'right');
		}
	}
};
