export default function assertNotNull<T>(
  value: T | null | undefined
): asserts value is T {
  if (value == null) throw new Error('Value is null or undefined');
}
