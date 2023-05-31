import GoldenLayout from '../scss/GoldenLayout.module.scss';

// parseInt for unitless values, stripping "px"
export default Object.freeze({
  tabHeight: parseInt(GoldenLayout['tab-height'], 10),
  dragBorderWidth: parseInt(GoldenLayout['drag-border-width'], 10),
});
