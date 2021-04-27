/* eslint-disable react/jsx-filename-extension */
import React from 'react';

class Plot extends React.Component {
  constructor(props) {
    super(props);

    this.el = null;
  }

  render() {
    return (
      <div
        style={{ width: 500, height: 500 }}
        ref={ref => {
          this.el = ref;
        }}
      />
    );
  }
}

Plot.displayName = 'Plot';

export default Plot;
