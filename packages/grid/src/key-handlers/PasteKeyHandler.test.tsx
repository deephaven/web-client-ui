import React from 'react';
import ReactDOM from 'react-dom';
import { parseValueFromElement } from './PasteKeyHandler';

function makeElementFromJsx(jsx: JSX.Element): HTMLElement {
  const div = document.createElement('div');
  ReactDOM.render(jsx, div);
  return div;
}

describe('table parsing', () => {
  const EMPTY_TABLE = <table />;
  const SMALL_TABLE = (
    <table>
      <thead>
        <tr>
          <td>A</td>
          <td>B</td>
          <td>C</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>2</td>
          <td>3</td>
        </tr>
      </tbody>
    </table>
  );

  const EMPTY_DATA = [] as string[][];
  const SMALL_DATA = [
    ['A', 'B', 'C'],
    ['1', '2', '3'],
  ];

  const SINGLE_ROW_DATA = [SMALL_DATA[0]];

  /**
   * Below are a couple of different representations for how the data comes in when pasting a text string with tab characters
   * For example, if you paste 'A\tB\tC\n1\t2\t3' (two rows separated with new line, three columns separated by tab), in
   * Chrome it pastes as one div per row and the tab characters are preserved.
   * In Firefox, it converts the tabs to a combination of non-breaking spaces and regular spaces, and text node separated by
   * break nodes.
   */
  const TEXT_TABLE_CHROME = (
    <>
      <div>
        A<span>{'\t'}</span>B<span>{'\t'}</span>C
      </div>
      <div>
        1<span>{'\t'}</span>2<span>{'\t'}</span>3
      </div>
      <div>
        <br />
      </div>
    </>
  );

  const SINGLE_ROW_CHROME = (
    <>
      A<span>{'\t'}</span>B<span>{'\t'}</span>C
    </>
  );

  const TEXT_TABLE_FIREFOX = (
    <>
      A&nbsp;&nbsp; &nbsp;B&nbsp;&nbsp; &nbsp;C
      <br />
      1&nbsp;&nbsp; &nbsp;2&nbsp;&nbsp; &nbsp;3
    </>
  );

  const SINGLE_ROW_FIREFOX = <>A&nbsp;&nbsp; &nbsp;B&nbsp;&nbsp; &nbsp;C</>;

  function testTable(jsx: JSX.Element, expectedValue: string[][]) {
    const element = makeElementFromJsx(jsx);
    const result = parseValueFromElement(element);
    expect(result).not.toBe(null);
    if (result != null) {
      expect(result.length).toBe(expectedValue.length);
      for (let i = 0; i < expectedValue.length; i += 1) {
        expect(result[i].length).toBe(expectedValue[i].length);
        for (let j = 0; j < expectedValue[i].length; j += 1) {
          expect(result[i][j]).toBe(expectedValue[i][j]);
        }
      }
    }
  }

  it('parses an empty table', () => {
    testTable(EMPTY_TABLE, EMPTY_DATA);
  });

  it('parses a small table', () => {
    testTable(SMALL_TABLE, SMALL_DATA);
  });

  it('parses a nested small table', () => {
    testTable(<div>{SMALL_TABLE}</div>, SMALL_DATA);
  });

  it('parses out a basic div table', () => {
    testTable(TEXT_TABLE_CHROME, SMALL_DATA);
  });

  it('parses out a basic text table', () => {
    testTable(TEXT_TABLE_FIREFOX, SMALL_DATA);
  });

  it('parses out a single row in Chrome', () => {
    testTable(SINGLE_ROW_CHROME, SINGLE_ROW_DATA);
  });

  it('parses out a single row in Firefox', () => {
    testTable(SINGLE_ROW_FIREFOX, SINGLE_ROW_DATA);
  });
});

describe('text parsing', () => {
  function testHtml(jsx: JSX.Element, expectedValue: string | null) {
    const element = makeElementFromJsx(jsx);
    const result = parseValueFromElement(element);
    expect(result).toBe(expectedValue);
  }

  it('parses empty html', () => {
    testHtml(<div />, null);
  });

  it('parses simple text element', () => {
    testHtml(<div>foo</div>, 'foo');
  });
});
