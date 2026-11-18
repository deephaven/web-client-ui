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

describe('savePanelState', () => {
  it('uses content from the pending state rather than the committed state', () => {
    const Panel = NotebookPanel.WrappedComponent;
    const props = {
      isDashboardActive: true,
      isPreview: false,
      panelState: {
        settings: { language: 'python' },
        fileMetadata: { id: '/test.py', itemName: '/test.py' },
      },
    } as unknown as ConstructorParameters<typeof Panel>[0];
    const panel = new Panel(props);
    const setState = jest
      .spyOn(panel, 'setState')
      .mockImplementation(() => undefined);

    panel.savePanelState();

    expect(setState).toHaveBeenCalledTimes(1);
    const updater = setState.mock.calls[0][0] as (
      state: typeof panel.state
    ) => Pick<typeof panel.state, 'settings'>;
    // Simulates `load` having queued the file content in a not-yet-committed update
    const pendingState = {
      ...panel.state,
      settings: { ...panel.state.settings, value: 'print("hello")' },
    };
    expect(panel.state.settings.value).toBeUndefined();
    expect(updater(pendingState).settings.value).toBe('print("hello")');
  });
});
