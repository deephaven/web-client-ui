const labelSymbol: unique symbol = Symbol('mockProxyType');
const defaultPropsSymbol: unique symbol = Symbol('mockProxyDefaultProps');
const overridesSymbol: unique symbol = Symbol('mockProxyOverrides');
const proxiesSymbol: unique symbol = Symbol('mockProxyProxies');

export const MockProxySymbol = {
  labelSymbol,
  defaultProps: defaultPropsSymbol,
  overrides: overridesSymbol,
  proxies: proxiesSymbol,
} as const;

// Set default values on certain properties so they don't get automatically
// proxied as jest.fn() instances.
const mockProxyDefaultProps = {
  // `Symbol.iterator` - returning a jest.fn() throws a TypeError
  // `then` - avoid issues with `await` treating object as "thenable"
  [Symbol.iterator]: undefined,
  then: undefined,
  // Jest makes calls to `asymmetricMatch`, `hasAttribute`, `nodeType`
  // `tagName`, and `toJSON`. react-test-renderer checks `ref`
  asymmetricMatch: undefined,
  ref: undefined,
  hasAttribute: undefined,
  nodeType: undefined,
  tagName: undefined,
  toJSON: undefined,
};

/**
 * The proxy target contains state + configuration for the proxy
 */
export interface MockProxyTarget<T> {
  [MockProxySymbol.labelSymbol]: string;
  [MockProxySymbol.defaultProps]: typeof mockProxyDefaultProps;
  [MockProxySymbol.overrides]: Partial<T>;
  [MockProxySymbol.proxies]: Record<keyof T, jest.Mock>;
}

export interface MockProxyConfig {
  // Optional label to be assigned to the proxy object's
  // `MockProxySymbol.labelSymbol` property.
  label?: string;

  // `ownKeys` has no way to know all of the potential auto proxy keys, but it
  // can know auto proxies that have been called / cached. If this flag is true,
  // include those in the `ownKeys` result. This is mostly useful for spread
  // operations. Alternatively, the `overrides` are can explicitly include any
  // proxies to be included in the `ownKeys` result without setting this flag.
  // e.g. createMockProxy({ someMethod: jest.fn() }) would include `someMethod`.
  includeAutoProxiesInOwnKeys?: boolean;
}

/**
 * Creates a mock object for a type `T` using a Proxy object. Each prop can
 * optionally be set via the constructor. Any prop that is not set will be set
 * to a jest.fn() instance on first access with the exeption of "then" which
 * will not be automatically proxied.
 * @param overrides Optional props to explicitly set on the Proxy.
 * @param config Optional configuration for the proxy.
 * @returns A mock Proxy object for type `T`.
 */
export default function createMockProxy<T>(
  overrides: Partial<T> = {},
  {
    label = 'Mock Proxy',
    includeAutoProxiesInOwnKeys = false,
  }: MockProxyConfig = {}
): T & MockProxyTarget<T> {
  const targetDef: MockProxyTarget<T> = {
    [MockProxySymbol.labelSymbol]: label,
    [MockProxySymbol.defaultProps]: mockProxyDefaultProps,
    [MockProxySymbol.overrides]: overrides,
    [MockProxySymbol.proxies]: {} as Record<keyof T, jest.Mock>,
  };

  return new Proxy(targetDef, {
    get(target, name) {
      if (name === Symbol.toStringTag || name === MockProxySymbol.labelSymbol) {
        return targetDef[MockProxySymbol.labelSymbol];
      }

      // Reserved attributes for the proxy
      if (
        MockProxySymbol.defaultProps === name ||
        MockProxySymbol.overrides === name ||
        MockProxySymbol.proxies === name
      ) {
        return target[name as keyof typeof target];
      }

      // Properties that have been explicitly overriden
      if (name in target[MockProxySymbol.overrides]) {
        return target[MockProxySymbol.overrides][name as keyof Partial<T>];
      }

      // Properties that have defaults set
      if (name in target[MockProxySymbol.defaultProps]) {
        return target[MockProxySymbol.defaultProps][
          name as keyof typeof mockProxyDefaultProps
        ];
      }

      // Any other property access will create and cache a jest.fn() instance
      if (target[MockProxySymbol.proxies][name as keyof T] == null) {
        // eslint-disable-next-line no-param-reassign
        target[MockProxySymbol.proxies][name as keyof T] = jest
          .fn()
          .mockName(String(name));
      }

      return target[MockProxySymbol.proxies][name as keyof T];
    },
    // Only consider explicitly defined props as "in" the proxy
    has(target, name) {
      return name in target[MockProxySymbol.overrides];
    },
    // Needed to support the spread (...) operator
    getOwnPropertyDescriptor(_target, _prop) {
      return { configurable: true, enumerable: true };
    },
    // Needed to support the spread (...) operator
    ownKeys(target) {
      const autoProxyKeys = includeAutoProxiesInOwnKeys
        ? Reflect.ownKeys(target[MockProxySymbol.proxies])
        : [];

      const overridesKeys = Reflect.ownKeys(target[MockProxySymbol.overrides]);

      return [
        ...new Set<string | symbol>([
          MockProxySymbol.labelSymbol,
          ...autoProxyKeys,
          ...overridesKeys,
        ]),
      ];
    },
  }) as T & typeof targetDef;
}
