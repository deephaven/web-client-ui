import dh from '@deephaven/jsapi-shim';
import { Formatter } from '@deephaven/iris-grid';
import ChartUtils from './ChartUtils';
import ChartTestUtils from './ChartTestUtils';
import ChartTheme from './ChartTheme';

function makeFormatter() {
  return new Formatter();
}

it('groups the axes by type properly', () => {
  const testAxes = (axes, expectedResult) => {
    const chart = { axes };
    const result = ChartUtils.groupArray(chart.axes, 'type');
    expect(result).toEqual(expectedResult);
  };

  const xAxis1 = { type: 'x', label: 'x1' };
  // const xAxis2 = { type: 'x', label: 'x2' };
  // const xAxis3 = { type: 'x', label: 'x3' };
  const yAxis1 = { type: 'y', label: 'y1' };
  // const yAxis2 = { type: 'y', label: 'y3' };
  // const yAxis3 = { type: 'y', label: 'y3' };

  testAxes([], new Map());
  testAxes(
    [xAxis1, yAxis1],
    new Map([
      ['x', [xAxis1]],
      ['y', [yAxis1]],
    ])
  );
});

it('returns a newly composed layout object each time', () => {
  const layout1 = ChartUtils.makeDefaultLayout(ChartTheme);
  const layout2 = ChartUtils.makeDefaultLayout(ChartTheme);

  expect(layout1).not.toBe(layout2);
  expect(layout1.xaxis).not.toBe(layout2.xaxis);
  expect(layout1.yaxis).not.toBe(layout2.yaxis);
});

describe('date format string translations', () => {
  function testFormatString(
    format,
    expected,
    columnType = 'io.deephaven.db.tables.utils.DBDateTime',
    formatter = makeFormatter()
  ) {
    expect(
      ChartUtils.getPlotlyDateFormat(formatter, columnType, format)
    ).toEqual(expect.objectContaining({ tickformat: expected }));
  }

  it('converts date format strings properly', () => {
    testFormatString('yyyy-MM-dd', '%Y-%m-%d');
    testFormatString('yyyy-MMM-dd', '%Y-%b-%d');
    testFormatString('yyyy-MMMM-dd', '%Y-%B-%d');
    testFormatString('yy-MM-dd', '%y-%m-%d');
    testFormatString('MM-dd-yyyy', '%m-%d-%Y');
    testFormatString('HH:mm:ss', '%H:%M:%S');
    testFormatString('HH:mm:ss.SSS', '%H:%M:%S.%3f');
    testFormatString('HH:mm:ss.SSSSSSSSS', '%H:%M:%S.%9f');
    testFormatString('yyyy-MM-dd hh:mm:ss', '%Y-%m-%d %I:%M:%S');
    testFormatString('yyyy-MM-dd HH:mm:ss', '%Y-%m-%d %H:%M:%S');
    testFormatString('yyyy-MM-dd HH:mm:ss.SSS', '%Y-%m-%d %H:%M:%S.%3f');
    testFormatString('yyyy-MM-dd HH:mm:ss.SSSSSSSSS', '%Y-%m-%d %H:%M:%S.%9f');
    testFormatString('M/d h:mm', '%-m/%-d %-I:%M');
  });

  it('converts day of week properly', () => {
    testFormatString('E', '%a');
    testFormatString('EE', '%a');
    testFormatString('EEE', '%a');
    testFormatString('EEEE', '%A');
    testFormatString('EEEEE', '%A');
    testFormatString('EEEEEE', '%A');
  });

  it('strips out the timezone properly', () => {
    testFormatString('yyyy-MM-dd z', '%Y-%m-%d');
    testFormatString('yy-MM-dd z', '%y-%m-%d');
  });

  it('converts the T separator properly', () => {
    testFormatString("yyyy-MM-dd'T'HH:mm:ss", '%Y-%m-%dT%H:%M:%S');
  });
});

