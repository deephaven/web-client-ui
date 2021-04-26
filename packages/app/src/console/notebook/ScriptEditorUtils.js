const LANGUAGES = { groovy: 'Groovy', python: 'Python' };

class ScriptEditorUtils {
  /** Get PQ script language from Monaco language
   * @param {string} language Monaco language
   * @returns {string} PQ script language
   */
  static normalizeScriptLanguage(language) {
    return LANGUAGES[language] || null;
  }

  /**
   * Get a tooltip for disabled button based on the session status and language
   * @param {boolean} isSessionConnected True if console session connected
   * @param {boolean} isLanguageMatching True if the script language is matching the session language
   * @param {string} scriptLanguageLabel Language label to use in the tooltip message
   * @param {string} buttonLabel Button label to use in the tooltip message
   * @returns {string} Tooltip message or `null` if the session is connected and language is matching
   */
  static getDisabledRunTooltip(
    isSessionConnected,
    isLanguageMatching,
    scriptLanguageLabel,
    buttonLabel
  ) {
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
