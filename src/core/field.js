import { cmap, rgba } from './draw.js';

const BODIES = [
	{ x: 0.8, y: 0.22, A: 240, s: 0.12 },
	{ x: 0.92, y: 0.7, A: -150, s: 0.09 },
	{ x: 0.62, y: 0.85, A: 110, s: 0.07 },
	{ x: 0.45, y: 0.15, A: -90, s: 0.08 },
	{ x: 0.18, y: 0.6, A: 70, s: 0.1 }
];

export function createFieldState() {
	return { cur: { x: 0.68, y: 0.45, tx: 0.68, ty: 0.45 }, user: false, v: null, gw: 0, gh: 0, value: 0 };
}

/**
 * Mapa de anomalia magnética sintético: soma de fontes dipolares gaussianas
 * (uma delas segue o cursor) e isolinhas extraídas por marching squares.
 */
export function drawField(S, t, F) {
	const { ctx: c, w, h, C } = S;
	const cs = w < 700 ? 10 : 13;
	const gw = Math.ceil(w / cs) + 1, gh = Math.ceil(h / cs) + 1;
	if (!F.v || F.gw !== gw || F.gh !== gh) {
		F.v = new Float32Array(gw * gh);
		F.gw = gw;
		F.gh = gh;
	}
	const v = F.v, Sc = Math.min(Math.max(w, h), 1300), cur = F.cur;

	if (!F.user && !S.still) {
		cur.tx = 0.66 + 0.12 * Math.sin(t * 0.35);
		cur.ty = 0.45 + 0.16 * Math.sin(t * 0.27);
	}
	const ease = S.still ? 1 : 0.08;
	cur.x += (cur.tx - cur.x) * ease;
	cur.y += (cur.ty - cur.y) * ease;

	const src = BODIES.map((b, i) => ({
		x: (b.x + (S.still ? 0 : 0.012 * Math.sin(t * 0.2 + i * 1.7))) * w,
		y: (b.y + (S.still ? 0 : 0.012 * Math.cos(t * 0.17 + i))) * h,
		A: b.A,
		s: b.s * Sc
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
	const R = () => [x + cs, y + cs * (L - b) / (cc - b)];
	const B = () => [x + cs * (L - d) / (cc - d), y + cs];
	const Lf = () => [x, y + cs * (L - a) / (d - a)];
	const seg = (p, q) => { c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); };

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
					case 1: case 14: seg(Lf(), B()); break;
					case 2: case 13: seg(B(), R()); break;
					case 3: case 12: seg(Lf(), R()); break;
					case 4: case 11: seg(T(), R()); break;
					case 6: case 9: seg(T(), B()); break;
					case 7: case 8: seg(T(), Lf()); break;
					case 5: seg(Lf(), T()); seg(B(), R()); break;
					case 10: seg(T(), R()); seg(Lf(), B()); break;
					default: break;
				}
			}
		}
		c.stroke();
	}
	c.lineWidth = 1;

	c.strokeStyle = C.fg;
	c.lineWidth = 1.2;
	c.beginPath();
	c.moveTo(cx - 9, cy); c.lineTo(cx + 9, cy);
	c.moveTo(cx, cy - 9); c.lineTo(cx, cy + 9);
	c.stroke();
	c.beginPath();
	c.arc(cx, cy, 16, 0, Math.PI * 2);
	c.stroke();
	c.lineWidth = 1;

	F.value = at(cx, cy);
}
