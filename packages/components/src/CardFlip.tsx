import React, { useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames';
import './CardFlip.scss';

type CardFlipProps = {
  isFlipped: boolean;
  children: [React.ReactNode, React.ReactNode];
  className?: string;
};

/**
 * Card flip component, switches between a front and back face being visible.
 * Has logic to handle overflow on body, caused by perspective transforms
 * and moves z-index to top during transition.
 * @param isFlipped true shows second child, false shows first child
 * @param children Expects exactly two children
 * @returns
 */
const CardFlip = ({
  className,
  isFlipped,
  children,
}: CardFlipProps): JSX.Element => {
  const getComponent = (key: 0 | 1) => {
    if (children.length !== 2) {
      throw new Error('CardFlip requires 2 children to function');
    }
    return children[key];
  };

  const front = useRef<HTMLDivElement>(null);

  const transitionStart = useCallback(event => {
    if (event.target === event.currentTarget) {
      document.body.classList.add('card-flip--is-flipping');
    }
  }, []);

  const transitionEnd = useCallback(event => {
    if (event.target === event.currentTarget) {
      document.body.classList.remove('card-flip--is-flipping');
    }
  }, []);

  useEffect(() => {
    if (!front.current) throw Error('ref undefined');
    front.current.addEventListener('transitionstart', transitionStart);
  }, [transitionStart]);

  return (
    <div
      className={classNames(className, {
        'card-flip--show-front': isFlipped,
        'card-flip--show-back': !isFlipped,
      })}
    >
      <div className="card-flip--back">{getComponent(0)}</div>
      <div
        ref={front}
        className="card-flip--front"
        onTransitionEnd={transitionEnd}
      >
        {getComponent(1)}
      </div>
    </div>
  );
};

export default CardFlip;
