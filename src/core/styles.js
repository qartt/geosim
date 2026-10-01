/**
 * Estilos dos componentes. As variáveis públicas --gs-* podem ser definidas
 * em qualquer ancestral; as internas --_* aplicam os padrões de cada tema.
 */
const DARK = `
	--_bg: var(--gs-bg, #0e2236);
	--_bg2: var(--gs-bg2, #14304a);
	--_fg: var(--gs-fg, #eaf2f7);
	--_muted: var(--gs-muted, #9cb2c5);
	--_accent: var(--gs-accent, #73f02c);
	--_accent2: var(--gs-accent2, #5bd6b0);
	--_sky: var(--gs-sky, #5b8fd0);
	--_line: var(--gs-line, rgba(150, 190, 220, .18));
	color-scheme: dark;`;

const LIGHT = `
	--_bg: var(--gs-bg, #f2f6f9);
	--_bg2: var(--gs-bg2, #e5edf3);
	--_fg: var(--gs-fg, #0f263c);
	--_muted: var(--gs-muted, #4e6578);
	--_accent: var(--gs-accent, #2c9a12);
	--_accent2: var(--gs-accent2, #13807a);
	--_sky: var(--gs-sky, #2f6aa8);
	--_line: var(--gs-line, rgba(16, 45, 72, .14));
	color-scheme: light;`;

export const BASE_CSS = `
:host {
	${DARK}
	--_radius: var(--gs-radius, 14px);
	--_mono: var(--gs-mono, ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace);
	display: block;
	position: relative;
	box-sizing: border-box;
	background: var(--_bg);
	color: var(--_fg);
	border-radius: var(--_radius);
	overflow: hidden;
	line-height: 1.5;
	font-family: var(--gs-font, inherit);
}
:host([theme="light"]) { ${LIGHT} }
@media (prefers-color-scheme: light) {
	:host(:not([theme="dark"])) { ${LIGHT} }
}
:host([hidden]) { display: none; }
*, *::before, *::after { box-sizing: border-box; }
canvas { display: block; width: 100%; }
:focus-visible { outline: 2px solid var(--_accent); outline-offset: 2px; }
`;

export const SIM_CSS = `
.controls {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 12px 24px;
	padding: 16px 20px;
	border-top: 1px solid var(--_line);
}
.controls[hidden], .info[hidden] { display: none; }
.ctl { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; font-size: .85rem; color: var(--_muted); }
.ctl input { grid-column: 1 / -1; width: 100%; accent-color: var(--_accent); margin: 0; }
.ctl output { font-family: var(--_mono); color: var(--_fg); font-size: .8rem; font-variant-numeric: tabular-nums; }
.reset {
	justify-self: start;
	align-self: end;
	font: inherit;
	font-size: .85rem;
	color: var(--_fg);
	background: transparent;
	border: 1px solid var(--_line);
	border-radius: 999px;
	padding: 6px 14px;
	cursor: pointer;
}
.reset:hover { border-color: var(--_fg); }
.info { border-top: 1px solid var(--_line); padding: 18px 20px 20px; display: grid; gap: 12px; }
.info__head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 16px; }
.info__name { font-size: 1.15rem; font-weight: 700; }
.info__meta { color: var(--_muted); font-size: .85rem; }
.info dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px 20px; margin: 0; }
.info dt { color: var(--_muted); font-size: .78rem; }
.info dd { margin: 2px 0 0; font-weight: 600; font-size: .95rem; }
.info p { margin: 0; color: var(--_muted); max-width: 70ch; font-size: .95rem; }
`;

export const LAB_CSS = `
.lab { display: grid; grid-template-columns: minmax(200px, 250px) 1fr; }
.nav { display: flex; flex-direction: column; gap: 2px; padding: 12px; border-right: 1px solid var(--_line); background: var(--_bg2); }
.btn {
	all: unset;
	box-sizing: border-box;
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 10px;
	padding: 11px 12px;
	border-radius: calc(var(--_radius) * .6);
	color: var(--_muted);
	cursor: pointer;
	font-size: .95rem;
	transition: background .2s, color .2s;
}
.btn:hover { color: var(--_fg); background: var(--_line); }
.btn[aria-pressed="true"] { color: var(--_fg); background: var(--_bg); box-shadow: inset 3px 0 0 var(--_accent); }
.btn:focus-visible { outline: 2px solid var(--_accent); }
.unit { font-family: var(--_mono); font-size: .75rem; opacity: .8; white-space: nowrap; }
.main { min-width: 0; }
.main geo-sim { border-radius: 0; background: transparent; }
@media (max-width: 760px) {
	.lab { grid-template-columns: 1fr; }
	.nav { flex-direction: row; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--_line); padding: 8px; }
	.btn { flex: 0 0 auto; }
	.btn[aria-pressed="true"] { box-shadow: inset 0 -3px 0 var(--_accent); }
}
`;

export const CARDS_CSS = `
:host { background: var(--_line); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 1px; }
.grid.fixed { grid-template-columns: repeat(var(--_cols, 3), minmax(0, 1fr)); }
@media (max-width: 760px) { .grid.fixed { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.card { display: grid; gap: 4px; padding: 16px; background: var(--_bg); color: var(--_fg); text-decoration: none; transition: background .2s; }
a.card:hover { background: var(--_bg2); }
.card geo-sim { border-radius: 0; background: transparent; margin-bottom: 8px; }
.card b { font-size: 1rem; }
.card span { color: var(--_muted); font-size: .85rem; }
`;

export const FIELD_CSS = `
:host { min-height: var(--_h, 520px); display: flex; align-items: center; }
canvas { position: absolute; inset: 0; height: 100%; }
.overlay { position: relative; z-index: 2; width: 100%; max-width: 760px; padding: clamp(28px, 6vw, 72px) clamp(20px, 5vw, 64px); pointer-events: none; }
::slotted(*) { pointer-events: auto; }
.readout {
	position: absolute; z-index: 3; right: 14px; bottom: 12px;
	display: flex; gap: 14px; padding: 6px 12px; border-radius: 999px;
	background: color-mix(in srgb, var(--_bg) 75%, transparent);
	border: 1px solid var(--_line);
	font-family: var(--_mono); font-size: .75rem; color: var(--_muted);
	pointer-events: none;
	-webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
}
.readout[hidden] { display: none; }
.readout b { color: var(--_fg); font-weight: 600; font-variant-numeric: tabular-nums; }
@media (max-width: 520px) { .readout { left: 12px; right: 12px; justify-content: center; } }
`;
