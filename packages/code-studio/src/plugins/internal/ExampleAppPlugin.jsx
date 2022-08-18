/* eslint-disable */
import React, { Component } from 'react';
// import Glue from '@glue42/core'; // uncomment this when glue core is installed

class ExampleAppPlugin extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);

    this.state = {
      id: null,
      oldPanel: null,
      panelId: null,
      glue: null,
    };
  }

  componentDidMount() {
    this.initialize();
  }

  async initialize() {
    const { openDashboardByName, openObject } = this.props;
    // uncomment this when glue core is installed
    // const glue = await Glue();
    console.log('Glue42 intialized.', glue);
    this.setState({ glue });
    glue.interop.register(
      {
        name: 'Open',
        accepts: 'string name',
      },
      async args => {
        const { name } = args;
        const tabModel = await openDashboardByName('Test A');
        const { id } = tabModel;
        let oldPanel = null;
        let panelId = null;
        const { dashboardOpenedPanelMaps } = this.props;
        const dashboardMap = dashboardOpenedPanelMaps[id];
        if (dashboardMap) {
          const iterator = dashboardMap.keys();
          let isOpened = false;
          let result = iterator.next();
          while (!result.done) {
            const key = result.value;
            if (dashboardMap.get(key)?.props?.metadata?.table === 'a') {
              oldPanel = dashboardMap.get(key);
              panelId = key;
              isOpened = true;
              openObject('Test', name, key);
              break;
            }
            result = iterator.next();
          }
          if (!isOpened) {
            openObject('Test', name);
          }
        }
        this.setState({ id, oldPanel, panelId });
      }
    );
  }

  handleClick() {
    const { glue } = this.state;
    if (glue) {
      glue.interop.invoke('Open', { name: 'a' });
    }
  }

  render() {
    return <label onClick={this.handleClick}>Example App Plugin</label>;
  }
}

export default ExampleAppPlugin;
