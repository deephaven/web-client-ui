import React from 'react';
import { render } from '@testing-library/react';
import { createXComponent } from './XComponent';
import { XComponentMapProvider } from './XComponentMap';

function MyComponent({ children }: { children?: React.ReactNode } = {}) {
  return (
    <div>
      MyComponent
      <div>{children}</div>
    </div>
  );
}

const XMyComponent = createXComponent(MyComponent);

function MyReplacementComponent() {
  return <div>MyReplacementComponent</div>;
}

function MyReplacementWrapperComponent({
  children,
}: { children?: React.ReactNode } = {}) {
  return (
    <div>
      <div>MyReplacementWrapperComponent</div>
      <XMyComponent.render.Original>{children}</XMyComponent.render.Original>
    </div>
  );
}

describe('ExtendableComponent', () => {
  it('should render the original component', () => {
    const { getByText } = render(<XMyComponent />);
    expect(getByText('MyComponent')).toBeInTheDocument();
  });

  it('should render the replacement component', () => {
    const { getByText } = render(
      <XComponentMapProvider
        value={new Map([[XMyComponent, MyReplacementComponent]])}
      >
        <XMyComponent />
      </XComponentMapProvider>
    );
    expect(getByText('MyReplacementComponent')).toBeInTheDocument();
  });

  it('should render the original component inside the replacement component', () => {
    const { getByText } = render(
      <XComponentMapProvider
        value={new Map([[XMyComponent, MyReplacementWrapperComponent]])}
      >
        <XMyComponent />
      </XComponentMapProvider>
    );
    expect(getByText('MyReplacementWrapperComponent')).toBeInTheDocument();
    expect(getByText('MyComponent')).toBeInTheDocument();
  });
});
