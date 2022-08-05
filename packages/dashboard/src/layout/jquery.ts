/** Shim for using jquery in frameworks included by react (such as golden-layout) */
import $ from 'jquery';

window.$ = $;
window.jQuery = $;
