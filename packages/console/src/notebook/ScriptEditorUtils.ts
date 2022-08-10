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
}

export default ScriptEditorUtils;
