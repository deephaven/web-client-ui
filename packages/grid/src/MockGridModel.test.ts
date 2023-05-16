import { LinkToken } from './GridUtils';
import MockGridModel from './MockGridModel';

describe('tokensForCell', () => {
  it('should return tokens for a cell', () => {
    const model = new MockGridModel({ editedData: [['https://google.com']] });
    const expectedValue: LinkToken[] = [
      {
        type: 'url',
        value: 'https://google.com',
        isLink: true,
        href: 'https://google.com',
        start: 0,
        end: 18,
      },
    ];

    const tokens = model.tokensForCell(0, 0, 100);
    expect(tokens).toHaveLength(1);
    expect(tokens).toEqual(expectedValue);
  });

  it('should return multiple tokens for a cell', () => {
    const text = 'https://google.com youtube.com blah@gmail.com';
    const model = new MockGridModel({ editedData: [[text]] });
    const expectedValue: LinkToken[] = [
      {
        type: 'url',
        value: 'https://google.com',
        isLink: true,
        href: 'https://google.com',
        start: 0,
        end: 18,
      },

      {
        type: 'email',
        value: 'blah@gmail.com',
        isLink: true,
        href: 'mailto:blah@gmail.com',
        start: 31,
        end: 45,
      },
    ];

    const tokens = model.tokensForCell(0, 0, text.length);
    expect(tokens).toHaveLength(2);
    expect(tokens).toEqual(expectedValue);
  });

  it('should return an empty array for a cell with no tokens', () => {
    const text = 'google youtube';
    const model = new MockGridModel({ editedData: [[text]] });
    const expectedValue: LinkToken[] = [];

    const tokens = model.tokensForCell(0, 0, text.length);
    expect(tokens).toHaveLength(0);
    expect(tokens).toEqual(expectedValue);
  });
});
