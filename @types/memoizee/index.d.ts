declare namespace memoizee {
  interface Options<F extends (...args: unknown[]) => unknown> {
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

declare function memoizee<F extends (...args: unknown[]) => unknown>(
  f: F,
  options?: memoizee.Options<F>
): F & memoizee.Memoized<F>;

export = memoizee;
