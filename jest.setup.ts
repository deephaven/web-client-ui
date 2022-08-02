import 'regenerator-runtime/runtime';
import '@testing-library/jest-dom';
import 'jest-canvas-mock';
import './__mocks__/dh-core';
import Log from '@deephaven/log';

Log.setLogLevel(-1);

// disable annoying dnd-react warnings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
window['__react-beautiful-dnd-disable-dev-warnings' as any] = true;
