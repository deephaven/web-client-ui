export default class BubblingEvent {
  name: string;

  origin: unknown;

  isPropagationStopped: boolean;

  constructor(name: string, origin: unknown) {
    this.name = name;
    this.origin = origin;
    this.isPropagationStopped = false;
  }

  stopPropagation() {
    this.isPropagationStopped = true;
  }
}
