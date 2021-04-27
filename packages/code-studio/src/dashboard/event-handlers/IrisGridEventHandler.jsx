import shortid from 'shortid';
import LayoutUtils from '../../layout/LayoutUtils';
import { IrisGridEvent } from '../events';

const GRID_COMPONENT = 'IrisGridPanel';

class IrisGridEventHandler {
  constructor(layout, localDashboardId) {
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.layout = layout;
    this.localDashboardId = localDashboardId;

    this.startListening();
  }

  startListening() {
    this.layout.eventHub.on(IrisGridEvent.OPEN_GRID, this.handleOpen);
    this.layout.eventHub.on(IrisGridEvent.CLOSE_GRID, this.handleClose);
  }

  stopListening() {
    this.layout.eventHub.off(IrisGridEvent.OPEN_GRID, this.handleOpen);
    this.layout.eventHub.off(IrisGridEvent.CLOSE_GRID, this.handleClose);
  }

  /**
   * Opens a table up in a grid panel
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
      component: GRID_COMPONENT,
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
    const config = { component: GRID_COMPONENT, id };
    const { root } = this.layout;
    LayoutUtils.closeComponent(root, config);
  }
}

export default IrisGridEventHandler;
