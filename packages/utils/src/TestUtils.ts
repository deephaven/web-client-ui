interface MockContext {
  arc: jest.Mock<void>;
  beginPath: jest.Mock<void>;
  clip: jest.Mock<void>;
  closePath: jest.Mock<void>;
  createLinearGradient: jest.Mock<{ addColorStop: jest.Mock<void> }>;
  fill: jest.Mock<void>;
  fillRect: jest.Mock<void>;
  fillText: jest.Mock<void>;
  lineTo: jest.Mock<void>;
  measureText: jest.Mock<{ width: number }, [string]>;
  moveTo: jest.Mock<void>;
  rect: jest.Mock<void>;
  restore: jest.Mock<void>;
  setTransform: jest.Mock<void>;
  save: jest.Mock<void>;
  stroke: jest.Mock<void>;
  strokeRect: jest.Mock<void>;
  translate: jest.Mock<void>;
  scale: jest.Mock<void>;
  createPattern: jest.Mock<void>;
}

class TestUtils {
  static makeMockContext(): MockContext {
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
      measureText: jest.fn((str: string) => ({ width: str.length * 10 })),
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

  static async flushPromises(): Promise<void> {
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
