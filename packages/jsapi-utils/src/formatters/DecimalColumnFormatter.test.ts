import DecimalColumnFormatter, {
  DecimalColumnFormat,
} from './DecimalColumnFormatter';

describe('isValid', () => {
  it('should return true if a format object is valid', () => {
    expect(DecimalColumnFormatter.isValid({ formatString: '##0.00%' })).toBe(
      true
    );
  });

  // it('should return false if a format object is invalid', () => {
  //   expect(DecimalColumnFormatter.isValid({ formatString: 'zcv,./[]' })).toBe(
  //     false
  //   );
  // });
});

describe('makeFormat', () => {
  it('should create a DecimalColumnFormat object with the given arguments', () => {
    const expectedObject: DecimalColumnFormat = {
      label: 'test',
      formatString: '##0.00%',
      type: 'type-context-custom',
      multiplier: 2,
    };

    expect(
      DecimalColumnFormatter.makeFormat(
        'test',
        '##0.00%',
        'type-context-custom',
        2
      )
    ).toEqual(expectedObject);
  });
});

describe('makePresetFormat', () => {
  it('should create a DecimalColumnFormat object with preset type', () => {
    const expectedObject: DecimalColumnFormat = {
      label: 'test',
      formatString: '##0.00%',
      type: 'type-context-preset',
      multiplier: 2,
    };

    expect(
      DecimalColumnFormatter.makePresetFormat('test', '##0.00%', 2)
    ).toEqual(expectedObject);
  });
});

describe('makeCustomFormat', () => {
  it('should create a DecimalColumnFormat object with "Custom Format" label and custom type', () => {
    const expectedObject: DecimalColumnFormat = {
      label: 'Custom Format',
      formatString: '##0.00%',
      type: 'type-context-custom',
      multiplier: 2,
    };

    expect(DecimalColumnFormatter.makeCustomFormat('##0.00%', 2)).toEqual(
      expectedObject
    );
  });
});

describe('isSameFormat', () => {
  it('should return true if two format objects are the same excluding label', () => {
    const format1: DecimalColumnFormat = DecimalColumnFormatter.makeFormat(
      'format1',
      '##0.00%',
      'type-context-custom',
      2
    );
    const format2: DecimalColumnFormat = DecimalColumnFormatter.makeFormat(
      'format2',
      '##0.00%',
      'type-context-custom',
      2
    );
    expect(DecimalColumnFormatter.isSameFormat(format1, format2)).toBe(true);
  });

  it('should return false if two format objects are different excluding label', () => {
    const format1: DecimalColumnFormat = DecimalColumnFormatter.makeFormat(
      'format1',
      '##0.00%',
      'type-context-custom',
      2
    );
    const format2: DecimalColumnFormat = DecimalColumnFormatter.makeFormat(
      'format2',
      '##0.000%',
      'type-context-preset',
      3
    );
    expect(DecimalColumnFormatter.isSameFormat(format1, format2)).toBe(false);
  });
});

// describe('format', () => {
//   it('should format the value', () => {
//     const formatter = new DecimalColumnFormatter();
//     expect(formatter.format(20.2, { formatString: '##0.00%' })).toBe('20%');
//   });
// });
