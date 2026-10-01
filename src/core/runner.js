import { readColors } from './draw.js';

const hasWindow = typeof window !== 'undefined';
const mqReduce = hasWindow && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const mqDark = hasWindow && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const live = new Set();

function listen(mq, fn) {
	if (!mq) return;
	if (mq.addEventListener) mq.addEventListener('change', fn);
	else if (mq.addListener) mq.addListener(fn);
}
listen(mqDark, () => live.forEach((r) => r.refreshColors()));
listen(mqReduce, () => live.forEach((r) => r.start()));

export const prefersReducedMotion = () => !!(mqReduce && mqReduce.matches);
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * Cuida de um <canvas>: densidade de pixels, redimensionamento,
 * pausa fora da tela e quadro estático com "reduzir movimento".
 */
export class Runner {
	constructor(host, canvas, paint, opts = {}) {
		this.host = host;
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.paint = paint;
		this.opts = Object.assign({ animate: true, autoHeight: false }, opts);
		this.S = { ctx: this.ctx, w: 0, h: 0, C: null, still: false };
		this.visible = false;
		this.running = false;
		this.t0 = now();
		this._loop = this._loop.bind(this);
	}

	attach() {
		live.add(this);
		this.S.C = readColors(this.host);
		this.fit();
		if ('ResizeObserver' in window) {
			this.ro = new ResizeObserver(() => { this.fit(); this.drawNow(); });
			this.ro.observe(this.canvas);
		} else {
			this._onResize = () => { this.fit(); this.drawNow(); };
			window.addEventListener('resize', this._onResize);
		}
		if ('IntersectionObserver' in window) {
			this.io = new IntersectionObserver((entries) => {
				entries.forEach((e) => { this.visible = e.isIntersecting; if (this.visible) this.start(); });
			}, { rootMargin: '80px' });
			this.io.observe(this.host);
		} else {
			this.visible = true;
			this.start();
		}
	}

	detach() {
		live.delete(this);
		if (this.ro) this.ro.disconnect();
		if (this.io) this.io.disconnect();
		if (this._onResize) window.removeEventListener('resize', this._onResize);
		this.visible = false;
		this.running = false;
	}

	get still() {
		return prefersReducedMotion() || this.opts.animate === false;
	}

	fit() {
		const cv = this.canvas;
		const w = cv.clientWidth;
		if (!w) return;
		if (this.opts.autoHeight) {
			const target = Math.round(Math.max(260, Math.min(430, w * 0.56))) + 'px';
			if (cv.style.height !== target) cv.style.height = target;
		}
		const h = cv.clientHeight || 300;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
		if (cv.width !== W) cv.width = W;
		if (cv.height !== H) cv.height = H;
		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		this.S.w = w;
		this.S.h = h;
	}

	draw(t) {
		if (!this.S.w || !this.S.h) return;
		if (!this.S.C) this.S.C = readColors(this.host);
		this.S.still = this.still;
		this.paint(this.S, this.S.still ? 0 : t);
	}

	drawNow() {
		this.draw((now() - this.t0) / 1000);
	}

	restart() {
		this.t0 = now();
		this.drawNow();
		this.start();
	}

	start() {
		if (!this.visible) return;
		if (this.still) { this.drawNow(); return; }
		if (this.running) return;
		this.running = true;
		requestAnimationFrame(this._loop);
	}

	_loop(ts) {
		if (!this.visible || this.still) { this.running = false; this.drawNow(); return; }
		this.draw((ts - this.t0) / 1000);
		requestAnimationFrame(this._loop);
	}

	refreshColors() {
		this.S.C = readColors(this.host);
		this.drawNow();
	}
}
