/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-unused-state */
import React from "react";
import "./MatPlotLibPanel.scss";

export type MatPlotLibWidget = {
  type: string;
  getDataAsBase64: () => string;
};

export type MatPlotLibPanelProps = {
  fetch: () => Promise<MatPlotLibWidget>;
};

export type MatPlotLibPanelState = {
  imageData?: string;
};

/**
 * Wraps and IrisGridPanel to add a refresh button for Pandas.
 */
export class MatPlotLibPanel extends React.Component<
  MatPlotLibPanelProps,
  MatPlotLibPanelState
> {
  static COMPONENT = "MatPlotLibPanel";

  constructor(props) {
    super(props);

    this.state = {
      imageData: undefined,
    };
  }

  componentDidMount() {
    this.initImage();
  }

  async initImage() {
    const { fetch } = this.props;
    const widget = await fetch();
    const imageData = widget.getDataAsBase64();
    this.setState({ imageData });
  }

  render() {
    const { imageData } = this.state;

    const src = `data:image/png;base64,${imageData}`;

    return (
      <div className="mat-plot-lib-panel">{imageData && <img src={src} />}</div>
    );
  }
}

export default MatPlotLibPanel;
