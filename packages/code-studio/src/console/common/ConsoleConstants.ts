class ConsoleConstants {
  /**
   * Map of language keys to their display names
   */
  static LANGUAGE_MAP = new Map(
    process.env.REACT_APP_SESSION_LANGUAGES?.split(',')
      .map(str => str.split('='))
      .map(([language, displayName]) => [language, displayName ?? language])
  );
}

export default ConsoleConstants;
