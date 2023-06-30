class TextUtils {
  /**
   * Joins a list of strings with a comma, keeping the oxford comma and adding "and" as appropriate.
   * Eg.
   * One
   * One and Two
   * One, Two, and Three
   * @param items The items to join in a list
   * @param conjunction Conjunction to use between the last two items
   */
  static join(items: string[] | null, conjunction = 'and'): string {
    if (items == null || items.length === 0) {
      return '';
    }

    if (items.length === 1) {
      return items[0];
    }

    if (items.length === 2) {
      return `${items[0]} ${conjunction} ${items[1]}`;
    }

    const itemText = items.slice(0, items.length - 1).join(', ');
    const lastItem = items[items.length - 1];
    return `${itemText}, ${conjunction} ${lastItem}`;
  }

  /**
   * Converts text to lower case, handling null if necessary and returning an empty string
   * @param text The text to convert to lower case
   * @param isNullAllowed True if a null string should return an empty string from this function. If false an error is thrown if null is passed in.
   */
  static toLower(text: string | null, isNullAllowed = true): string {
    if (text == null) {
      if (isNullAllowed) {
        return '';
      }

      throw new Error('Null string passed in to TextUtils.toLower');
    }

    return text.toLowerCase();
  }

  /**
   *
   * @param a The string to sort
   * @param b Second string to sort
   * @param isAscending Whether to sort ascending or descending
   */
  static sort(a: string, b: string, isAscending = true): number {
    if (a < b) {
      return isAscending ? -1 : 1;
    }
    if (a > b) {
      return isAscending ? 1 : -1;
    }
    return 0;
  }

  /**
   * Outdent (opposite of indent) a string so the lowest indent level is 0
   * Assumes each line is indented with the same characters (i.e. no mixed tabs/spaces)
   * @param code The code to outdent
   * @returns A code block where the minimum indent level of a line is 0
   */
  static outdentCode(code: string) {
    const lines = code.split('\n');
    const minIndent = lines.reduce((min, line) => {
      const indentLength = line.length - line.trimStart().length;
      if (indentLength === line.length) {
        return min;
      }
      return indentLength < min ? indentLength : min;
    }, Number.MAX_SAFE_INTEGER);
    return lines.map(line => line.slice(minIndent)).join('\n');
  }
}

export default TextUtils;
