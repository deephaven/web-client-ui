import 'regenerator-runtime/runtime';
import { configure } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { TestUtils } from './packages/utils/src';
import './__mocks__/dh-core';

// disable annoying dnd-react warnings
window['__react-beautiful-dnd-disable-dev-warnings'] = true;

HTMLCanvasElement.prototype.getContext = jest.fn(TestUtils.makeMockContext);

configure({ adapter: new Adapter() });
