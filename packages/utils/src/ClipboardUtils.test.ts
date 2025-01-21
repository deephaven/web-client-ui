import { copyToClipboard, readFromClipboard } from './ClipboardUtils';
import {
  ClipboardPermissionsDeniedError,
  ClipboardUnavailableError,
} from './errors';
import { checkPermission } from './PermissionUtils';

document.execCommand = jest.fn();

jest.mock('./PermissionUtils', () => ({
  checkPermission: jest.fn(),
}));

describe('Clipboard', () => {
  describe('writeText', () => {
    beforeEach(() => jest.resetAllMocks());

    it('should call clipboard.writeText', async () => {
      Object.assign(navigator, {
        clipboard: {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          writeText: async () => {},
        },
      });
      jest.spyOn(navigator.clipboard, 'writeText');

      await copyToClipboard('test');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test');
    });

    it('should call copyToClipboardExecCommand if writeText fails', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: async () => {
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

  describe('readFromClipboard', () => {
    beforeEach(() => jest.resetAllMocks());

    it('should throw unavailable error if clipboard is undefined', async () => {
      Object.assign(navigator, {
        clipboard: undefined,
      });

      await expect(readFromClipboard()).rejects.toThrow(
        ClipboardUnavailableError
      );
    });

    it('should throw unavailable error if PermissionState is null', async () => {
      (checkPermission as jest.Mock).mockResolvedValue(null);

      await expect(readFromClipboard()).rejects.toThrow(
        ClipboardUnavailableError
      );
    });

    it('should return text if PermissionState is granted', async () => {
      Object.assign(navigator, {
        clipboard: {
          readText: jest.fn().mockResolvedValueOnce('text from clipboard'),
        },
      });

      (checkPermission as jest.Mock).mockResolvedValueOnce('granted');

      await expect(readFromClipboard()).resolves.toBe('text from clipboard');
    });

    it('should throw denied error if PermissionState is denied', async () => {
      Object.assign(navigator, {
        clipboard: {
          readText: jest.fn(),
        },
      });

      (checkPermission as jest.Mock).mockResolvedValue('denied');

      await expect(readFromClipboard()).rejects.toThrow(
        ClipboardPermissionsDeniedError
      );
    });

    it('should return text if permission prompt accepted', async () => {
      const mockClipboard = {
        readText: jest
          .fn()
          .mockRejectedValueOnce(new Error('Missing permission'))
          .mockResolvedValueOnce('text from clipboard'),
      };

      Object.assign(navigator, {
        clipboard: mockClipboard,
      });

      (checkPermission as jest.Mock)
        .mockResolvedValueOnce('prompt')
        .mockResolvedValue('granted');

      await expect(readFromClipboard()).resolves.toBe('text from clipboard');
      expect(checkPermission).toHaveBeenCalledTimes(2);
      expect(mockClipboard.readText).toHaveBeenCalledTimes(2);
    });

    it('should throw denied error if permission prompt denied', async () => {
      const mockClipboard = {
        readText: jest
          .fn()
          .mockRejectedValueOnce(new Error('Missing permission')),
      };

      Object.assign(navigator, {
        clipboard: mockClipboard,
      });

      (checkPermission as jest.Mock)
        .mockResolvedValueOnce('prompt')
        .mockResolvedValue('denied');

      await expect(readFromClipboard()).rejects.toThrow(
        ClipboardPermissionsDeniedError
      );
      expect(checkPermission).toHaveBeenCalledTimes(2);
      expect(mockClipboard.readText).toHaveBeenCalledTimes(1);
    });

    it('should throw denied error if permission prompt closed', async () => {
      const mockClipboard = {
        readText: jest.fn().mockRejectedValue(new Error('Missing permission')),
      };

      Object.assign(navigator, {
        clipboard: mockClipboard,
      });

      (checkPermission as jest.Mock).mockResolvedValue('prompt');

      await expect(readFromClipboard()).rejects.toThrow(
        ClipboardPermissionsDeniedError
      );
      expect(checkPermission).toHaveBeenCalledTimes(2);
      expect(mockClipboard.readText).toHaveBeenCalledTimes(1);
    });
  });
});
