import $ from 'jquery';
import type Header from './Header.js';

export default class HeaderButton {
  element: JQuery<HTMLLIElement>;

  private _header: Header;

  private _action: (e: Event) => void;

  constructor(
    header: Header,
    label: string | undefined,
    cssClass: string,
    action: (e: Event) => void
  ) {
    this._header = header;
    this.element = $(
      '<li class="' + cssClass + '" title="' + label + '"></li>'
    );
    this._header.on('destroy', this._$destroy, this);
    this._action = action;
    this.element.on('click', this._action);
    this._header.controlsContainer.append(this.element);
  }

  _$destroy() {
    this.element.off();
    this.element.remove();
  }
}
