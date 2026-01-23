import LayoutManager from '../LayoutManager';

describe('It creates and extends config segments correctly', () => {
  it("doesn't change the default config when calling extend", () => {
    // Access the _createConfig method from prototype
    const createConfig = LayoutManager.prototype._createConfig.bind(
      new LayoutManager({}, document.createElement('div'))
    );

    expect(createConfig({}).dimensions.borderWidth).toBe(5);

    const myConfig = createConfig({
      dimensions: {
        borderWidth: 10,
      },
    });

    expect(myConfig).not.toEqual(createConfig({}));
    expect(createConfig({}).dimensions.borderWidth).toBe(5);
    expect(myConfig.dimensions.borderWidth).toBe(10);
  });
});
