import 'regenerator-runtime/runtime';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { TestUtils } from '@deephaven/utils';
import './__mocks__/dh-core';

// disable annoying dnd-react warnings
window['__react-beautiful-dnd-disable-dev-warnings'] = true;

HTMLCanvasElement.prototype.getContext = jest.fn(TestUtils.makeMockContext);

configure({ adapter: new Adapter() });
