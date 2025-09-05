import React from 'react';
import { useSlotProps } from '@react-spectrum/utils';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Tooltip } from './popper';

const BUTTON_KINDS = [
  'primary',
  'secondary',
  'tertiary',
  'success',
  'danger',
  'inline',
  'ghost',
] as const;
type ButtonTuple = typeof BUTTON_KINDS;
export type ButtonKind = ButtonTuple[number];

const VARIANT_KINDS = ['group-end'] as const;
type VariantTuple = typeof VARIANT_KINDS;
type VariantKind = VariantTuple[number];

type ButtonTypes = 'submit' | 'reset' | 'button';

interface BaseButtonProps extends React.ComponentPropsWithRef<'button'> {
  kind: ButtonKind;
  type?: ButtonTypes;
  variant?: VariantKind;
  tooltip?: string | JSX.Element;
  icon?: IconDefinition | JSX.Element;
  active?: boolean;
  'data-testid'?: string;
}

type ButtonWithChildren = BaseButtonProps & {
  children: React.ReactNode;
};

type IconOnlyButtonStringTooltip = BaseButtonProps & {
  tooltip: string;
  icon: IconDefinition | JSX.Element;
  children?: undefined;
};

type IconOnlyButtonJsxTooltip = BaseButtonProps & {
  tooltip: JSX.Element;
  'aria-label': string;
  icon: IconDefinition | JSX.Element;
  children?: undefined;
};

type IconOnlyButton = IconOnlyButtonStringTooltip | IconOnlyButtonJsxTooltip;

type ButtonProps = IconOnlyButton | ButtonWithChildren;

function getClassName(kind: ButtonKind, iconOnly: boolean): string {
  switch (kind) {
    case 'primary':
      return 'btn-primary';
    case 'secondary':
      return 'btn-outline-primary';
    case 'tertiary':
      return 'btn-secondary';
    case 'success':
      return 'btn-success';
    case 'danger':
      return 'btn-danger';
    case 'inline':
      return 'btn-inline';
    case 'ghost':
      return classNames('btn-link', {
        'btn-link-icon': iconOnly,
        'btn-link-icon-only': iconOnly,
      });
  }
}

function getVariantClasses(kind: VariantKind): string {
  switch (kind) {
    case 'group-end':
      return classNames('pl-2', 'pr-3');
  }
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props: ButtonProps, ref) => {
    const {
      kind,
      variant,
      type = 'button',
      tooltip,
      icon,
      disabled = false,
      active,
      onClick,
      onContextMenu,
      onMouseDown,
      onMouseUp,
      onMouseEnter,
      onMouseLeave,
      onKeyDown,
      className,
      style,
      children,
      tabIndex,
      'data-testid': dataTestId,
      'aria-label': ariaLabel,
      ...rest
    } = props;

    // Spectrum container components such as `ButtonGroup` provide
    // UNSAFE_className prop for the `button` slot via a SlotProvider (
    // https://github.com/adobe/react-spectrum/blob/%40adobe/react-spectrum%403.33.1/packages/%40react-spectrum/buttongroup/src/ButtonGroup.tsx#L104-L107)
    // This can be retrieved via `useSlotProps` to allow our buttons to be styled
    // correctly inside the container.
    const { UNSAFE_className } = useSlotProps<{ UNSAFE_className?: string }>(
      {},
      'button'
    );

    let variantClassName;
    if (variant) {
      variantClassName = getVariantClasses(variant);
    }

    let iconElem: JSX.Element | undefined;
    if (icon) {
      iconElem = React.isValidElement(icon) ? (
        icon
      ) : (
        <FontAwesomeIcon icon={icon as IconDefinition} />
      );
    }

    // not entirely accurate, as button can have non-visible children
    const iconOnly = iconElem != null && children == null;

    const btnClassName = getClassName(kind, iconOnly);

    let tooltipElem: JSX.Element | undefined;
    if (tooltip !== undefined) {
      tooltipElem =
        typeof tooltip === 'string' ? <Tooltip>{tooltip}</Tooltip> : tooltip;
    }

    // use tooltip as arial-label for iconOnly buttons only
    // if tooltip is also a string and aria-label is not set
    let ariaLabelString = ariaLabel;
    if (
      ariaLabel === undefined &&
      iconOnly &&
      tooltip != null &&
      typeof tooltip === 'string'
    ) {
      ariaLabelString = tooltip;
    }

    const button = (
      <button
        data-testid={dataTestId}
        ref={ref}
        // eslint-disable-next-line react/button-has-type
        type={type}
        className={classNames(
          'btn',
          btnClassName,
          variantClassName,
          { active },
          className,
          UNSAFE_className
        )}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onMouseUp={onMouseUp}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onKeyDown={onKeyDown}
        style={style}
        disabled={disabled}
        tabIndex={tabIndex}
        aria-label={ariaLabelString}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
      >
        {icon && iconElem}
        {children}
        {tooltip != null && !disabled && tooltipElem}
      </button>
    );

    // disabled buttons tooltips need a wrapped element to receive pointer events
    // https://jakearchibald.com/2017/events-and-disabled-form-fields/

    return disabled && tooltip != null ? (
      <span className="btn-disabled-wrapper">
        {button}
        {tooltipElem}
      </span>
    ) : (
      button
    );
  }
);

Button.displayName = 'Button';

export default Button;
