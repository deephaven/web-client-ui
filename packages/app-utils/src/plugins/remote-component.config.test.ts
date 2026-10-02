import Log, * as LogModule from '@deephaven/log';
import { esmResolve, resolve } from './remote-component.config';

describe('remote-component.config', () => {
  it('keeps the default export for CommonJS require', () => {
    expect(resolve['@deephaven/log']).toBe(Log);
  });

  it('exposes the full module namespace for ES module imports', () => {
    const logModule = esmResolve['@deephaven/log'] as typeof LogModule;
    expect(logModule.default).toBe(Log);
    expect(logModule.Log).toBe(Log);
    expect(logModule.logInit).toBe(LogModule.logInit);
  });

  it('includes every CommonJS resolve entry', () => {
    expect(Object.keys(esmResolve).sort()).toEqual(Object.keys(resolve).sort());
  });
});
