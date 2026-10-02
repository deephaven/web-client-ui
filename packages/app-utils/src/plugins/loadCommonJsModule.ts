import { createRequires } from '@paciolan/remote-module-loader';
import { resolve } from './remote-component.config';

const requires = createRequires(resolve);

/**
 * Evaluate an already-fetched CommonJS plugin bundle. `require` calls resolve
 * against the host resolve map so the plugin shares the host's singletons.
 * @param source The CommonJS module source
 * @returns The module's exports
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadCommonJsModule(source: string): any {
  const module = { exports: {} };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  const evaluate = new Function('require', 'module', 'exports', source);
  evaluate(requires, module, module.exports);
  return module.exports;
}

export default loadCommonJsModule;
