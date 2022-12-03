export declare type EqualityFn = (
  newArgs: unknown[],
  lastArgs: unknown[]
) => boolean;

// eslint-disable-next-line @typescript-eslint/ban-types
declare function memoizeOne<ResultFn extends Function>(
  resultFn: ResultFn,
  isEqual?: EqualityFn
): ResultFn;

export default memoizeOne;
