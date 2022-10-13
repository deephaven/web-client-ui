/**
 * The karma tests are written with 3 global variables expected: GoldenLayout, lm, and $
 * To compile ESM, we use a browserify preprocessor with esmify
 *
 * Unfortunately, the tsify plugin to handle TS does not support TS 3+ at least,
 * so instead the TS is built pretest and then this helper imports the JS ESM.
 * Browserify w/ esmify can handle this setup
 */
import $ from 'jquery';
import GoldenLayout from '../dist/index.js';
import lm from '../dist/base.js';

window.GoldenLayout = GoldenLayout;
window.lm = lm;
window.$ = $;
