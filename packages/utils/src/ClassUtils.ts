export type MethodName<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

/**
 * Bind all methods on the instance + its prototype to the instance. If
 * `traversePrototypeChain` is true, the prototype chain will be traversed until
 * Object.prototype is reached, and any additional methods found will be included.
 * @param instance The instance to bind methods to
 * @param traversePrototypeChain Whether to traverse the prototype chain or not
 */
export function bindAllMethods(
  instance: object,
  traversePrototypeChain = false
): void {
  const methodNames = getAllMethodNames(instance, traversePrototypeChain);

  methodNames.forEach(methodName => {
    // eslint-disable-next-line no-param-reassign
    (instance as Record<string, unknown>)[methodName] = (
      instance[methodName] as (...args: unknown[]) => unknown
    ).bind(instance);
  });
}

/**
 * Get all class method names. This will return names of all methods defined on
 * the instance + its prototype. If `traversePrototypeChain` is true, the prototype
 * chain will be traversed until Object.prototype is reached, and any additional
 * methods found will be included.
 * @param instance Instance to get method names from
 * @param traversePrototypeChain Whether to traverse the prototype chain or not
 */
export function getAllMethodNames<T>(
  instance: T,
  traversePrototypeChain: boolean
): MethodName<T>[] {
  const methodNames = new Set<MethodName<T>>();

  let current = instance;

  // Get method names for instance + prototype. Optionally traverse prototype
  // chain until Object.prototype is reached.
  let level = 0;
  while (
    current != null &&
    current !== Object.prototype &&
    (level <= 1 || traversePrototypeChain)
  ) {
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
    level += 1;
  }

  return [...methodNames.keys()];
}
