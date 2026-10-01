import { test } from 'node:test';
import assert from 'node:assert/strict';
import { METHODS, defaultParams, registerMethod } from '../src/methods/index.js';
import { drawField, createFieldState } from '../src/core/field.js';
import { firstArrival, crossover } from '../src/methods/seis.js';
import { gravAnomaly } from '../src/methods/grav.js';
import { magShape, magAmplitude } from '../src/methods/mag.js';
import { gprVelocity, diffractionTime } from '../src/methods/gpr.js';
import { DEFAULT_COLORS } from '../src/core/draw.js';

/** Contexto 2D falso que registra coordenadas inválidas. */
function mockCtx() {
	const bad = [];
	const coordFns = new Set(['moveTo', 'lineTo', 'arc', 'ellipse', 'fillRect', 'strokeRect', 'rect', 'fillText', 'clearRect', 'translate', 'createRadialGradient']);
	const ctx = new Proxy({}, {
		get(target, prop) {
			if (prop in target) return target[prop];
			if (prop === 'createRadialGradient') return (...a) => { check(prop, a); return { addColorStop() {} }; };
			return (...args) => { if (coordFns.has(prop)) check(prop, args); };
		},
		set(target, prop, value) { target[prop] = value; return true; }
	});
	function check(fn, args) {
		args.forEach((a) => { if (typeof a === 'number' && !Number.isFinite(a)) bad.push(`${fn}(${args.join(',')})`); });
	}
	return { ctx, bad };
}

function scene(opts) {
	const { ctx, bad } = mockCtx();
	return { S: Object.assign({ ctx, w: 800, h: 420, C: DEFAULT_COLORS, labels: true, mini: false, still: false, user: false }, opts), bad };
}

for (const [id, m] of Object.entries(METHODS)) {
	test(`${id}: desenha sem coordenadas inválidas (padrão, extremos, mini, estático)`, () => {
		const variants = [defaultParams(m)];
		const lo = {}, hi = {};
		(m.params || []).forEach((p) => { lo[p.key] = p.min; hi[p.key] = p.max; });
		variants.push(lo, hi);
		for (const p of variants) {
			for (const conf of [{}, { mini: true, w: 220, h: 70 }, { still: true }, { user: true }, { w: 360, h: 260 }]) {
				for (const t of [0, 0.7, 3.3, 9.9, 41]) {
					const { S, bad } = scene(Object.assign({ p }, conf));
					m.draw(S, t);
					assert.deepEqual(bad, [], `${id} p=${JSON.stringify(p)} conf=${JSON.stringify(conf)} t=${t}`);
				}
			}
		}
	});
}

test('campo: isolinhas e valor sob o cursor', () => {
	const { S, bad } = scene({ w: 1000, h: 500 });
	const F = createFieldState();
	for (const t of [0, 2, 8]) drawField(S, t, F);
	assert.deepEqual(bad, []);
	assert.ok(Number.isFinite(F.value));
});

test('sísmica: direta antes da distância crítica, refratada depois', () => {
	const v1 = 600, v2 = 2400, h = 12;
	const xc = crossover(v1, v2, h);
	assert.ok(Math.abs(firstArrival(xc * 0.5, v1, v2, h) - (xc * 0.5) / v1) < 1e-12);
	assert.ok(firstArrival(xc * 2, v1, v2, h) < (xc * 2) / v1);
	assert.equal(crossover(800, 600, 10), Infinity);
});

test('gravimetria: pico ∝ 1/z² e ordem de grandeza plausível', () => {
	const g80 = gravAnomaly(0, 80, 0.6), g160 = gravAnomaly(0, 160, 0.6);
	assert.ok(Math.abs(g80 / g160 - 4) < 1e-9);
	assert.ok(g80 > 0.05 && g80 < 1, `g80=${g80}`);
});

test('magnetometria: polo (I=90°) tem pico 2 em x=0 e amplitude ∝ 1/z³', () => {
	assert.ok(Math.abs(magShape(0, Math.PI / 2) - 2) < 1e-12);
	assert.ok(Math.abs(magShape(0, 0) + 1) < 1e-12);
	assert.ok(Math.abs(magAmplitude(50, 0.05) / magAmplitude(100, 0.05) - 8) < 1e-9);
});

test('GPR: v = c/√εr e hipérbole mínima sobre o alvo', () => {
	assert.ok(Math.abs(gprVelocity(9) - 0.1) < 1e-12);
	const v = gprVelocity(9);
	assert.ok(diffractionTime(5, 5, 1, v) < diffractionTime(6, 5, 1, v));
	assert.ok(Math.abs(diffractionTime(5, 5, 1, v) - 20) < 1e-9);
});

test('registerMethod: aceita método novo e valida entrada', () => {
	const m = registerMethod({ id: 'teste', draw() {} });
	assert.deepEqual(m.params, []);
	assert.throws(() => registerMethod({ id: 'x' }), TypeError);
	delete METHODS.teste;
});
