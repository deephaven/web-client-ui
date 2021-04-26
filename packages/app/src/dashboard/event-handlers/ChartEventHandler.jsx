import shortid from 'shortid';
import LayoutUtils from '../../layout/LayoutUtils';
import { ChartEvent } from '../events';

const CHART_COMPONENT = 'ChartPanel';

class ChartEventHandler {
  constructor(layout, localDashboardId) {
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.layout = layout;
    this.localDashboardId = localDashboardId;

    this.startListening();
  }

  startListening() {
    this.layout.eventHub.on(ChartEvent.OPEN, this.handleOpen);
    this.layout.eventHub.on(ChartEvent.CLOSE, this.handleClose);
  }

  stopListening() {
    this.layout.eventHub.off(ChartEvent.OPEN, this.handleOpen);
    this.layout.eventHub.off(ChartEvent.CLOSE, this.handleClose);
  }

  handleOpen(
    title,
    makeModel,
    metadata = {},
    id = shortid.generate(),
    dragEvent = null
  ) {
    const { localDashboardId } = this;
    const config = {
      type: 'react-component',
      component: CHART_COMPONENT,
      props: { localDashboardId, id, metadata, makeModel },
      title,
      id,
    };

    const { root } = this.layout;
    LayoutUtils.openComponent({ root, config, dragEvent });
  }

  handleClose(id) {
    const config = {
      component: CHART_COMPONENT,
      id,
    };
    const { root } = this.layout;
    LayoutUtils.closeComponent(root, config);
  }
}

export default ChartEventHandler;
