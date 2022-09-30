class ConfigurationError extends Error {
  node: unknown;

  constructor(message: string, node?: unknown) {
    super();

    this.name = 'Configuration Error';
    this.message = message;
    this.node = node;
  }
}

export default ConfigurationError;
