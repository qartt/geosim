import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';

const common = { entryPoints: ['src/index.js'], bundle: true, target: ['es2019'], legalComments: 'inline' };

await build({ ...common, format: 'esm', outfile: 'dist/geosim.esm.js' });
await build({ ...common, format: 'iife', globalName: 'GeoSim', outfile: 'dist/geosim.js' });
await build({ ...common, format: 'iife', globalName: 'GeoSim', minify: true, outfile: 'dist/geosim.min.js' });

// cópias para a demo (GitHub Pages) e para o plugin WordPress
mkdirSync('docs', { recursive: true });
copyFileSync('dist/geosim.min.js', 'docs/geosim.min.js');
mkdirSync('wordpress/qartt-geosim/assets/js', { recursive: true });
copyFileSync('dist/geosim.min.js', 'wordpress/qartt-geosim/assets/js/geosim.min.js');

console.log('build ok');
