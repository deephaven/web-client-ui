export declare type EqualityFn<P> = (newArgs: P, lastArgs: P) => boolean;

// eslint-disable-next-line @typescript-eslint/ban-types
declare function memoizeOne<ResultFn extends Function>(
  resultFn: ResultFn,
  isEqual?: EqualityFn<Parameters<ResultFn>>
): ResultFn;

export default memoizeOne;
