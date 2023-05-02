export class AuthenticationError extends Error {
  name = 'AuthenticationError';

  isAuthenticationError = true;
}

export default AuthenticationError;