describe('number format string translations', () => {
  function testFormatStringDeep(
    format,
    expected,
    columnType = 'java.lang.Float',
    formatter = makeFormatter()
  ) {
    expect(
      ChartUtils.getPlotlyNumberFormat(formatter, columnType, format)
    ).toEqual(expect.objectContaining(expected));
  }

  function testFormatString(
    format,
    expected,
    columnType = 'java.lang.Float',
    formatter = makeFormatter()
  ) {
    testFormatStringDeep(
      format,
      { tickformat: expected },
      columnType,
      formatter
    );
  }

  it('converts number format strings properly', () => {
    testFormatString('###,##0', '01,.0f');
    testFormatString('###,##0.00', '01,.2f');
    testFormatString('###,##0.0000', '01,.4f');

    // IDS-4565 there's an issue in d3 with trimming insignificant digits and specifying floating points:
    // https://github.com/d3/d3-format/issues/80
    // Re-enable this test case with the '~' trim option when fixed
    // testFormatString('#.####', '00.4~f');
    testFormatString('#.####', '00.4f');
  });

  it('handles % properly', () => {
    testFormatString('##0.00%', '01.2%');
  });

  it('handles exponential notation properly', () => {
    testFormatString('0.00E00', '01.2e');
  });

  it('handles the currency prefix properly', () => {
    testFormatStringDeep('$###,##0.00', {
      tickformat: '01,.2f',
      tickprefix: '$',
    });
  });

  it('handles the currency symbol properly', () => {
    testFormatStringDeep('\u00A4###,##0.00', {
      tickformat: '01,.2f',
      tickprefix: '$',
    });
    testFormatStringDeep('\u00A4\u00A4###,##0.00', {
      tickformat: '01,.2f',
      tickprefix: 'USD',
    });
    testFormatStringDeep('###,##0.00\u00A4', {
      tickformat: '01,.2f',
      ticksuffix: '$',
    });
    testFormatStringDeep('###,##0.00\u00A4\u00A4', {
      tickformat: '01,.2f',
      ticksuffix: 'USD',
    });
  });

  it('handles ignores negative subpatterns', () => {
    // IDS-4565 No way to directly translate negative subpattern with currently version of plot.ly
    // Just parse the positive subpattern for now
    testFormatStringDeep('00.00;-(00.00)', {
      tickformat: '02.2f',
      ticksuffix: '',
    });
  });
});

describe('updating layout axes', () => {
  function makeTwinAxes() {
    return [
      ChartTestUtils.makeAxis({ label: 'X Axis' }),
      ChartTestUtils.makeAxis({
        label: 'Y Axis',
        type: dh.plot.AxisType.Y,
        position: dh.plot.AxisPosition.RIGHT,
      }),
      ChartTestUtils.makeAxis({
        label: 'Y2 Axis',
        type: dh.plot.AxisType.Y,
        position: dh.plot.AxisPosition.LEFT,
      }),
    ];
  }

  it('adds new axes', () => {
    const layout = {};
    const axes = makeTwinAxes();
    ChartUtils.updateLayoutAxes(layout, axes);
    expect(layout).toEqual(
      expect.objectContaining({
        xaxis: expect.objectContaining({
          title: expect.objectContaining({ text: axes[0].label }),
          side: 'bottom',
        }),
        yaxis: expect.objectContaining({
          title: expect.objectContaining({ text: axes[1].label }),
          side: 'right',
        }),
        yaxis2: expect.objectContaining({
          title: expect.objectContaining({ text: axes[2].label }),
          side: 'left',
        }),
      })
    );
  });

  it('keeps the same axis objects, updates domain', () => {
    const layout = {};
    const axes = makeTwinAxes();
    ChartUtils.updateLayoutAxes(layout, axes, 10);

    const { xaxis } = layout;
    const xDomain = [...xaxis.domain];
    ChartUtils.updateLayoutAxes(layout, axes, 1000);

    expect(layout.xaxis).toBe(xaxis);
    expect(xDomain).not.toBe(xaxis.domain);
  });

  it('removes stale axes', () => {
    const layout = {};
    const axes = makeTwinAxes();
    ChartUtils.updateLayoutAxes(layout, axes);
    expect(layout).toEqual(
      expect.objectContaining({
        xaxis: expect.objectContaining({}),
        yaxis: expect.objectContaining({}),
        yaxis2: expect.objectContaining({}),
      })
    );

    axes.pop();
    ChartUtils.updateLayoutAxes(layout, axes);
    expect(layout).toEqual(
      expect.objectContaining({
        xaxis: expect.objectContaining({}),
        yaxis: expect.objectContaining({}),
      })
    );
    expect(layout).not.toEqual(
      expect.objectContaining({
        yaxis2: expect.objectContaining({}),
      })
    );
  });

  it('positions multiple axes on the same side correctly', () => {
    const axes = [
      ChartTestUtils.makeAxis({ label: 'X Axis' }),
      ChartTestUtils.makeAxis({
        label: 'Y Axis',
        type: dh.plot.AxisType.Y,
        position: dh.plot.AxisPosition.RIGHT,
      }),
      ChartTestUtils.makeAxis({
        label: 'Y2 Axis',
        type: dh.plot.AxisType.Y,
        position: dh.plot.AxisPosition.RIGHT,
      }),
      ChartTestUtils.makeAxis({
        label: 'Y3 Axis',
        type: dh.plot.AxisType.Y,
        position: dh.plot.AxisPosition.RIGHT,
      }),
    ];
    const layout = {};
    const width = 400;
    const height = 1000;
    ChartUtils.updateLayoutAxes(layout, axes, width, height);
    expect(layout).toEqual(
      expect.objectContaining({
        xaxis: expect.objectContaining({
          domain: expect.arrayContaining([0, 0.5]),
        }),
        yaxis: expect.objectContaining({}),
        yaxis2: expect.objectContaining({ anchor: 'free', position: 0.6875 }),
        yaxis3: expect.objectContaining({ anchor: 'free', position: 0.875 }),
      })
    );
  });
});

