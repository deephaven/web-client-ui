/**
 * Fix some issues with plotly types.
 */

declare module 'plotly.js' {
  interface OhlcDirectionData {
    line?: { color?: Color; width?: number; dash?: Dash };
  }

  export interface PlotData {
    increasing?: OhlcDirectionData;
    decreasing?: OhlcDirectionData;
    outsidetextfont?: { color?: Color };
  }
}

export {};
