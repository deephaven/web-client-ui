/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-unused-state */
import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * Wraps and IrisGridPanel to add a refresh button for Pandas.
 */
class MatPlotLibPanel extends Component {
  static COMPONENT = 'MatPlotLibPanel';

  constructor(props) {
    super(props);

    this.state = {
      imageData: null,
    };
  }

  componentDidMount() {
    this.initImage();
  }

  async initImage() {
    const { makeModel } = this.props;
    const imageData = await makeModel();
    this.setState({ imageData });
  }

  render() {
    const { imageData } = this.state;

    const src = `data:image/png;base64,${imageData}`;

    return (
      // eslint-disable-next-line jsx-a11y/alt-text
      <div className="mat-plot-lib-panel">{imageData && <img src={src} />}</div>
    );
  }
}

MatPlotLibPanel.propTypes = {
  makeModel: PropTypes.func.isRequired,
  panelState: PropTypes.shape({}),
};

MatPlotLibPanel.defaultProps = {
  panelState: null,
};

export default MatPlotLibPanel;