describe('returns the axis layout ranges properly', () => {
  function makeLayout(layout) {
    return {
      ...ChartUtils.makeDefaultLayout(ChartTheme),
      ...layout,
    };
  }
  function testRange(layout, ranges) {
    expect(ChartUtils.getLayoutRanges(makeLayout(layout), ranges)).toEqual(
      ranges
    );
  }

  const xaxis = ChartUtils.makeLayoutAxis(dh.plot.AxisType.X);
  xaxis.range = [0, 1];
  const xaxis2 = ChartUtils.makeLayoutAxis(dh.plot.AxisType.X);
  xaxis2.range = [2, 3];
  const yaxis = ChartUtils.makeLayoutAxis(dh.plot.AxisType.Y);
  yaxis.range = [4, 5];
  const yaxis2 = ChartUtils.makeLayoutAxis(dh.plot.AxisType.Y);
  yaxis2.range = [6, 7];

  it('handles empty', () => {
    testRange({}, {});
  });
  it('handles one x-axis', () => {
    testRange({ xaxis }, { xaxis: xaxis.range });
  });
  it('handles x/y-axis', () => {
    testRange({ xaxis, yaxis }, { xaxis: xaxis.range, yaxis: yaxis.range });
  });
  it('handles multiple y-axes', () => {
    testRange(
      { xaxis, yaxis, yaxis2 },
      { xaxis: xaxis.range, yaxis: yaxis.range, yaxis2: yaxis2.range }
    );
  });
  it('handles multiple x/y-axes', () => {
    testRange(
      { xaxis, xaxis2, yaxis, yaxis2 },
      {
        xaxis: xaxis.range,
        xaxis2: xaxis2.range,
        yaxis: yaxis.range,
        yaxis2: yaxis2.range,
      }
    );
  });
});

it('converts a period time to decimal correctly', () => {
  expect(ChartUtils.periodToDecimal('06:00')).toBe(6);
  expect(ChartUtils.periodToDecimal('09:30:')).toBe(9.5);
  expect(ChartUtils.periodToDecimal('12:15')).toBe(12.25);
  expect(ChartUtils.periodToDecimal('15:45')).toBe(15.75);
  expect(ChartUtils.periodToDecimal('21:00')).toBe(21);
});

it('creates correct bounds from business days', () => {
  expect(
    ChartUtils.createBoundsFromDays([
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
    ])
  ).toStrictEqual([[6, 1]]);
  expect(
    ChartUtils.createBoundsFromDays([
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
    ])
  ).toStrictEqual([[6, 2]]);
  expect(
    ChartUtils.createBoundsFromDays([
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
    ])
  ).toStrictEqual([[5, 1]]);
  expect(
    ChartUtils.createBoundsFromDays(['MONDAY', 'TUESDAY', 'THURSDAY', 'FRIDAY'])
  ).toStrictEqual([
    [6, 1],
    [3, 4],
  ]);
  expect(
    ChartUtils.createBoundsFromDays([
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
    ])
  ).toStrictEqual([[5, 1]]);
  expect(
    ChartUtils.createBoundsFromDays(['MONDAY', 'WEDNESDAY', 'FRIDAY'])
  ).toStrictEqual([
    [6, 1],
    [2, 3],
    [4, 5],
  ]);
  expect(
    ChartUtils.createBoundsFromDays(['WEDNESDAY', 'THURSDAY'])
  ).toStrictEqual([[5, 3]]);
});

it('creates range breaks from holidays correctly', () => {
  const holidays = [
    new dh.Holiday('2020-06-22', []),
    new dh.Holiday('2020-06-22', [new dh.BusinessPeriod('10:00', '14:00')]),
    new dh.Holiday('2020-08-23', []),
    new dh.Holiday('2020-03-12', [
      new dh.BusinessPeriod('07:00', '08:00'),
      new dh.BusinessPeriod('21:00', '22:00'),
    ]),
  ];
  expect(ChartUtils.createRangeBreakValuesFromHolidays(holidays)).toStrictEqual(
    [
      { values: ['2020-06-22 00:00:00.000000', '2020-08-23 00:00:00.000000'] },
      {
        dvalue: 36000000,
        values: ['2020-06-22 00:00:00.000000'],
      },
      {
        dvalue: 36000000,
        values: ['2020-06-22 14:00:00.000000'],
      },
      {
        dvalue: 25200000,
        values: ['2020-03-12 00:00:00.000000'],
      },
      {
        dvalue: 46800000,
        values: ['2020-03-12 08:00:00.000000'],
      },
      {
        dvalue: 7200000,
        values: ['2020-03-12 22:00:00.000000'],
      },
    ]
  );
});
