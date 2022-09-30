import $ from 'jquery';
import utils from '../utils/index.js';

export type TransitionDimensions = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  opacity?: number;
};

export default class TransitionIndicator {
  private _element = $('<div class="lm_transition_indicator"></div>');
  private _toElement: JQuery<HTMLElement> | null = null;

  private _fromDimensions: TransitionDimensions = {};
  private _totalAnimationDuration = 200;
  private _animationStartTime: number | null = null;

  constructor() {
    $(document.body).append(this._element);
  }

  destroy() {
    this._element.remove();
  }

  transitionElements(fromElement: HTMLElement, toElement: HTMLElement) {
    /**
     * TODO - This is not quite as cool as expected. Review.
     */
    return;
    // this._toElement = toElement;
    // this._animationStartTime = utils.now();
    // this._fromDimensions = this._measure(fromElement);
    // this._fromDimensions.opacity = 0.8;
    // this._element.show().css(this._fromDimensions);
    // utils.animFrame(utils.fnBind(this._nextAnimationFrame, this));
  }

  _nextAnimationFrame() {
    if (!this._toElement || this._animationStartTime == null) {
      return;
    }

    const toDimensions: TransitionDimensions = this._measure(this._toElement);
    const animationProgress =
      (Date.now() - this._animationStartTime) / this._totalAnimationDuration;
    const currentFrameStyles: TransitionDimensions = {};

    if (animationProgress >= 1) {
      this._element.hide();
      return;
    }

    toDimensions.opacity = 0;

    const keys = Object.keys(this._fromDimensions) as [
      keyof TransitionDimensions
    ];

    for (let cssProperty of keys) {
      currentFrameStyles[cssProperty] =
        (this._fromDimensions[cssProperty] ?? 0) +
        ((toDimensions[cssProperty] ?? 0) -
          (this._fromDimensions[cssProperty] ?? 0)) *
          animationProgress;
    }

    this._element.css(currentFrameStyles);
    utils.animFrame(this._nextAnimationFrame.bind(this));
  }

  _measure(element: JQuery<HTMLElement>) {
    const offset = element.offset();

    return {
      left: offset?.left,
      top: offset?.top,
      width: element.outerWidth(),
      height: element.outerHeight(),
    };
  }
}
