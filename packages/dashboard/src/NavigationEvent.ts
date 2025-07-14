import { makeEventFunctions } from '@deephaven/golden-layout';

const NavigationEvent = Object.freeze({
  CYCLE_TO_NEXT_STACK: 'NavigationEvent.CYCLE_TO_NEXT_STACK',
  CYCLE_TO_PREVIOUS_STACK: 'NavigationEvent.CYCLE_TO_PREVIOUS_STACK',
  CYCLE_TO_NEXT_TAB: 'NavigationEvent.CYCLE_TO_NEXT_TAB',
  CYCLE_TO_PREVIOUS_TAB: 'NavigationEvent.CYCLE_TO_PREVIOUS_TAB',
});

export const {
  listen: listenForCycleToNextStack,
  emit: emitCycleToNextStack,
  useListener: useCycleToNextStackListener,
} = makeEventFunctions(NavigationEvent.CYCLE_TO_NEXT_STACK);

export const {
  listen: listenForCycleToPreviousStack,
  emit: emitCycleToPreviousStack,
  useListener: useCycleToPreviousStackListener,
} = makeEventFunctions(NavigationEvent.CYCLE_TO_PREVIOUS_STACK);

export const {
  listen: listenForCycleToNextTab,
  emit: emitCycleToNextTab,
  useListener: useCycleToNextTabListener,
} = makeEventFunctions(NavigationEvent.CYCLE_TO_NEXT_TAB);

export const {
  listen: listenForCycleToPreviousTab,
  emit: emitCycleToPreviousTab,
  useListener: useCycleToPreviousTabListener,
} = makeEventFunctions(NavigationEvent.CYCLE_TO_PREVIOUS_TAB);

export default NavigationEvent;
