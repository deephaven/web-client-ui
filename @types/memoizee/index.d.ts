declare namespace memoizee {
  // eslint-disable-next-line @typescript-eslint/ban-types
  interface Options<F extends Function> {
    length?: number | false | undefined;
    maxAge?: number | undefined;
    max?: number | undefined;
    preFetch?: number | true | undefined;
    promise?: boolean | 'then' | 'done' | 'done:finally' | undefined;
    dispose?(value: unknown): void;
    async?: boolean | undefined;
    primitive?: boolean | undefined;
    normalizer?(args: Parameters<F>): string;
    resolvers?: Array<(arg: unknown) => unknown> | undefined;
  }

  interface Memoized<F> {
    delete: F;
    clear: F & (() => void);
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
declare function memoizee<F extends Function>(
  f: F,
  options?: memoizee.Options<F>
): F & memoizee.Memoized<F>;

export = memoizee;
