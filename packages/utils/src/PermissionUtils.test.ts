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

      const result = await checkPermission('');
      expect(result).toEqual(state);
    }
  );

  it('should return null if permission is unsupported by the browser', async () => {
    Object.assign(navigator, {
      permissions: {
        query: jest
          .fn()
          .mockRejectedValue(new Error('Permission not supported')),
      },
    });

    const result = await checkPermission('');
    expect(result).toBeNull();
  });
});
