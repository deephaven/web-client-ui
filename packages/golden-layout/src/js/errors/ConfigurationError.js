const ConfigurationError = function (message, node) {
  Error.call(this);

  this.name = 'Configuration Error';
  this.message = message;
  this.node = node;
};

ConfigurationError.prototype = new Error();

export default ConfigurationError;
