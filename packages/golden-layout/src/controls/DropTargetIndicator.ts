import $ from 'jquery';

export default class DropTargetIndicator {
  private static _template =
    '<div class="lm_dropTargetIndicator"><div class="lm_inner"></div></div>';

  element = $(DropTargetIndicator._template);

  constructor() {
    $(document.body).append(this.element);
  }

  destroy() {
    this.element.remove();
  }

  highlightArea(area: { x1: number; x2: number; y1: number; y2: number }) {
    this.element
      .css({
        left: area.x1,
        top: area.y1,
        // marching ants were causing rendering artifacts with fractional pixels
        width: Math.floor(area.x2 - area.x1),
        height: Math.floor(area.y2 - area.y1),
      })
      .show();
  }

  hide() {
    this.element.hide();
  }
}
