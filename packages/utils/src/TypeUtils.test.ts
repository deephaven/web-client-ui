import { type PartialBy, type ValueOf } from './TypeUtils';

describe('ValueOf', () => {
  it('should derive the value type', () => {
    const x = { a: 1, b: 2, c: 3 } as const;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const y: ValueOf<typeof x>[] = [1, 2, 3];

    // No assertion since this is a types only test
  });
});

describe('PartialBy', () => {
  it('should make only the given keys optional', () => {
    type A = { a: string; b: number; c: boolean };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const withoutB: PartialBy<A, 'b' | 'notAKey'> = { a: 'a', c: true };

    // @ts-expect-error `a` is still required
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const withoutA: PartialBy<A, 'b'> = { c: true };

    // No assertion since this is a types only test
  });
});
