/* eslint import/no-extraneous-dependencies: "off" */
import { configure } from 'enzyme';
import { TestUtils } from '@deephaven/utils';
import Adapter from 'enzyme-adapter-react-16';
import '../public/__mocks__/dh-core';
import logInit from './log/LogInit.ts';

logInit();

configure({ adapter: new Adapter() });

// Plot.ly complains if this doesn't exist
// Can't mock plotly easily right now because of an issue with jest:
// https://github.com/facebook/jest/issues/6420
window.URL.createObjectURL = () => {};

// disable annoying dnd-react warnings
window['__react-beautiful-dnd-disable-dev-warnings'] = true;

HTMLCanvasElement.prototype.getContext = jest.fn(TestUtils.makeMockContext);
