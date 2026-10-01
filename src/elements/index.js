import { METHODS, defaultParams, paramKeys } from '../methods/index.js';
import { TEXTS, onTexts, fmt, esc } from '../core/texts.js';
import { Runner } from '../core/runner.js';
import { drawField, createFieldState } from '../core/field.js';
import { BASE_CSS, SIM_CSS, LAB_CSS, CARDS_CSS, FIELD_CSS } from '../core/styles.js';

const FALSY = /^(no|nao|não|false|0|off)$/i;
/** Atributo booleano: ausente = padrão; presente = verdadeiro, salvo "no/false/0/off". */
function flag(el, name, dflt) {
	if (!el.hasAttribute(name)) return dflt;
	return !FALSY.test((el.getAttribute(name) || '').trim());
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function parseList(str) {
	const all = Object.keys(METHODS);
	if (!str) return all;
	const out = str.split(',').map((s) => s.trim()).filter((k) => METHODS[k]);
	return out.length ? Array.from(new Set(out)) : all;
}

function infoHTML(id) {
	const m = TEXTS.methods[id] || {};
	const u = TEXTS.ui;
	return `<div class="info__head"><strong class="info__name">${esc(m.name || id)}</strong><span class="info__meta">${esc(m.meta || '')}</span></div>
<dl><div><dt>${esc(u.property)}</dt><dd>${esc(m.prop || '')}</dd></div><div><dt>${esc(u.unit)}</dt><dd>${esc(m.unit || '')}</dd></div><div><dt>${esc(u.applications)}</dt><dd>${esc(m.app || '')}</dd></div></dl>
<p>${esc(m.desc || '')}</p>`;
}

/* Sliders com escala logarítmica opcional. */
const LOG_STEPS = 1000;
const toSlider = (pr, v) => (pr.log ? Math.round((Math.log(v / pr.min) / Math.log(pr.max / pr.min)) * LOG_STEPS) : v);
const fromSlider = (pr, s) => {
	if (!pr.log) return Number(s);
	const raw = pr.min * Math.pow(pr.max / pr.min, Number(s) / LOG_STEPS);
	return Math.round(raw / pr.step) * pr.step || pr.min;
};
const showVal = (pr, v) => `${fmt(v, pr.decimals || 0)} ${pr.unit || ''}`.trim();

export function defineElements() {
	if (typeof window === 'undefined' || !window.customElements) return;
	const define = (name, cls) => { if (!customElements.get(name)) customElements.define(name, cls); };

	/* ------------------------------------------------------------------
	 * <geo-sim metodo="seis" controls info height="360">
	 * ---------------------------------------------------------------- */
	class GeoSim extends HTMLElement {
		static get observedAttributes() {
			return ['metodo', 'height', 'theme', 'labels', 'animate', 'mini', 'controls', 'info'].concat(paramKeys());
		}

		constructor() {
			super();
			const root = this.attachShadow({ mode: 'open' });
			root.innerHTML = `<style>${BASE_CSS}${SIM_CSS}</style>
<div class="stage" part="stage"><canvas part="canvas" role="img"></canvas></div>
<div class="controls" part="controls" hidden></div>
<div class="info" part="info" hidden></div>`;
			this._canvas = root.querySelector('canvas');
			this._controls = root.querySelector('.controls');
			this._info = root.querySelector('.info');
			this._params = {};
			this._user = false;
			this._for = null;
			this._runner = new Runner(this, this._canvas, (S, t) => this._paint(S, t));
		}

		connectedCallback() {
			this._sync();
			this._runner.attach();
			this._offTexts = onTexts(() => this._sync(true));
		}

		disconnectedCallback() {
			this._runner.detach();
			if (this._offTexts) this._offTexts();
		}

		attributeChangedCallback(name, oldV, newV) {
			if (oldV === newV || !this.isConnected) return;
			if (name === 'theme') { this._runner.refreshColors(); return; }
			this._sync(name !== 'metodo');
			if (name === 'metodo') this._runner.restart(); else this._runner.drawNow();
		}

		get metodo() {
			const v = this.getAttribute('metodo');
			return METHODS[v] ? v : 'mag';
		}
		set metodo(v) { this.setAttribute('metodo', v); }

		get params() { return Object.assign({}, this._params); }

		/** Altera um parâmetro, congela a animação desse parâmetro e emite "geosim-change". */
		setParam(key, value) {
			const pr = (METHODS[this.metodo].params || []).find((x) => x.key === key);
			if (!pr || !isFinite(value)) return;
			this._params[key] = clamp(Number(value), pr.min, pr.max);
			this._user = true;
			const input = this._controls.querySelector(`input[data-key="${key}"]`);
			if (input) {
				input.value = toSlider(pr, this._params[key]);
				input.nextElementSibling.textContent = showVal(pr, this._params[key]);
			}
			this._runner.drawNow();
			this.dispatchEvent(new CustomEvent('geosim-change', { bubbles: true, composed: true, detail: { metodo: this.metodo, params: this.params } }));
		}

		reset() {
			this._for = null;
			this._sync();
			this._runner.restart();
		}

		_sync(keepParams) {
			const m = METHODS[this.metodo];
			const mini = flag(this, 'mini', false);
			this._mini = mini;
			this._labels = flag(this, 'labels', true);
			this._runner.opts.animate = flag(this, 'animate', true);

			const hAttr = (this.getAttribute('height') || '').trim();
			this._runner.opts.autoHeight = hAttr === 'auto';
			if (hAttr !== 'auto') {
				const hv = parseInt(hAttr, 10);
				this._canvas.style.height = clamp(hv || (mini ? 90 : 360), 40, 1400) + 'px';
			}

			if (!keepParams || this._for !== m.id) {
				this._params = defaultParams(m);
				this._user = false;
				this._for = m.id;
			}
			(m.params || []).forEach((pr) => {
				const a = this.getAttribute(pr.key);
				if (a !== null && a.trim() !== '' && isFinite(parseFloat(a))) {
					this._params[pr.key] = clamp(parseFloat(a), pr.min, pr.max);
					this._user = true;
				}
			});

			const name = (TEXTS.methods[m.id] && TEXTS.methods[m.id].name) || m.id;
			this._canvas.setAttribute('aria-label', `${TEXTS.ui.simulation}: ${name}`);

			const showInfo = !mini && flag(this, 'info', false);
			this._info.hidden = !showInfo;
			this._info.innerHTML = showInfo ? infoHTML(m.id) : '';

			this._buildControls(!mini && flag(this, 'controls', false) && (m.params || []).length > 0);
			this._runner.fit();
		}

		_buildControls(show) {
			const box = this._controls;
			box.hidden = !show;
			if (!show) { box.innerHTML = ''; return; }
			const m = METHODS[this.metodo];
			box.innerHTML = m.params.map((pr) => {
				const id = `ctl-${pr.key}`;
				const min = pr.log ? 0 : pr.min, max = pr.log ? LOG_STEPS : pr.max, step = pr.log ? 1 : pr.step;
				return `<label class="ctl" for="${id}"><span>${esc(TEXTS.params[pr.key] || pr.key)}</span>
<input id="${id}" type="range" data-key="${esc(pr.key)}" min="${min}" max="${max}" step="${step}" value="${toSlider(pr, this._params[pr.key])}"><output for="${id}">${esc(showVal(pr, this._params[pr.key]))}</output></label>`;
			}).join('') + `<button type="button" class="reset">${esc(TEXTS.ui.reset)}</button>`;
			box.querySelectorAll('input').forEach((input) => {
				const pr = m.params.find((x) => x.key === input.dataset.key);
				const out = input.nextElementSibling;
				input.addEventListener('input', () => {
					const v = fromSlider(pr, input.value);
					out.textContent = showVal(pr, v);
					this.setParam(pr.key, v);
				});
			});
			box.querySelector('.reset').addEventListener('click', () => this.reset());
		}

		_paint(S, t) {
			S.mini = this._mini;
			S.labels = this._labels;
			S.p = this._params;
			S.user = this._user;
			S.ctx.clearRect(0, 0, S.w, S.h);
			METHODS[this.metodo].draw(S, t);
		}
	}

	/* ------------------------------------------------------------------
	 * <geo-sim-lab metodos="mag,res" inicial="res" controls>
	 * ---------------------------------------------------------------- */
	const PASS = ['theme', 'controls', 'labels', 'animate'];

	class GeoSimLab extends HTMLElement {
		static get observedAttributes() { return ['metodos', 'inicial', 'height', 'info'].concat(PASS); }

		constructor() {
			super();
			const root = this.attachShadow({ mode: 'open' });
			root.innerHTML = `<style>${BASE_CSS}${LAB_CSS}</style>
<div class="lab"><div class="nav" part="nav" role="group"></div><div class="main"><geo-sim part="sim"></geo-sim></div></div>`;
			this._nav = root.querySelector('.nav');
			this._sim = root.querySelector('geo-sim');
			this._nav.addEventListener('click', (e) => {
				const b = e.target.closest('.btn');
				if (b) this.metodo = b.dataset.method;
			});
			this._nav.addEventListener('keydown', (e) => {
				if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) === -1) return;
				const btns = Array.from(this._nav.querySelectorAll('.btn'));
				const i = btns.indexOf(root.activeElement);
				if (i === -1) return;
				e.preventDefault();
				const next = btns[(i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length];
				next.focus();
				this.metodo = next.dataset.method;
			});
		}

		connectedCallback() {
			this._render();
			this._offTexts = onTexts(() => this._render());
		}

		disconnectedCallback() { if (this._offTexts) this._offTexts(); }

		attributeChangedCallback(name, oldV) {
			if (this.isConnected && oldV !== undefined) this._render();
		}

		get metodo() { return this._current; }
		set metodo(key) {
			if (!METHODS[key] || (this._keys && this._keys.indexOf(key) === -1)) return;
			this._current = key;
			this._sim.setAttribute('metodo', key);
			this._nav.querySelectorAll('.btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.method === key)));
			this.dispatchEvent(new CustomEvent('geosim-method', { bubbles: true, composed: true, detail: { metodo: key } }));
		}

		/** Alias usado pelos cards. */
		select(key) { this.metodo = key; }

		_render() {
			this._keys = parseList(this.getAttribute('metodos'));
			this._nav.setAttribute('aria-label', TEXTS.ui.methods);
			this._nav.innerHTML = this._keys.map((k) => {
				const m = TEXTS.methods[k] || { name: k, unit: '' };
				return `<button type="button" class="btn" data-method="${k}" aria-pressed="false"><span>${esc(m.name)}</span><span class="unit">${esc(m.unit || '')}</span></button>`;
			}).join('');
			PASS.forEach((a) => {
				if (this.hasAttribute(a)) this._sim.setAttribute(a, this.getAttribute(a));
				else this._sim.removeAttribute(a);
			});
			this._sim.setAttribute('height', this.getAttribute('height') || 'auto');
			this._sim.setAttribute('info', flag(this, 'info', true) ? 'yes' : 'no');
			const start = this._current && this._keys.indexOf(this._current) > -1
				? this._current
				: (this._keys.indexOf(this.getAttribute('inicial')) > -1 ? this.getAttribute('inicial') : this._keys[0]);
			this.metodo = start;
		}
	}

	/* ------------------------------------------------------------------
	 * <geo-sim-cards metodos="..." alvo="id-do-lab" colunas="3">
	 * ---------------------------------------------------------------- */
	class GeoSimCards extends HTMLElement {
		static get observedAttributes() { return ['metodos', 'alvo', 'link', 'colunas', 'theme', 'animate', 'height']; }

		constructor() {
			super();
			const root = this.attachShadow({ mode: 'open' });
			root.innerHTML = `<style>${BASE_CSS}${CARDS_CSS}</style><div class="grid" part="grid"></div>`;
			this._grid = root.querySelector('.grid');
			this._grid.addEventListener('click', (e) => {
				const card = e.target.closest('[data-method]');
				const target = this.getAttribute('alvo');
				if (!card || !target) return;
				const lab = document.getElementById(target);
				if (lab && typeof lab.select === 'function') lab.select(card.dataset.method);
				else if (lab && lab.tagName === 'GEO-SIM') lab.setAttribute('metodo', card.dataset.method);
			});
		}

		connectedCallback() {
			this._render();
			this._offTexts = onTexts(() => this._render());
		}

		disconnectedCallback() { if (this._offTexts) this._offTexts(); }

		attributeChangedCallback(name, oldV) {
			if (this.isConnected && oldV !== undefined) this._render();
		}

		_render() {
			const keys = parseList(this.getAttribute('metodos'));
			const cols = clamp(parseInt(this.getAttribute('colunas'), 10) || 0, 0, 6);
			const target = this.getAttribute('alvo');
			const link = this.getAttribute('link');
			const href = target ? '#' + target : link || '';
			const h = clamp(parseInt(this.getAttribute('height'), 10) || 70, 40, 300);
			const pass = ['theme', 'animate'].filter((a) => this.hasAttribute(a)).map((a) => ` ${a}="${esc(this.getAttribute(a))}"`).join('');
			this._grid.classList.toggle('fixed', cols > 0);
			if (cols) this._grid.style.setProperty('--_cols', cols); else this._grid.style.removeProperty('--_cols');
			this._grid.innerHTML = keys.map((k) => {
				const m = TEXTS.methods[k] || { name: k, prop: '' };
				const tag = href ? 'a' : 'div';
				return `<${tag} class="card" data-method="${k}"${href ? ` href="${esc(href)}"` : ''}>
<geo-sim metodo="${k}" mini height="${h}"${pass} aria-hidden="true"></geo-sim><b>${esc(m.name)}</b><span>${esc(m.prop || '')}</span></${tag}>`;
			}).join('');
		}
	}

	/* ------------------------------------------------------------------
	 * <geo-sim-field height="560" readout interativo>conteúdo</geo-sim-field>
	 * ---------------------------------------------------------------- */
	class GeoSimField extends HTMLElement {
		static get observedAttributes() { return ['height', 'theme', 'readout', 'interativo', 'animate']; }

		constructor() {
			super();
			const root = this.attachShadow({ mode: 'open' });
			root.innerHTML = `<style>${BASE_CSS}${FIELD_CSS}</style>
<canvas part="canvas" aria-hidden="true"></canvas>
<div class="overlay" part="overlay"><slot></slot></div>
<div class="readout" part="readout" aria-hidden="true"><span>X <b data-r="x">0</b> m</span><span>Y <b data-r="y">0</b> m</span><span><b data-r="v">0 nT</b></span></div>`;
			this._canvas = root.querySelector('canvas');
			this._readout = root.querySelector('.readout');
			this._r = { x: root.querySelector('[data-r="x"]'), y: root.querySelector('[data-r="y"]'), v: root.querySelector('[data-r="v"]') };
			this._F = createFieldState();
			this._runner = new Runner(this, this._canvas, (S, t) => this._paint(S, t));
			this._onMove = (e) => {
				if (!flag(this, 'interativo', true)) return;
				const r = this._canvas.getBoundingClientRect();
				if (!r.width || !r.height) return;
				this._F.cur.tx = (e.clientX - r.left) / r.width;
				this._F.cur.ty = (e.clientY - r.top) / r.height;
				this._F.user = true;
				if (this._runner.still) this._runner.drawNow();
			};
			this._onLeave = () => { this._F.user = false; };
		}

		connectedCallback() {
			this._sync();
			this.addEventListener('pointermove', this._onMove);
			this.addEventListener('pointerleave', this._onLeave);
			this._runner.attach();
		}

		disconnectedCallback() {
			this.removeEventListener('pointermove', this._onMove);
			this.removeEventListener('pointerleave', this._onLeave);
			this._runner.detach();
		}

		attributeChangedCallback(name, oldV, newV) {
			if (oldV === newV || !this.isConnected) return;
			if (name === 'theme') { this._runner.refreshColors(); return; }
			this._sync();
			this._runner.drawNow();
		}

		_sync() {
			const h = clamp(parseInt(this.getAttribute('height'), 10) || 520, 160, 1400);
			this.style.setProperty('--_h', h + 'px');
			this._readout.hidden = !flag(this, 'readout', true);
			this._runner.opts.animate = flag(this, 'animate', true);
		}

		_paint(S, t) {
			S.labels = true;
			drawField(S, t, this._F);
			if (!this._readout.hidden) {
				const v = this._F.value;
				this._r.x.textContent = Math.round(this._F.cur.x * 2400);
				this._r.y.textContent = Math.round((1 - this._F.cur.y) * 1200);
				this._r.v.textContent = `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v))} nT`;
			}
		}
	}

	define('geo-sim', GeoSim);
	define('geo-sim-lab', GeoSimLab);
	define('geo-sim-cards', GeoSimCards);
	define('geo-sim-field', GeoSimField);
}
