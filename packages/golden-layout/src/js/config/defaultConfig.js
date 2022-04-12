lm.config.defaultConfig = {
  openPopouts: [],
  settings: {
    hasHeaders: true,
    constrainDragToContainer: true,
    reorderEnabled: true,
    selectionEnabled: false,
    popoutWholeStack: false,
    blockedPopoutsThrowError: true,
    closePopoutsOnUnload: true,
    showPopoutIcon: true,
    showMaximiseIcon: true,
    showCloseIcon: true,
    responsiveMode: 'onload', // Can be onload, always, or none.
    tabOverlapAllowance: 0, // maximum pixel overlap per tab
    // reorderOnTabMenuClick: true, // illumon disabled
    tabControlOffset: 10,
  },
  dimensions: {
    borderWidth: 5,
    borderGrabWidth: 10,
    minItemHeight: 10,
    minItemWidth: 10,
    headerHeight: 20,
    dragProxyWidth: 300,
    dragProxyHeight: 200,
  },
  labels: {
    close: 'Close',
    maximise: 'Maximize',
    minimise: 'Minimize',
    popout: 'Open in new window',
    popin: 'Pop in',
    tabDropdown: 'Additional tabs',
    tabNextLabel: 'Next',
    tabPreviousLabel: 'Previous',
  },
};
