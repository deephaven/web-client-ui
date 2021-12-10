import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
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
type ButtonKind = ButtonTuple[number];

const VARIANT_KINDS = ['group-end'] as const;
type VariantTuple = typeof VARIANT_KINDS;
type VariantKind = VariantTuple[number];

type BaseButtonProps = {
  kind: ButtonKind;
  variant?: VariantKind;
  type?: 'button' | 'reset' | 'submit';
  tooltip?: string | JSX.Element;
  icon?: IconDefinition | JSX.Element;
  disabled?: boolean;
  active?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

type ButtonButtonProps = BaseButtonProps & {
  type?: 'button';
  onClick: React.MouseEventHandler<HTMLButtonElement>;
};

type ButtonWithTypeProps = ButtonButtonProps | BaseButtonProps;

type ButtonWithChildren = ButtonWithTypeProps & {
  children: React.ReactNode;
};

type IconOnlyButton = ButtonWithTypeProps & {
  tooltip: string | JSX.Element;
  icon: IconDefinition | JSX.Element;
  children?: undefined;
};

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
        'px-2': iconOnly,
      });
  }
}

function getVariantClasses(kind: VariantKind): string {
  switch (kind) {
    case 'group-end':
      return classNames('pl-2', 'pr-3');
  }
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props: ButtonProps, ref) => {
    const {
      kind,
      variant,
      type,
      tooltip,
      icon,
      disabled,
      active,
      onClick,
      children,
      className,
      style,
    } = props;

    const iconOnly = (icon && !children) as boolean;
    const btnClassName = getClassName(kind, iconOnly);

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

    let tooltipElem: JSX.Element | undefined;
    if (tooltip) {
      tooltipElem =
        typeof tooltip === 'string' ? <Tooltip>{tooltip}</Tooltip> : tooltip;
    }

    const button = (
      <button
        ref={ref}
        // eslint-disable-next-line react/button-has-type
        type={type}
        className={classNames(
          'btn',
          btnClassName,
          variantClassName,
          { active },
          className
        )}
        onClick={onClick}
        style={style}
        disabled={disabled}
      >
        {icon && iconElem}
        {children}
        {tooltip && !disabled && tooltipElem}
      </button>
    );

    // disabled buttons tooltips need a wrapped element to receive pointer events
    // https://jakearchibald.com/2017/events-and-disabled-form-fields/

    return disabled ? (
      <span className="btn-disabled-wrapper">
        {button}
        {tooltip && tooltipElem}
      </span>
    ) : (
      button
    );
  }
);

Button.displayName = 'Button';

Button.propTypes = {
  kind: PropTypes.oneOf(BUTTON_KINDS).isRequired,
  variant: PropTypes.oneOf(VARIANT_KINDS),
  type: PropTypes.oneOf(['button', 'reset', 'submit']),
  tooltip(props) {
    const { tooltip, icon, children } = props;
    if (!tooltip && icon && !children) {
      return new Error('Tooltip is required for icon only buttons');
    }
    return null;
  },
  icon(props) {
    const { children, icon } = props;
    if (!icon && !children) {
      return new Error('Icon is required if no children are provided');
    }

    if (!children && !React.isValidElement(icon) && !icon?.iconName) {
      return new Error(
        'Icon must be react element or fontawesome IconDefinition'
      );
    }

    return null;
  },
  disabled: PropTypes.bool,
  active: PropTypes.bool,
  onClick(props) {
    const { onClick, type } = props;
    if (type === 'button' && typeof onClick !== 'function') {
      return new Error('type button requires an onClick function');
    }
    if (onClick !== undefined && typeof onClick !== 'function') {
      return new Error('onClick must be a function');
    }
    return null;
  },
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
};

Button.defaultProps = {
  type: 'button',
  onClick: undefined,
  variant: undefined,
  tooltip: undefined,
  icon: undefined,
  disabled: false,
  active: undefined,
  children: undefined,
  className: undefined,
  style: {},
};

export default Button;
