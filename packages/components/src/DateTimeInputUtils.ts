/* eslint-disable import/prefer-default-export */
export function addSeparators(value: string): string {
  const dateTimeMillis = value.substring(0, 23);
  const micros = value.substring(23, 26);
  const nanos = value.substring(26);
  return [dateTimeMillis, micros, nanos].filter(v => v !== '').join('\u200B');
}
