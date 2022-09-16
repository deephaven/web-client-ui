const BubblingEvent = function (name, origin) {
  this.name = name;
  this.origin = origin;
  this.isPropagationStopped = false;
};

BubblingEvent.prototype.stopPropagation = function () {
  this.isPropagationStopped = true;
};

export default BubblingEvent;
