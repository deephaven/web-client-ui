import { copyToClipboard } from './ClipboardUtils';

document.execCommand = jest.fn();

describe('Clipboard', () => {
  describe('writeText', () => {
    beforeEach(() => jest.resetAllMocks());

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

    it('should call copyToClipboardExecCommand if writeText fails', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: () => {
            throw new Error('Could not write text');
          },
        },
      });
      document.execCommand = jest.fn(() => true);
      jest.spyOn(navigator.clipboard, 'writeText');

      await expect(copyToClipboard('test')).resolves.toBeUndefined();
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    it('calls copyToClipboardExecCommand if clipboard is undefined and throws', async () => {
      Object.assign(navigator, {
        clipboard: undefined,
      });
      document.execCommand = jest.fn(() => false);

      await expect(copyToClipboard('test')).rejects.toThrowError(
        'Unable to execute copy command'
      );
    });

    it('calls copyToClipboardExecCommand if clipboard is undefined but does not throw', async () => {
      Object.assign(navigator, {
        clipboard: undefined,
      });
      document.execCommand = jest.fn(() => true);

      await expect(copyToClipboard('test')).resolves.toBeUndefined();
      await expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });
});
