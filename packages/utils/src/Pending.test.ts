import Pending from './Pending';

it('wraps added promises and returns a cancelable promise', async () => {
  const item = 'item';
  const pending = new Pending();
  const promise = pending.add(item);

  expect(promise.cancel).not.toBe(null);

  const result = await promise;

  expect(result).toBe(item);
});

it('cancels pending promises properly', () => {
  const item = Promise.resolve();
  const pending = new Pending();
  const promise = pending.add(item);
  promise.cancel = jest.fn();

  expect(promise.cancel).not.toHaveBeenCalled();

  pending.cancel();

  expect(promise.cancel).toHaveBeenCalled();
});

// TODO: This behaviour should change in DH-9464
it('cancels resolved and rejected promises properly', async () => {
  const resolved = Promise.resolve();
  const rejected = Promise.reject();
  const pending = new Pending();
  const promise1 = pending.add(resolved);
  const promise2 = pending.add(rejected);
  const spy1 = jest.spyOn(promise1, 'cancel');
  const spy2 = jest.spyOn(promise2, 'cancel');

  expect(spy1).not.toHaveBeenCalled();
  expect(spy2).not.toHaveBeenCalled();

  pending.cancel();

  expect(spy1).toHaveBeenCalled();
  expect(spy2).toHaveBeenCalled();
});

it('handles multiple promises', async () => {
  const pending = new Pending();

  const spies = [];
  for (let i = 0; i < 10; i += 1) {
    const promise = pending.add('item');
    const spy = jest.spyOn(promise, 'cancel');
    spies.push(spy);
  }

  pending.cancel();

  for (let i = 0; i < spies.length; i += 1) {
    expect(spies[i]).toHaveBeenCalled();
  }
});

it('cleanup is called if promise is cancelled while pending', async () => {
  const pending = new Pending();
  const item = 'TEST';
  const cleanup = jest.fn();
  pending.add(Promise.resolve(item), cleanup);
  pending.cancel();

  // Cleanup in DH-9464
  await Promise.all(pending.pending);

  expect(cleanup).toHaveBeenCalledWith(item);
});
