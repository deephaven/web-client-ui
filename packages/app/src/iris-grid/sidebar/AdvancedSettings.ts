import AdvancedSettingsType from './AdvancedSettingsType';

const DEFAULTS = Object.freeze([
  [AdvancedSettingsType.FILTER_CONTROL_CHANGE_CLEARS_ALL_FILTERS, false],
  [AdvancedSettingsType.LINK_CHANGE_CLEARS_ALL_FILTERS, false],
]);

export default { DEFAULTS };
