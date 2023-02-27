import { EventShimCustomEvent } from './EventTargetShimUtils';

it('should create an EventShimCustomEvent', () => {
  const event = new EventShimCustomEvent('test');
  expect(event.type).toBe('test');
});
