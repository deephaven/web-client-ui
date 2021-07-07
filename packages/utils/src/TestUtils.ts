interface MockContext {
  arc: () => void;
  beginPath: () => void;
  clip: () => void;
  closePath: () => void;
  createLinearGradient: () => void;
  fill: () => void;
  fillRect: () => void;
  fillText: () => void;
  lineTo: () => void;
  measureText: (s: string) => { width: number };
  moveTo: () => void;
  rect: () => void;
  restore: () => void;
  setTransform: () => void;
  save: () => void;
  stroke: () => void;
  strokeRect: () => void;
  translate: () => void;
  scale: () => void;
  createPattern: () => void;
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
