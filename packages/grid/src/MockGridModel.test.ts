import { LinkToken } from './GridUtils';
import MockGridModel from './MockGridModel';

describe('tokensForCell', () => {
  it('should return tokens for a cell', () => {
    const model = new MockGridModel({ editedData: [['google.com']] });
    const expectedValue: LinkToken[] = [
      {
        type: 'url',
        value: 'google.com',
        isLink: true,
        href: 'http://google.com',
        start: 0,
        end: 10,
      },
    ];

    const tokens = model.tokensForCell(0, 0, 100);
    expect(tokens).toHaveLength(1);
    expect(tokens).toEqual(expectedValue);
  });

  it('should return multiple tokens for a cell', () => {
    const text = 'google.com youtube.com blah@gmail.com';
    const model = new MockGridModel({ editedData: [[text]] });
    const expectedValue: LinkToken[] = [
      {
        type: 'url',
        value: 'google.com',
        isLink: true,
        href: 'http://google.com',
        start: 0,
        end: 10,
      },
      {
        type: 'url',
        value: 'youtube.com',
        isLink: true,
        href: 'http://youtube.com',
        start: 11,
        end: 22,
      },
      {
        type: 'email',
        value: 'blah@gmail.com',
        isLink: true,
        href: 'mailto:blah@gmail.com',
        start: 23,
        end: 37,
      },
    ];

    const tokens = model.tokensForCell(0, 0, text.length);
    expect(tokens).toHaveLength(3);
    expect(tokens).toEqual(expectedValue);
  });

  it('should an empty array for a cell with no tokens', () => {
    const text = 'google youtube';
    const model = new MockGridModel({ editedData: [[text]] });
    const expectedValue: LinkToken[] = [];

    const tokens = model.tokensForCell(0, 0, text.length);
    expect(tokens).toHaveLength(0);
    expect(tokens).toEqual(expectedValue);
  });
});
