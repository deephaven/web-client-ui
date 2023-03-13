/* eslint-disable import/prefer-default-export */
export function DEFAULT_GET_PREFERRED_REPLACEMENT_STRING(
  value: string,
  replaceIndex: number,
  newChar: string
): string {
  return (
    value.substring(0, replaceIndex) +
    newChar +
    value.substring(replaceIndex + 1)
  );
}
