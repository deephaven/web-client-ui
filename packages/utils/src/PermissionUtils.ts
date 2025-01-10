/**
 * Checks permission to use a particular API from: https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API#permission-aware_apis
 * @param permission The name of the permission
 * @returns PermissionState on success, null if permission is unsupported by browser
 */
// eslint-disable-next-line import/prefer-default-export
export async function checkPermission(
  permission: string
): Promise<PermissionState | null> {
  try {
    // Typescript doesn't recognize certain permissions as a valid PermissionName
    // https://github.com/microsoft/TypeScript/issues/33923
    const name = permission as PermissionName;
    return (await navigator.permissions.query({ name })).state;
  } catch (error) {
    // Permission is unsupported by browser
    return null;
  }
}
