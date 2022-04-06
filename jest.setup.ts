import 'regenerator-runtime/runtime';
import '@testing-library/jest-dom';
import 'jest-canvas-mock';
import { configure } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import './__mocks__/dh-core';

// disable annoying dnd-react warnings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
window['__react-beautiful-dnd-disable-dev-warnings' as any] = true;

configure({ adapter: new Adapter() });
