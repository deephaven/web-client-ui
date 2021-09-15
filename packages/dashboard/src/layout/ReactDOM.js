/** Shim for using ReactDOM in frameworks included by react (such as golden-layout) */
import React from 'react';
import ReactDOM from 'react-dom';

window.React = React;
window.ReactDOM = ReactDOM;
