export declare type EqualityFn = (newArgs: any[], lastArgs: any[]) => boolean;

declare function memoizeOne<
  ResultFn extends (this: any, ...newArgs: never[]) => ReturnType<ResultFn>
>(resultFn: ResultFn, isEqual?: EqualityFn): ResultFn;

export default memoizeOne;
