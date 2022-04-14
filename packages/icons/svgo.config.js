export default {
  // multipass makes it run repeatedly on svg until it can't be squeezed smaller
  multipass: true,
  plugins: [
    'preset-default',
    {
      name: 'removeAttrs',
      params: {
        attrs: [
          'path:((?!d).)*',
          '*:fill',
          '*:aria.*',
          '*:class.*',
          '*:data.*',
        ],
      },
    },
    // force join of paths, won't work if source svgs have intersecting shapes
    // don't trust vscode svgs to be single path, so we force them into a single path
    { name: 'mergePaths', params: { force: true } },
    {
      name: 'addAttributesToSVGElement',
      params: { attributes: [{ fill: 'currentColor' }] },
    },
  ],
};
