export const SILENT = -1;
export const ERROR = 0;
export const WARN = 1;
export const INFO = 2;
export const DEBUG = 3;
export const DEBUG2 = 4;

export default Object.freeze({
  SILENT,
  ERROR,
  WARN,
  INFO,
  DEBUG,
  DEBUG2,
} as Record<string, number>);
