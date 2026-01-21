import LayoutManager from '../LayoutManager';
import type { Config, InputConfig } from '../config';

describe('Can minify and unminify configuration objects', () => {
  it('has minification methods', () => {
    expect(typeof LayoutManager.minifyConfig).toBe('function');
    expect(typeof LayoutManager.unminifyConfig).toBe('function');
  });

  it("doesn't manipulate the original config", () => {
    const minifiedTestConfig = LayoutManager.minifyConfig(
      testConfig as InputConfig
    );
    expect(typeof minifiedTestConfig).toBe('object');
    expect(minifiedTestConfig === testConfig).toBe(false);
  });

  it('minifies and unminifies the config directly', () => {
    const min = LayoutManager.minifyConfig(testConfig as InputConfig);
    const max = LayoutManager.unminifyConfig(min);

    expect(JSON.stringify(max)).toBe(JSON.stringify(testConfig));
  });

  it("doesn't change single character keys and values", () => {
    const conf = { a: 'some', thing: 'b' };
    const min = LayoutManager.minifyConfig(conf as unknown as Config);
    const max = LayoutManager.unminifyConfig(min);

    expect(JSON.stringify(max)).toBe(JSON.stringify(conf));
  });

  it('works with existing minified configurations', () => {
    // This minified config was created using:
    // var min = GoldenLayout.minifyConfig( allExistingKeysConfig() );
    // where allExistingKeysConfig() creates an object with each key mapping to itself
    const existingMinified = JSON.parse(
      '{"0":"settings","1":"hasHeaders","2":"constrainDragToContainer","3":"selectionEnabled","4":"dimensions","5":"borderWidth","6":"minItemHeight","7":"minItemWidth","8":"headerHeight","9":"dragProxyWidth","a":"dragProxyHeight","b":"labels","c":"6","d":"7","e":"8","f":"popout","g":"content","h":"componentName","i":"componentState","j":"id","k":"width","l":"type","m":"height","n":"isClosable","o":"title","p":"popoutWholeStack","q":"openPopouts","r":"parentId","s":"activeItemIndex","t":"reorderEnabled"}'
    );
    const max = LayoutManager.unminifyConfig(existingMinified);
    // Each key should map to its own name.
    Object.keys(max).forEach(k => {
      expect((max as Record<string, unknown>)[k]).toBe(k);
    });
  });

  // This config intentionally has partial/missing fields to match the original Karma test.
  // The minifier should handle partial configs.
  const testConfig = {
    dimensions: {
      borderWidth: 5,
    },

    content: [
      {
        type: 'row',
        content: [
          {
            width: 80,
            type: 'column',
            content: [
              {
                type: 'component',
                componentName: 'watchlist',
                componentState: { instruments: ['MSFT', 'GOOG', 'AAPL'] },
              },
              {
                isClosable: false,
                type: 'row',
                content: [
                  {
                    type: 'component',
                    componentName: 'research',
                  },
                  {
                    type: 'component',
                    componentName: 'research',
                  },
                ],
              },
              {
                type: 'stack',
                content: [
                  {
                    type: 'component',
                    componentName: 'research',
                    componentState: { index: 1 },
                  },
                  {
                    isClosable: false,
                    type: 'component',
                    componentName: 'research',
                    componentState: { index: 2 },
                  },
                  {
                    type: 'component',
                    componentName: 'research',
                    componentState: { index: 3 },
                  },
                ],
              },
            ],
          },
          {
            width: 20,
            type: 'column',
            content: [
              {
                height: 30,
                type: 'component',
                componentName: 'commentary',
                componentState: { feedTopic: 'us-bluechips' },
              },
              {
                type: 'component',
                componentName: 'commentary',
                componentState: { feedTopic: 'lse' },
              },
            ],
          },
        ],
      },
    ],
  };
});
