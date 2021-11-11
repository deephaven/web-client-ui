class ConsoleConstants {
  /**
   * Map of language keys to their display names
   */
  static get LANGUAGE_MAP(): Map<string, string> {
    try {
      return new Map(
        process.env.REACT_APP_SESSION_LANGUAGES?.split(',')
          .map(str => str.split('='))
          .map(([language, displayName]) => [language, displayName ?? language])
      );
    } catch {
      return new Map<never, never>();
    }
  }
}

export default ConsoleConstants;
