import React from 'react';
import './DeephavenSpinner.scss';
import classNames from 'classnames';
import PropTypes from 'prop-types';

/**
 * Break apart a generated svg into indivdual svg layers, to allow each to be animated on the GPU
 * CSS animations that reach into the svg are blocking since SVG aren't drawn by the gpu, only animations
 * that are performed on the whole svg remain hardware accelerated.
 */
const DeephavenSpinner = props => {
  const { className, show } = props;
  return (
    <div className={classNames('dh-loader', className, { show })}>
      <svg className="dh-outer-shape" viewBox="0 0 182 182">
        <g transform="translate(91,91.0033) translate(-64,-64.0033)">
          <path
            d="M82.7429,0L82.7429,41.3714L45.2571,41.3714L45.2571,0L0,0L0,128L45.2571,128L45.2571,86.6286L82.5143,86.6286L82.5143,128L128,128L128,0L82.7429,0ZM41.3714,124.114L4.11429,124.114L4.11429,86.6286L41.3714,86.6286L41.3714,124.114ZM41.3714,82.7429L4.11429,82.7429L4.11429,45.2571L41.3714,45.2571L41.3714,82.7429ZM41.3714,41.3714L4.11429,41.3714L4.11429,4.11429L41.3714,4.11429L41.3714,41.3714ZM45.2571,82.7429L45.2571,45.2571L82.5143,45.2571L82.5143,82.5143L45.2571,82.5143ZM124.114,124.114L86.6286,124.114L86.6286,86.6286L123.886,86.6286L123.886,124.114ZM124.114,82.7429L86.6286,82.7429L86.6286,45.2571L123.886,45.2571L123.886,82.7429ZM86.6286,41.3714L86.6286,4.11429L123.886,4.11429L123.886,41.3714L86.6286,41.3714Z"
            fill="#f0f0ee"
          />
        </g>
      </svg>
      <svg className="dh-loader-tile dh-loader-tile-3" viewBox="0 0 182 182">
        <g transform="translate(91,91.0033) translate(-64,-64.0033)">
          <g transform="translate(63.9589,64.0492) translate(-59.9751,-63.9508)">
            <rect
              width="37.3438"
              height="37.6389"
              fill="#5189e5"
              transform="translate(-21.9838,29.7957) translate(21.9838,15.3027)"
            />
          </g>
        </g>
      </svg>
      <svg className="dh-loader-tile dh-loader-tile-2" viewBox="0 0 182 182">
        <g transform="translate(91,91.0033) translate(-64,-64.0033)">
          <g transform="translate(63.9589,64.0492) translate(-59.9751,-63.9508)">
            <rect
              width="37.2755"
              height="37.4675"
              fill="#5189e5"
              transform="translate(-21.9838,69.7957) translate(22.0822,16.7783)"
            />
          </g>
        </g>
      </svg>
      <svg className="dh-loader-tile dh-loader-tile-5" viewBox="0 0 182 182">
        <g transform="translate(91,91.0033) translate(-64,-64.0033)">
          <g transform="translate(63.9589,64.0492) translate(-59.9751,-63.9508)">
            <rect
              width="37.3512"
              height="41.3781"
              fill="#35618c"
              transform="translate(18.0162,72.7957) translate(23.1643,13.7278)"
            />
          </g>
        </g>
      </svg>
      <svg className="dh-loader-tile dh-loader-tile-6" viewBox="0 0 182 182">
        <g transform="translate(91,91.0033) translate(-64,-64.0033)">
          <g transform="translate(63.9589,64.0492) translate(-59.9751,-63.9508)">
            <rect
              width="37.2483"
              height="37.5869"
              fill="#35618c"
              transform="translate(59.0162,29.7957) translate(23.6379,15.3564)"
            />
          </g>
        </g>
      </svg>
      <svg className="dh-loader-tile dh-loader-tile-7" viewBox="0 0 182 182">
        <g transform="translate(91,91.0033) translate(-64,-64.0033)">
          <g transform="translate(63.9589,64.0492) translate(-59.9751,-63.9508)">
            <rect
              width="37.5664"
              height="41.2747"
              fill="#35618c"
              transform="translate(17.0162,-13.2043) translate(24.2531,13.2043)"
            />
          </g>
        </g>
      </svg>
      <svg className="dh-loader-tile dh-loader-tile-4" viewBox="0 0 182 182">
        <g transform="translate(91,91.0033) translate(-64,-64.0033)">
          <g transform="translate(63.9589,64.0492) translate(-59.9751,-63.9508)">
            <rect
              width="37.2854"
              height="37.3014"
              fill="#5189e5"
              transform="translate(-21.9838,-13.2043) translate(22.0822,17.1792)"
            />
          </g>
        </g>
      </svg>
    </div>
  );
};

DeephavenSpinner.propTypes = {
  className: PropTypes.string,
  show: PropTypes.bool,
};

DeephavenSpinner.defaultProps = {
  className: null,
  show: true,
};

export default DeephavenSpinner;
