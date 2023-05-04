import { getErrorMessage } from './ErrorUtils';

it.each([
  [undefined, undefined],
  [null, undefined],
  [new Error('test'), 'test'],
  [new Error(), undefined],
  [new Error(''), undefined],
  [new Error('0'), '0'],
  [new Error(' '), undefined],
  [new Error('foo'), 'foo'],
  [new Error('    bar    '), 'bar'],
  [new CustomEvent('test'), undefined],
  [new CustomEvent('test', { detail: 'foo' }), 'foo'],
  [new CustomEvent('test', { detail: 'bar' }), 'bar'],
  [new CustomEvent('test', { detail: new Error() }), undefined],
  [new CustomEvent('test', { detail: new Error(' ') }), undefined],
  [new CustomEvent('test', { detail: new Error('biz') }), 'biz'],
  [new CustomEvent('test', { detail: new Error('bang') }), 'bang'],
])(
  'return correct message for: %s',
  (error: unknown, expected: string | undefined) => {
    expect(getErrorMessage(error)).toEqual(expected);
  }
);
