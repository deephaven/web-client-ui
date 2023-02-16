import { copyToClipboard } from './ClipboardUtils';

document.execCommand = jest.fn();

describe('Clipboard', () => {
  describe('writeText', () => {
    it('should call clipboard.writeText', async () => {
      Object.assign(navigator, {
        clipboard: {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          writeText: () => {},
        },
      });
      jest.spyOn(navigator.clipboard, 'writeText');

      await copyToClipboard('test');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test');
    });

    it('should throw an error when writeText fails and call copyToClipboardExecCommand', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: () => {
            throw new Error('Could not write text');
          },
        },
      });
      jest.spyOn(navigator.clipboard, 'writeText');

      await expect(copyToClipboard('test')).rejects.toThrowError(
        'Unable to execute copy command'
      );
      expect(navigator.clipboard.writeText).toThrowError(
        'Could not write text'
      );
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    it('calls copyToClipboardExecCommand if clipboard is undefined', async () => {
      Object.assign(navigator, {
        clipboard: undefined,
      });

      await expect(copyToClipboard('test')).rejects.toThrowError(
        'Unable to execute copy command'
      );
    });
  });
});
