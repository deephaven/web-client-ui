const LANGUAGES = {
  groovy: 'Groovy',
  python: 'Python',
  scala: 'Scala',
} as const;

class ScriptEditorUtils {
  /** Get PQ script language from Monaco language
   * @paramlanguage Monaco language
   * @returns PQ script language
   */
  static normalizeScriptLanguage(language: keyof typeof LANGUAGES): string {
    return LANGUAGES[language] || null;
  }

  /**
   * Get a tooltip for disabled button based on the session status and language
   * @param isSessionConnected True if console session connected
   * @param isLanguageMatching True if the script language is matching the session language
   * @param scriptLanguageLabel Language label to use in the tooltip message
   * @param buttonLabel Button label to use in the tooltip message
   * @returns Tooltip message or `null` if the session is connected and language is matching
   */
  static getDisabledRunTooltip(
    isSessionConnected: boolean,
    isLanguageMatching: boolean,
    scriptLanguageLabel: string,
    buttonLabel: string
  ): string | null {
    if (!isSessionConnected) {
      return `Console session not connected – ${buttonLabel} disabled`;
    }
    if (!isLanguageMatching) {
      return `${scriptLanguageLabel} doesn't match the session language – ${buttonLabel} disabled`;
    }
    return null;
  }

  /**
   * Outdent (opposite of indent) a string so the lowest indent level is 0
   * Assumes each line is indented with the same characters (i.e. no mixed tabs/spaces)
   * @param code The code to outdent
   * @returns A code block where the minimum indent level of a line is 0
   */
  static outdentCode(code: string): string {
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

export default ScriptEditorUtils;
