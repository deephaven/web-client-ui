import shortid from 'shortid';
import LayoutUtils from '../../layout/LayoutUtils';
import { PandasEvent } from '../events';

const PANDAS_COMPONENT = 'PandasPanel';

class PandasEventHandler {
  constructor(layout, localDashboardId) {
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.layout = layout;
    this.localDashboardId = localDashboardId;

    this.startListening();
  }

  startListening() {
    this.layout.eventHub.on(PandasEvent.OPEN, this.handleOpen);
    this.layout.eventHub.on(PandasEvent.CLOSE, this.handleClose);
  }

  stopListening() {
    this.layout.eventHub.off(PandasEvent.OPEN, this.handleOpen);
    this.layout.eventHub.off(PandasEvent.CLOSE, this.handleClose);
  }

  /**
   * Opens a pandas table up in a pandas panel
   * @param {string} title The title to use for the panel
   * @param {function} makeModel A function to create the model (can return promise)
   * @param {Object} metadata Metadata used to create the model
   * @param {string} id The unique ID to use for the panel
   */
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
      component: PANDAS_COMPONENT,
      props: {
        localDashboardId,
        id,
        metadata,
        makeModel,
      },
      title,
      id,
    };

    const { root } = this.layout;
    LayoutUtils.openComponent({ root, config, dragEvent });
  }

  handleClose(id) {
    const config = { component: PANDAS_COMPONENT, id };
    const { root } = this.layout;
    LayoutUtils.closeComponent(root, config);
  }
}

export default PandasEventHandler;
