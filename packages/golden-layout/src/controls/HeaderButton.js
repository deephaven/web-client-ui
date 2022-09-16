import $ from 'jquery';
import utils from '../utils';

const HeaderButton = function (header, label, cssClass, action) {
  this._header = header;
  this.element = $('<li class="' + cssClass + '" title="' + label + '"></li>');
  this._header.on('destroy', this._$destroy, this);
  this._action = action;
  this.element.on('click', this._action);
  this._header.controlsContainer.append(this.element);
};

utils.copy(HeaderButton.prototype, {
  _$destroy: function () {
    this.element.off();
    this.element.remove();
  },
});

export default HeaderButton;
