import { useContextOrThrow } from '@deephaven/react-hooks';
import { UserContext } from '@deephaven/auth-plugins';
import type { User } from '@deephaven/redux';

export function useUser(): User {
  return useContextOrThrow(
    UserContext,
    'No user available in useUser. Was code wrapped in UserBootstrap or UserContext.Provider?'
  );
}

export default useUser;
