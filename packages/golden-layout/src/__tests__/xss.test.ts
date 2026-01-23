import { filterXss } from '../utils';

describe('Basic XSS filtering is applied', () => {
  it('escapes tags', () => {
    const escapedString = filterXss(
      '>\'>"><img src=x onerror=alert(0)>',
      false
    );
    expect(escapedString).toBe(
      '&gt;\'&gt;"&gt;&lt;img src=x on&#101;rror=alert(0)&gt;'
    );
  });

  it('escapes javascript urls', () => {
    const escapedString = filterXss('javascript:alert("hi")', false);
    expect(escapedString).toBe('j&#97;va&#115;cript:alert("hi")');
  });

  it('escapes expression statements', () => {
    const escapedString = filterXss('expression:alert("hi")', false);
    expect(escapedString).toBe('expr&#101;ssion:alert("hi")');
  });

  it('escapes onload statements', () => {
    let escapedString = filterXss('onload=alert("hi")', false);
    expect(escapedString).toBe('onlo&#97;d=alert("hi")');

    escapedString = filterXss('onLoad=alert("hi")', false);
    expect(escapedString).toBe('onlo&#97;d=alert("hi")');
  });

  it('escapes onerror statements', () => {
    let escapedString = filterXss('onerror=alert("hi")', false);
    expect(escapedString).toBe('on&#101;rror=alert("hi")');

    escapedString = filterXss('onError=alert("hi")', false);
    expect(escapedString).toBe('on&#101;rror=alert("hi")');
  });
});
