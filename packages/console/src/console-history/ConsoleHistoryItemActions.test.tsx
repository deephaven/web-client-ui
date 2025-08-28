import { render, screen } from '@testing-library/react';
import { TestUtils } from '@deephaven/test-utils';
import userEvent from '@testing-library/user-event';
import ConsoleHistoryItemActions from './ConsoleHistoryItemActions';
import { ThemeProvider } from '@deephaven/components';

describe('clicking calls functionality', () => {
  const user = userEvent.setup();
  const handleCommandSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    return render(
      <ThemeProvider themes={[]}>
        <ConsoleHistoryItemActions
          item={{ command: 'Test command' }}
          handleCommandSubmit={handleCommandSubmit}
          handleTooltipVisible={jest.fn()}
        />
      </ThemeProvider>
    );
  });

  it('should render and rerun on click', async () => {
    const button = screen.getAllByRole('button');
    console.log('thebuttons', button, button.length);
    await user.click(button[1]);
    expect(handleCommandSubmit).toHaveBeenCalledTimes(1);
  });
});
