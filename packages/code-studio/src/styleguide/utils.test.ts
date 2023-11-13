import { sampleSectionIdAndClasses } from './utils';

describe('sampleSectionIdAndClasses', () => {
  it('should return id, className, and UNSAFE_className', () => {
    const actual = sampleSectionIdAndClasses('some-id', [
      'some-class-a',
      'some-class-b',
    ]);

    expect(actual).toEqual({
      id: 'sample-section-some-id',
      className: 'sample-section some-class-a some-class-b',
      UNSAFE_className: 'sample-section some-class-a some-class-b',
    });
  });
});
