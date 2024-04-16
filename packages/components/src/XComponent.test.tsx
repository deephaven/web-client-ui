/* eslint-disable max-classes-per-file */
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

const MyRefComponent = React.forwardRef<
  HTMLDivElement,
  { children?: React.ReactNode }
>(function MyRefComponent({ children }, ref) {
  return (
    <div ref={ref} data-testid="my-ref-component">
      MyRefComponent
      <div>{children}</div>
    </div>
  );
});

class MyClassComponent extends React.Component {
  public foo = 'bar';

  render() {
    return <div>MyClassComponent</div>;
  }
}

const XMyComponent = createXComponent(MyComponent);
const XMyRefComponent = createXComponent(MyRefComponent);
const XMyClassComponent = createXComponent(MyClassComponent);

function MyReplacementComponent() {
  return <div>MyReplacementComponent</div>;
}

function MyReplacementWrapperComponent({
  children,
}: { children?: React.ReactNode } = {}) {
  return (
    <div>
      <div>MyReplacementWrapperComponent</div>
      <XMyComponent.Original>{children}</XMyComponent.Original>
    </div>
  );
}

const MyReplacementRefComponent = React.forwardRef<
  HTMLDivElement,
  { children?: React.ReactNode }
>(function MyReplacementRefComponent({ children }, ref) {
  return (
    <div ref={ref} data-testid="my-replacement-ref-component">
      MyReplacementRefComponent
      <div>{children}</div>
    </div>
  );
});

class MyReplacementClassComponent extends React.Component {
  public foo = 'baz';

  render() {
    return <div>MyReplacementClassComponent</div>;
  }
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

  it('should render the original ref component', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { getByText } = render(<XMyRefComponent ref={ref} />);
    expect(getByText('MyRefComponent')).toBeInTheDocument();
    expect(ref.current).toBeInTheDocument();
    expect(ref.current?.getAttribute('data-testid')).toBe('my-ref-component');
  });

  it('should render the replacement ref component', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { getByText } = render(
      <XComponentMapProvider
        value={new Map([[XMyRefComponent, MyReplacementRefComponent]])}
      >
        <XMyRefComponent ref={ref} />
      </XComponentMapProvider>
    );
    expect(getByText('MyReplacementRefComponent')).toBeInTheDocument();
    expect(ref.current).toBeInTheDocument();
    expect(ref.current?.getAttribute('data-testid')).toBe(
      'my-replacement-ref-component'
    );
  });

  it('should render the original class component', () => {
    const { getByText } = render(<XMyClassComponent />);
    expect(getByText('MyClassComponent')).toBeInTheDocument();
  });

  it('should render the replacement class component', () => {
    const { getByText } = render(
      <XComponentMapProvider
        value={new Map([[XMyClassComponent, MyReplacementClassComponent]])}
      >
        <XMyClassComponent />
      </XComponentMapProvider>
    );
    expect(getByText('MyReplacementClassComponent')).toBeInTheDocument();
  });
});
