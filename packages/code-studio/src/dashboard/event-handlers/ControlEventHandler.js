import shortid from 'shortid';
import LayoutUtils from '../../layout/LayoutUtils';
import { ControlEvent } from '../events';
import ControlType from '../../controls/ControlType';

class ControlEventHandler {
  static DROPDOWN_FILTER_COMPONENT = 'DropdownFilterPanel';

  static INPUT_FILTER_COMPONENT = 'InputFilterPanel';

  static MARKDOWN_COMPONENT = 'MarkdownPanel';

  static getComponentForType(type) {
    switch (type) {
      case ControlType.DROPDOWN_FILTER:
        return ControlEventHandler.DROPDOWN_FILTER_COMPONENT;
      case ControlType.INPUT_FILTER:
        return ControlEventHandler.INPUT_FILTER_COMPONENT;
      case ControlType.MARKDOWN:
        return ControlEventHandler.MARKDOWN_COMPONENT;
      default:
        return null;
    }
  }

  /**
   * @param {GoldenLayout} layout The layout to listen for events
   * @param {Object} componentTemplateMap Map from the component type to a function that returns the template config for that component
   */
  constructor(layout, componentTemplateMap) {
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.layout = layout;
    this.componentTemplateMap = componentTemplateMap;

    this.startListening();
  }

  startListening() {
    this.layout.eventHub.on(ControlEvent.OPEN, this.handleOpen);
    this.layout.eventHub.on(ControlEvent.CLOSE, this.handleClose);
  }

  stopListening() {
    this.layout.eventHub.off(ControlEvent.OPEN, this.handleOpen);
    this.layout.eventHub.off(ControlEvent.CLOSE, this.handleClose);
  }

  handleOpen({
    type,
    title = 'Control',
    metadata = {},
    panelState = null,
    id = shortid.generate(),
    focusElement = LayoutUtils.DEFAULT_FOCUS_SELECTOR,
    createNewStack = false,
    dragEvent = null,
  } = {}) {
    const component = ControlEventHandler.getComponentForType(type);
    if (!component) {
      throw new Error('Unknown type', type);
    }

    let config = {
      type: 'react-component',
      component,
      props: { id, metadata, panelState },
      title,
      id,
    };

    if (this.componentTemplateMap[component]) {
      config = this.componentTemplateMap[component](config);
    }

    const { root } = this.layout;
    LayoutUtils.openComponent({
      root,
      config,
      focusElement,
      createNewStack,
      dragEvent,
    });
  }

  handleClose(id) {
    const config = { id };
    const { root } = this.layout;
    LayoutUtils.closeComponent(root, config);
  }
}

export default ControlEventHandler;
