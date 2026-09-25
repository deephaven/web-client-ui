import loadCommonJsModule from './loadCommonJsModule';
import { resolve } from './remote-component.config';

describe('loadCommonJsModule', () => {
  it('evaluates the source and returns module.exports', () => {
    expect(loadCommonJsModule('module.exports = { name: "plugin" };')).toEqual({
      name: 'plugin',
    });
  });

  it('supports assigning to exports directly', () => {
    expect(loadCommonJsModule('exports.foo = 1; exports.bar = 2;')).toEqual({
      foo: 1,
      bar: 2,
    });
  });

  it('resolves require calls against the host resolve map', () => {
    const result = loadCommonJsModule(
      'module.exports = require("react");'
    ) as unknown;
    expect(result).toBe(resolve.react);
  });

  it('throws for unknown requires', () => {
    expect(() =>
      loadCommonJsModule('module.exports = require("not-a-real-module");')
    ).toThrow(/Could not require 'not-a-real-module'/);
  });
});
