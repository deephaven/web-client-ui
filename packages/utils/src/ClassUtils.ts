export type MethodName<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

/**
 * Bind all methods in the prototype chain to the instance (excluding those
 * defined on Object.prototype)
 * @param instance The instance to bind methods to
 */
export function bindAllMethods<T>(instance: T) {
  const methodNames = getAllMethodNames(instance);

  methodNames.forEach(methodName => {
    // eslint-disable-next-line no-param-reassign
    instance[methodName] = (
      instance[methodName] as (...args: unknown[]) => unknown
    ).bind(instance) as T[typeof methodName];
  });
}

/**
 * Get all class method names. This will return names of all methods defined in
 * an object's prototype chain exlcluding those defined on Object.prototype.
 * @param instance
 */
export function getAllMethodNames<T>(instance: T): MethodName<T>[] {
  const methodNames = new Set<MethodName<T>>();

  let current = instance;

  // Traverse the prototype chain until we get to Object.prototype
  while (current != null && current !== Object.prototype) {
    // eslint-disable-next-line no-restricted-syntax
    for (const name of Object.getOwnPropertyNames(current)) {
      if (
        name !== 'constructor' &&
        typeof current[name as keyof typeof current] === 'function'
      ) {
        methodNames.add(name as MethodName<T>);
      }
    }

    current = Object.getPrototypeOf(current);
  }

  return [...methodNames.keys()].sort();
}
