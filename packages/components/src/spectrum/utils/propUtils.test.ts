import { AriaLabelingProps, StyleProps } from '@react-types/shared';
import { separateSpectrumProps } from './propsUtils';

describe('separateSpectrumProps', () => {
  const mockAriaLabelProps: AriaLabelingProps = {
    'aria-label': 'test',
    'aria-labelledby': 'testId',
    'aria-describedby': 'testDesc',
    'aria-details': 'testDetails',
  };

  const mockStyleProps: StyleProps = {
    marginX: '10px',
    marginY: '20px',
    width: '100px',
    height: '200px',
    minWidth: '50px',
    minHeight: '100px',
    maxWidth: '150px',
    maxHeight: '200px',
    flex: '1 1 auto',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    justifySelf: 'center',
    alignSelf: 'center',
    order: 1,
    gridArea: '1 / 1 / 2 / 2',
    gridColumn: '1 / span 2',
    gridRow: '1 / span 2',
    gridColumnStart: '1',
    gridColumnEnd: '3',
    gridRowStart: '1',
    gridRowEnd: '3',
    position: 'relative',
    zIndex: 1,
    top: '10px',
    bottom: '10px',
    start: '10px',
    end: '10px',
    left: '10px',
    right: '10px',
    isHidden: false,
  };

  const mockComponentProps = {
    otherPropA: 'otherValue',
    otherPropB: 999,
  } as const;

  it('should separate aria, style, and component properties', () => {
    const props = {
      ...mockAriaLabelProps,
      ...mockStyleProps,
      ...mockComponentProps,
    };

    const { ariaLabelProps, styleProps, componentProps } =
      separateSpectrumProps(props);

    expect(ariaLabelProps).toEqual(mockAriaLabelProps);
    expect(styleProps).toEqual(mockStyleProps);
    expect(componentProps).toEqual(mockComponentProps);
  });

  it('should return empty objects if no props are passed', () => {
    const { ariaLabelProps, styleProps, componentProps } =
      separateSpectrumProps({});

    expect(ariaLabelProps).toEqual({});
    expect(styleProps).toEqual({});
    expect(componentProps).toEqual({});
  });
});
