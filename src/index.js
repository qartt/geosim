/*!
 * GeoSim — simulações geofísicas didáticas em Canvas 2D, sem dependências.
 * https://github.com/qartt/geosim · MIT
 */
import { METHODS, registerMethod, defaultParams } from './methods/index.js';
import { TEXTS, setTexts } from './core/texts.js';
import { cmap, rgba, txt, ground, dot, plot, ricker } from './core/draw.js';
import { defineElements } from './elements/index.js';

export const version = '1.0.0';

// Configuração antecipada (ex.: textos traduzidos vindos do WordPress):
// <script>window.GeoSimConfig = { texts: { ... } }</script> antes do bundle.
if (typeof window !== 'undefined' && window.GeoSimConfig && window.GeoSimConfig.texts) {
	setTexts(window.GeoSimConfig.texts);
}

defineElements();

/** Utilitários de desenho para quem for criar métodos novos. */
export const draw = { cmap, rgba, txt, ground, dot, plot, ricker };

export { METHODS, registerMethod, defaultParams, TEXTS, setTexts, defineElements };
