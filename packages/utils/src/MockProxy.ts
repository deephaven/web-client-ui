const defaultPropsSymbol: unique symbol = Symbol('mockProxyDefaultProps');
const overridesSymbol: unique symbol = Symbol('mockProxyOverrides');
const proxiesSymbol: unique symbol = Symbol('mockProxyProxies');

export const MockProxySymbol = {
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
  [MockProxySymbol.defaultProps]: typeof mockProxyDefaultProps;
  [MockProxySymbol.overrides]: Partial<T>;
  [MockProxySymbol.proxies]: Record<keyof T, jest.Mock>;
}

/**
 * Creates a mock object for a type `T` using a Proxy object. Each prop can
 * optionally be set via the constructor. Any prop that is not set will be set
 * to a jest.fn() instance on first access with the exeption of "then" which
 * will not be automatically proxied.
 * @param overrides Optional props to explicitly set on the Proxy.
 * @returns
 */
export default function createMockProxy<T>(
  overrides: Partial<T> = {}
): T & MockProxyTarget<T> {
  const targetDef: MockProxyTarget<T> = {
    [MockProxySymbol.defaultProps]: mockProxyDefaultProps,
    [MockProxySymbol.overrides]: overrides,
    [MockProxySymbol.proxies]: {} as Record<keyof T, jest.Mock>,
  };

  return new Proxy(targetDef, {
    get(target, name) {
      if (name === Symbol.toStringTag) {
        return 'Mock Proxy';
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
  }) as T & typeof targetDef;
}
