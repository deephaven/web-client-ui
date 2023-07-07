import { useContextOrThrow } from '@deephaven/react-hooks';
import { UserContext } from '@deephaven/auth-plugins';

export function useUser() {
  return useContextOrThrow(
    UserContext,
    'No user available in useUser. Was code wrapped in UserBootstrap or UserContext.Provider?'
  );
}

export default useUser;
