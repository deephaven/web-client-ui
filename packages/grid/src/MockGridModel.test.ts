import { type LinkToken } from './GridUtils';
import MockGridModel from './MockGridModel';
import { MAX_HASHED_STRING_LENGTH } from './fastMemoize';

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

  it('should find a link cut off by truncation in a very long text', () => {
    const link = 'https://deephaven.io/core/docs';
    const prefix = 'Lorem ipsum '.repeat(10);
    const text = `${prefix}${link} ${'dolor '.repeat(5000)}`;
    expect(text.length).toBeGreaterThan(MAX_HASHED_STRING_LENGTH);
    const model = new MockGridModel({ editedData: [[text]] });

    // The visible text ends part way through the link
    const tokens = model.tokensForCell(0, 0, prefix.length + 10);
    expect(tokens).toEqual([
      expect.objectContaining({
        type: 'url',
        value: link,
        start: prefix.length,
        end: prefix.length + link.length,
      }),
    ]);
  });

  it('should not find links past the visible text in a very long text', () => {
    const text = `${'Lorem ipsum '.repeat(2000)}https://deephaven.io`;
    expect(text.length).toBeGreaterThan(MAX_HASHED_STRING_LENGTH);
    const model = new MockGridModel({ editedData: [[text]] });

    expect(model.tokensForCell(0, 0, 100)).toHaveLength(0);
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
