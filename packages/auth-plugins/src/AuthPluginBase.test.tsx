import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { ClientContext } from '@deephaven/jsapi-bootstrap';
import type { CoreClient } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import AuthPluginBase from './AuthPluginBase';

const mockChildText = 'Mock Auth Base Child';
const mockChild = <div>{mockChildText}</div>;
const mockLoginOptions = { type: 'base-test-type', token: 'mock-token' };
const mockLoginOptionsPromise = Promise.resolve(mockLoginOptions);
const mockGetLoginOptions = jest.fn(() => mockLoginOptionsPromise);
const mockLogin = jest.fn(() => Promise.resolve());

function expectMockChild() {
  return expect(screen.queryByText(mockChildText));
}

function expectLoading() {
  return expect(screen.queryByTestId('auth-base-loading'));
}

function makeCoreClient() {
  return TestUtils.createMockProxy<CoreClient>({ login: mockLogin });
}

function renderComponent(
  getLoginOptions = mockGetLoginOptions,
  client = makeCoreClient()
) {
  return render(
    <ClientContext.Provider value={client}>
      <AuthPluginBase getLoginOptions={getLoginOptions}>
        {mockChild}
      </AuthPluginBase>
    </ClientContext.Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

it('gets the login options and logs in', async () => {
  renderComponent();
  expect(mockLogin).not.toHaveBeenCalled();
  expect(mockGetLoginOptions).toHaveBeenCalledTimes(1);
  expectLoading().toBeInTheDocument();
  expectMockChild().not.toBeInTheDocument();
  await act(async () => {
    await mockLoginOptionsPromise;
  });
  expect(mockLogin).toHaveBeenCalledWith(mockLoginOptions);
  expectLoading().not.toBeInTheDocument();
  expectMockChild().toBeInTheDocument();
});

it('shows an error if the login failed', async () => {
  mockLogin.mockReturnValue(Promise.reject(new Error('mock-error')));
  renderComponent();
  expect(mockLogin).not.toHaveBeenCalled();
  expect(mockGetLoginOptions).toHaveBeenCalledTimes(1);
  expectLoading().toBeInTheDocument();
  expectMockChild().not.toBeInTheDocument();
  await act(async () => {
    await mockLoginOptionsPromise;
  });
  expect(mockLogin).toHaveBeenCalledWith(mockLoginOptions);
  expectLoading().toBeInTheDocument();
  expectMockChild().not.toBeInTheDocument();
  expect(screen.queryByText('mock-error')).toBeInTheDocument();
});
