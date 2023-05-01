import React from 'react';
import { RandomAreaPlotAnimation } from '@deephaven/components';
import Logo from './logo.png';
import './Login.scss';

interface LoginProps {
  /** What to show in the login input part of the login form. */
  children: React.ReactNode;
}

export function Login({ children }: LoginProps) {
  return (
    <div className="login-container">
      <RandomAreaPlotAnimation />
      <div className="login-box">
        <div className="logo">
          <img src={Logo} alt="Deephaven Data Labs" />
        </div>
        {children}
        <p className="footer">
          © 2016-{new Date().getFullYear()} Deephaven Data Labs LLC. Patent
          Pending.
        </p>
      </div>
    </div>
  );
}

export default Login;
