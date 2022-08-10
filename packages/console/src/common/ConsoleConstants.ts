class ConsoleConstants {
  /**
   * Map of language keys to their display names
   */
  static get LANGUAGE_MAP(): Map<string, string> {
    return new Map([
      ['python', 'Python'],
      ['groovy', 'Groovy'],
      ['scala', 'Scala'],
    ]);
  }
}

export default ConsoleConstants;
