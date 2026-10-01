import mag from './mag.js';
import res from './res.js';
import gpr from './gpr.js';
import seis from './seis.js';
import grav from './grav.js';
import tdem from './tdem.js';

/** Registro de métodos. Novos métodos entram via registerMethod(). */
export const METHODS = { mag, res, gpr, seis, grav, tdem };

/**
 * Registra um método novo (ex.: IP, MT, sísmica de reflexão).
 * def = { id, params: [{ key, unit, min, max, step, value, decimals?, log? }], draw(S, t) }
 */
export function registerMethod(def) {
	if (!def || typeof def.id !== 'string' || typeof def.draw !== 'function') {
		throw new TypeError('GeoSim.registerMethod: informe { id, draw(S, t), params? }');
	}
	METHODS[def.id] = Object.assign({ params: [] }, def);
	return METHODS[def.id];
}

export function defaultParams(method) {
	const out = {};
	(method.params || []).forEach((p) => { out[p.key] = p.value; });
	return out;
}

/** Todas as chaves de parâmetro conhecidas (viram atributos observados). */
export function paramKeys() {
	const set = new Set();
	Object.values(METHODS).forEach((m) => (m.params || []).forEach((p) => set.add(p.key)));
	return Array.from(set);
}
