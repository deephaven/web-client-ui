import NotebookPanel from './NotebookPanel';

beforeEach(() => {
  document.body.innerHTML = '';
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('unsavedNotebookCount', () => {
  function mockPanel(...classNames: string[]): HTMLDivElement {
    const el = document.createElement('div');
    el.className = classNames.join(' ');
    return el;
  }

  const panel = {
    random: mockPanel('some-random-class'),
    saved: mockPanel(NotebookPanel.UNSAVED_INDICATOR_CLASS_NAME),
    statusOnly: mockPanel(NotebookPanel.UNSAVED_STATUS_CLASS_NAME),
    unsaved: mockPanel(
      NotebookPanel.UNSAVED_INDICATOR_CLASS_NAME,
      NotebookPanel.UNSAVED_STATUS_CLASS_NAME
    ),
  };

  it.each([
    [[], 0],
    [[panel.random], 0],
    [[panel.saved], 0],
    [[panel.statusOnly], 0],
    [[panel.unsaved], 1],
    [[panel.unsaved, panel.unsaved], 2],
    [[panel.unsaved, panel.unsaved, panel.saved], 2],
  ] as const)(
    'should return the count of unsaved notebooks: %s, %s',
    (panels, expectedCount) => {
      panels.forEach(p => document.body.appendChild(p.cloneNode()));
      expect(NotebookPanel.unsavedNotebookCount()).toBe(expectedCount);
    }
  );
});
