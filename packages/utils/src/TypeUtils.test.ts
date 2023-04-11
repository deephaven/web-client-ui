import { ValueOf } from './TypeUtils';

describe('ValueOf', () => {
  it('should derive the value type', () => {
    const x = { a: 1, b: 2, c: 3 } as const;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const y: ValueOf<typeof x>[] = [1, 2, 3];

    // No assertion since this is a types only test
  });
});
