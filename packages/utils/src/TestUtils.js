class TestUtils {
  static makeMockContext() {
    return {
      arc: jest.fn(),
      beginPath: jest.fn(),
      clip: jest.fn(),
      closePath: jest.fn(),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      fill: jest.fn(),
      fillRect: jest.fn(),
      fillText: jest.fn(),
      lineTo: jest.fn(),
      measureText: jest.fn(str => ({ width: str.length * 10 })),
      moveTo: jest.fn(),
      rect: jest.fn(),
      restore: jest.fn(),
      setTransform: jest.fn(),
      save: jest.fn(),
      stroke: jest.fn(),
      strokeRect: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      createPattern: jest.fn(),
    };
  }

  static async flushPromises() {
    await new Promise(setImmediate);
  }

  static REGULAR_USER = {
    name: 'test',
    operateAs: 'test',
    groups: ['allusers', 'test'],
    isQueryViewOnly: false,
    isSuperUser: false,
  };
}

export default TestUtils;
