import 'regenerator-runtime/runtime';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { TestUtils } from '@deephaven/utils';
import '../code-studio/public/__mocks__/dh-core';

HTMLCanvasElement.prototype.getContext = jest.fn(TestUtils.makeMockContext);

configure({ adapter: new Adapter() });
