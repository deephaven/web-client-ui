import {
  sampleSectionIdAndClasses,
  sampleSectionIdAndClassesSpectrum,
} from './utils';

describe('sampleSectionIdAndClasses', () => {
  it('should return id and className', () => {
    const actual = sampleSectionIdAndClasses('some-id', [
      'some-class-a',
      'some-class-b',
    ]);

    expect(actual).toEqual({
      id: 'sample-section-some-id',
      className: 'sample-section some-class-a some-class-b',
    });
  });
});

describe('sampleSectionIdAndClassesSpectrum', () => {
  it('should return id and UNSAFE_className', () => {
    const actual = sampleSectionIdAndClassesSpectrum('some-id', [
      'some-class-a',
      'some-class-b',
    ]);

    expect(actual).toEqual({
      id: 'sample-section-some-id',
      UNSAFE_className: 'sample-section some-class-a some-class-b',
    });
  });
});
