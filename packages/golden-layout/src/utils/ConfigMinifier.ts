import type { Config } from '../config/Config.js';

/**
 * Minifies and unminifies configs by replacing frequent keys
 * and values with one letter substitutes. Config options must
 * retain array position/index, add new options at the end.
 */
class ConfigMinifier {
  private static _keys = [
    'settings',
    'hasHeaders',
    'constrainDragToContainer',
    'selectionEnabled',
    'dimensions',
    'borderWidth',
    'minItemHeight',
    'minItemWidth',
    'headerHeight',
    'dragProxyWidth',
    'dragProxyHeight',
    'labels',
    'close',
    'maximise',
    'minimise',
    'popout',
    'content',
    'componentName',
    'componentState',
    'id',
    'width',
    'type',
    'height',
    'isClosable',
    'title',
    'popoutWholeStack',
    'openPopouts',
    'parentId',
    'activeItemIndex',
    'reorderEnabled',
    'borderGrabWidth',

    //Maximum 36 entries, do not cross this line!
  ];

  private static _values = [
    true,
    false,
    'row',
    'column',
    'stack',
    'component',
    'close',
    'maximise',
    'minimise',
    'open in new window',
  ];

  constructor() {
    if (ConfigMinifier._keys.length > 36) {
      throw new Error('Too many keys in config minifier map');
    }
  }

  /**
   * Takes a GoldenLayout configuration object and
   * replaces its keys and values recursively with
   * one letter counterparts
   *
   * @param config A GoldenLayout config object
   *
   * @returns minified config
   */
  minifyConfig(config: Partial<Config>) {
    const min = {};
    this._nextLevel(config, min, '_min');
    return min;
  }

  /**
   * Takes a configuration Object that was previously minified
   * using minifyConfig and returns its original version
   *
   * @param minifiedConfig
   *
   * @returns the original configuration
   */
  unminifyConfig(minifiedConfig: Record<string, unknown>): Config {
    const orig = {};
    this._nextLevel(minifiedConfig, orig, '_max');
    return orig as Config;
  }

  /**
   * Recursive function, called for every level of the config structure
   *
   * @param orig
   * @param min
   * @param translationFn
   */
  _nextLevel(
    from: unknown[] | Record<string, unknown>,
    to: unknown[] | Record<string, unknown>,
    translationFn: '_min' | '_max'
  ) {
    for (let key in from) {
      /**
       * In case something has extended Object prototypes
       */
      if (!from.hasOwnProperty(key)) continue;

      const fromItem = Array.isArray(from)
        ? from[Number.parseInt(key, 10)]
        : from[key];
      /**
       * For Arrays and Objects, create a new Array/Object
       * on the minified object and recurse into it
       */
      if (typeof fromItem === 'object' && fromItem != null) {
        const toItem = fromItem instanceof Array ? [] : {};

        if (Array.isArray(to)) {
          to[Number.parseInt(key, 10)] = toItem;
        } else {
          const minKey = this[translationFn](key, ConfigMinifier._keys);
          to[minKey] = toItem;
        }

        this._nextLevel(
          fromItem as Record<string, unknown>,
          toItem,
          translationFn
        );

        /**
         * For primitive values (Strings, Numbers, Boolean etc.)
         * minify the value
         */
      } else {
        const toItem = this[translationFn](fromItem, ConfigMinifier._values);

        if (Array.isArray(to)) {
          to[Number.parseInt(key, 10)] = toItem;
        } else {
          const minKey = this[translationFn](key, ConfigMinifier._keys);
          to[minKey] = toItem;
        }
      }
    }
  }

  /**
   * Minifies value based on a dictionary
   *
   * @param   {String|Boolean} value
   * @param   {Array<String|Boolean>} dictionary
   *
   * @returns {String} The minified version
   */
  _min<T>(value: T, dictionary: T[]): T | string {
    /**
     * If a value actually is a single character, prefix it
     * with ___ to avoid mistaking it for a minification code
     */
    if (typeof value === 'string' && value.length === 1) {
      return '___' + value;
    }

    var index = dictionary.indexOf(value);

    /**
     * value not found in the dictionary, return it unmodified
     */
    if (index === -1) {
      return value;

      /**
       * value found in dictionary, return its base36 counterpart
       */
    } else {
      return index.toString(36);
    }
  }

  _max<T>(value: T, dictionary: T[]): T | string {
    /**
     * value is a single character. Assume that it's a translation
     * and return the original value from the dictionary
     */
    if (typeof value === 'string' && value.length === 1) {
      return dictionary[parseInt(value, 36)];
    }

    /**
     * value originally was a single character and was prefixed with ___
     * to avoid mistaking it for a translation. Remove the prefix
     * and return the original character
     */
    if (typeof value === 'string' && value.substr(0, 3) === '___') {
      return value[3];
    }
    /**
     * value was not minified
     */
    return value;
  }
}

export default ConfigMinifier;
