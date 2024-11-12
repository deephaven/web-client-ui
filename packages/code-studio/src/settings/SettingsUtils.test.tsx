import { getFormattedVersionInfo } from './SettingsUtils';

describe('getFormattedVersionInfo', () => {
  it('should return the formatted version information', () => {
    const serverConfigValues = new Map<string, string>();
    serverConfigValues.set('deephaven.version', '1.0.0');
    serverConfigValues.set('python.version', '3.9.7');
    serverConfigValues.set('groovy.version', '11.0.1');
    serverConfigValues.set('java.version', '11.0.1');
    serverConfigValues.set('barrage.version', '2.3.4');

    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36',
      },
      writable: true,
    });

    const result = getFormattedVersionInfo(serverConfigValues);

    expect(result).toEqual({
      'Engine Version': '1.0.0',
      'Web UI Version': '0.0.1',
      'Python Version': '3.9.7',
      'Java Version': '11.0.1',
      'Groovy Version': '11.0.1',
      'Barrage Version': '2.3.4',
      'Browser Name': 'Chrome 96',
      'User Agent OS': 'Windows NT 10.0',
    });
  });

  it('should return "Unknown" for missing version information', () => {
    const serverConfigValues = new Map<string, string>();

    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'Garbage User Agent String',
      },
      writable: true,
    });

    const result = getFormattedVersionInfo(serverConfigValues);

    expect(result).toEqual({
      'Engine Version': 'Unknown',
      'Web UI Version': '0.0.1',
      'Java Version': 'Unknown',
      'Groovy Version': 'Unknown',
      'Barrage Version': 'Unknown',
      'Browser Name': 'Unknown',
      'User Agent OS': 'Unknown',
    });
  });
});
