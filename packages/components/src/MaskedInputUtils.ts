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

/**
 * Fill the string on the right side with the example value to the given length
 * @param checkValue Initial string to pad
 * @param exampleValue Example value
 * @param length Target length
 * @returns String padded with the given example value
 */
export function fillToLength(
  checkValue: string,
  exampleValue: string,
  length: number
): string {
  return checkValue.length < length
    ? `${checkValue}${exampleValue.substring(checkValue.length, length)}`
    : checkValue;
}

/**
 * Trim all characters matching the empty mask on the right side of the given value
 * @param value String to trim
 * @param emptyMask Empty mask
 * @returns Trimmed string
 */
export function trimTrailingMask(value: string, emptyMask: string): string {
  let { length } = value;
  for (let i = value.length - 1; i >= 0; i -= 1) {
    if (emptyMask[i] === value[i]) {
      length = i;
    } else {
      break;
    }
  }
  return value.substring(0, length);
}
