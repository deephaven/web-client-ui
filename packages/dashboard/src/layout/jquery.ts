/** Shim for using jquery in frameworks included by react (such as golden-layout) */
import * as $ from 'jquery';

window.$ = $;
window.jQuery = $;
