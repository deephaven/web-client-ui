import { copyToClipboard, copyToClipboardExecCommand } from './ClipboardUtils';

Object.assign(navigator, {
  clipboard: {
    writeText: () => {},
  },
});

describe('Clipboard', () => {
  describe('writeText', () => {
    jest.spyOn(navigator.clipboard, 'writeText');

    it('should call clipboard.writeText', () => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test');
    });

    it();
  });
});
