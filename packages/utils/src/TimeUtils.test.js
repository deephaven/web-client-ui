import TimeUtils from './TimeUtils';

describe('formatElapsedTime parsing tests', () => {
  function testFormatElapsedTime(time, expectedResult) {
    const result = TimeUtils.formatElapsedTime(time);
    expect(result).toBe(expectedResult);
  }

  function testFormatElapsedTimeThrows(time) {
    expect(() => {
      TimeUtils.formatElapsedTime(time);
    }).toThrow();
  }

  it('handles 0', () => {
    testFormatElapsedTime(0, '0s');
  });

  it('handles 5', () => {
    testFormatElapsedTime(5, '5s');
  });

  it('handles 10', () => {
    testFormatElapsedTime(10, '10s');
  });

  it('handles 60', () => {
    testFormatElapsedTime(60, '1m 00s');
  });

  it('handles 61', () => {
    testFormatElapsedTime(61, '1m 01s');
  });

  it('handles 3600', () => {
    testFormatElapsedTime(3600, '1h 0m 00s');
  });

  it('handles 3624', () => {
    testFormatElapsedTime(3624, '1h 0m 24s');
  });

  it('handles 4210', () => {
    testFormatElapsedTime(4210, '1h 10m 10s');
  });

  it('handles 10000', () => {
    testFormatElapsedTime(10000, '2h 46m 40s');
  });

  it('handles 100000', () => {
    testFormatElapsedTime(100000, '27h 46m 40s');
  });

  it('throws an error for invalid dates', () => {
    testFormatElapsedTimeThrows('not a time');
    testFormatElapsedTimeThrows('10');
    testFormatElapsedTimeThrows(10.5);
  });
});

describe('formatTime tests', () => {
  function testFormatTime(time, expectedResult) {
    const result = TimeUtils.formatTime(time);
    expect(result).toBe(expectedResult);
  }

  function testFormatTimeThrows(time) {
    expect(() => {
      TimeUtils.formatTime(time);
    }).toThrow();
  }

  it('handles 0', () => {
    testFormatTime(0, '00:00:00');
  });

  it('handles 5', () => {
    testFormatTime(5, '00:00:05');
  });

  it('handles 10', () => {
    testFormatTime(10, '00:00:10');
  });

  it('handles 59', () => {
    testFormatTime(59, '00:00:59');
  });

  it('handles 60', () => {
    testFormatTime(60, '00:01:00');
  });

  it('handles 61', () => {
    testFormatTime(61, '00:01:01');
  });

  it('handles 3600', () => {
    testFormatTime(3600, '01:00:00');
  });

  it('handles 3624', () => {
    testFormatTime(3624, '01:00:24');
  });

  it('handles 4210', () => {
    testFormatTime(4210, '01:10:10');
  });

  it('handles 100000', () => {
    testFormatTime(100000, '27:46:40');
  });

  it('throws an error for invalid dates', () => {
    testFormatTimeThrows('not a time');
    testFormatTimeThrows('10');
    testFormatTimeThrows(10.5);
    testFormatTimeThrows(-5);
  });
});

describe('parseTime tests', () => {
  function testParseTime(time, expectedResult) {
    const result = TimeUtils.parseTime(time);
    expect(result).toBe(expectedResult);
  }

  function testParseTimeThrows(time) {
    expect(() => {
      TimeUtils.parseTime(time);
    }).toThrow();
  }

  it('handles 00:00:00', () => {
    testParseTime('00:00:00', 0);
  });

  it('handles 00:00:05', () => {
    testParseTime('00:00:05', 5);
  });

  it('handles 00:01:00', () => {
    testParseTime('00:01:00', 60);
  });

  it('handles 00:01:01', () => {
    testParseTime('00:01:01', 61);
  });

  it('handles 01:00:00', () => {
    testParseTime('01:00:00', 3600);
  });

  it('handles 01:00:24', () => {
    testParseTime('01:00:24', 3624);
  });

  it('handles 01:10:10', () => {
    testParseTime('01:10:10', 4210);
  });

  it('handles 27:46:40', () => {
    testParseTime('27:46:40', 100000);
  });

  it('throws an error for invalid dates', () => {
    testParseTimeThrows(1234);
    testParseTimeThrows('10');
    testParseTimeThrows('not a time');
  });
});
