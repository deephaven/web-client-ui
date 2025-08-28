import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConsoleHistoryItemActions from './ConsoleHistoryItemActions';

describe('clicking calls functionality', () => {
  const user = userEvent.setup();
  const handleCommandSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    return render(
      <ConsoleHistoryItemActions
        item={{ command: 'Test command' }}
        handleCommandSubmit={handleCommandSubmit}
        handleTooltipVisible={jest.fn()}
      />
    );
  });

  it('should render and rerun on click', async () => {
    const button = screen.getAllByRole('button');
    await user.click(button[1]);
    expect(handleCommandSubmit).toHaveBeenCalledTimes(1);
  });
});
