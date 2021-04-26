import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsArrowUp } from '@deephaven/icons';
import './DashboardInitPanel.scss';

const HINT_BOX_WIDTH = 130;
const DASHBOARD_PADDING_LEFT = 20;

class DashboardInitPanel extends Component {
  static getTabHintX() {
    const tab = document.querySelector('.app-main-tabs .btn-nav-tab.active');
    const tabHintX = tab
      ? tab.getBoundingClientRect().x +
        (tab.getBoundingClientRect().width - HINT_BOX_WIDTH) / 2
      : 0;

    return tabHintX > DASHBOARD_PADDING_LEFT
      ? tabHintX
      : DASHBOARD_PADDING_LEFT;
  }

  static getPanelsButtonX() {
    const PANELS_BUTTON_WIDTH = 78;

    const panelsButton = document.querySelector('.btn-show-panels');

    const panelsButtonX = panelsButton
      ? panelsButton.getBoundingClientRect().x +
        (PANELS_BUTTON_WIDTH - HINT_BOX_WIDTH) / 2
      : 100;

    return panelsButtonX;
  }

  render() {
    const tabHintX = DashboardInitPanel.getTabHintX();
    const panelsButtonHintX = DashboardInitPanel.getPanelsButtonX();

    return (
      <div className="init-dashboard-container">
        <div className="init-dashboard">
          <div className="hint-container" style={{ left: tabHintX }}>
            <FontAwesomeIcon icon={vsArrowUp} /> <br />
            Right-click tab to rename your new dashboard.
          </div>
          <div className="hint-container" style={{ left: panelsButtonHintX }}>
            <FontAwesomeIcon icon={vsArrowUp} /> <br />
            Use the panel list to add panels from a Persistent Query.
          </div>
          <div className="add-panels-hint">Dashboard is Empty</div>
        </div>
      </div>
    );
  }
}

export default DashboardInitPanel;
