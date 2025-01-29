import UnsupportedPermissionError from './errors/UnsupportedPermissionError';
import { checkPermission } from './PermissionUtils';

describe('checkPermission', () => {
  beforeEach(() => jest.resetAllMocks());

  it.each(['granted', 'prompt', 'denied'])(
    'should return the correct PermissionState for %s permission state',
    async state => {
      Object.assign(navigator, {
        permissions: {
          query: jest.fn().mockResolvedValue({ state }),
        },
      });

      await expect(checkPermission('')).resolves.toEqual(state);
    }
  );

  it('should throw error if permission is unsupported by the browser', async () => {
    Object.assign(navigator, {
      permissions: {
        query: jest
          .fn()
          .mockRejectedValue(new TypeError('Permission not supported')),
      },
    });

    await expect(checkPermission('')).rejects.toThrow(
      UnsupportedPermissionError
    );
  });
});
