import type { AriaLabelingProps, StyleProps } from '@react-types/shared';

/**
 * Separate props for Spectrum components into AriaLabelingProps, StyleProps, and
 * any remaining props.
 * @param props The props to separate
 * @returns The separated props
 */
export function separateSpectrumProps<T extends AriaLabelingProps & StyleProps>(
  props: T
): {
  ariaLabelProps: AriaLabelingProps;
  styleProps: StyleProps;
  componentProps: Omit<T, keyof (AriaLabelingProps & StyleProps)>;
} {
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    'aria-details': ariaHidden,

    marginX,
    marginY,
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    flex,
    flexGrow,
    flexShrink,
    flexBasis,
    justifySelf,
    alignSelf,
    order,
    gridArea,
    gridColumn,
    gridRow,
    gridColumnStart,
    gridColumnEnd,
    gridRowStart,
    gridRowEnd,
    position,
    zIndex,
    top,
    bottom,
    start,
    end,
    left,
    right,
    isHidden,
    ...restProps
  } = props;

  return {
    ariaLabelProps: {
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
      'aria-details': ariaHidden,
    },
    styleProps: {
      marginX,
      marginY,
      width,
      height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      flex,
      flexGrow,
      flexShrink,
      flexBasis,
      justifySelf,
      alignSelf,
      order,
      gridArea,
      gridColumn,
      gridRow,
      gridColumnStart,
      gridColumnEnd,
      gridRowStart,
      gridRowEnd,
      position,
      zIndex,
      top,
      bottom,
      start,
      end,
      left,
      right,
      isHidden,
    },
    componentProps: restProps as Omit<
      T,
      keyof (AriaLabelingProps & StyleProps)
    >,
  };
}

export default separateSpectrumProps;
