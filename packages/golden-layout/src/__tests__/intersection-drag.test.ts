import $ from 'jquery';
import LayoutManager from '../LayoutManager';
import {
  createLayout,
  cleanupLayout,
  verifyPath,
} from '../test-utils/testUtils';

describe('intersection splitter drag', () => {
  let layout: LayoutManager | null = null;

  const dragElement = async (
    element: JQuery,
    startX: number,
    startY: number,
    deltaX: number,
    deltaY: number
  ) => {
    const mousedown = $.Event('mousedown') as JQuery.TriggeredEvent;
    mousedown.pageX = startX;
    mousedown.pageY = startY;
    mousedown.button = 0;
    element.trigger(mousedown);

    const mousemove = $.Event('mousemove') as JQuery.TriggeredEvent;
    mousemove.pageX = startX + deltaX;
    mousemove.pageY = startY + deltaY;
    $(document).trigger(mousemove);

    $(document).trigger('mouseup');

    await new Promise<void>(resolve => {
      window.requestAnimationFrame(() => resolve());
    });
  };

  const setupDimensionMocks = () => {
    const originalOffset = $.fn.offset;
    const originalWidth = $.fn.width;
    const originalHeight = $.fn.height;
    const originalOuterWidth = $.fn.outerWidth;
    const originalOuterHeight = $.fn.outerHeight;

    const getDimension = (
      el: JQuery,
      dimension: 'width' | 'height',
      defaultSize: number
    ): number => {
      if (el.length === 0) return 0;
      const element = el[0];
      if (element instanceof HTMLElement) {
        const value = parseInt(element.style[dimension], 10);
        if (!isNaN(value)) return value;
      }
      return defaultSize;
    };

    $.fn.offset = function (this: JQuery) {
      if (this.length === 0) return undefined;
      return { left: 0, top: 0 };
    } as typeof $.fn.offset;

    $.fn.width = function (this: JQuery, value?: number | string) {
      if (value !== undefined) {
        this.each(function () {
          if (this instanceof HTMLElement) {
            this.style.width = typeof value === 'number' ? `${value}px` : value;
          }
        });
        return this;
      }
      return getDimension(this, 'width', 800);
    } as typeof $.fn.width;

    $.fn.height = function (this: JQuery, value?: number | string) {
      if (value !== undefined) {
        this.each(function () {
          if (this instanceof HTMLElement) {
            this.style.height =
              typeof value === 'number' ? `${value}px` : value;
          }
        });
        return this;
      }
      return getDimension(this, 'height', 600);
    } as typeof $.fn.height;

    $.fn.outerWidth = function (this: JQuery) {
      return getDimension(this, 'width', 800);
    } as typeof $.fn.outerWidth;

    $.fn.outerHeight = function (this: JQuery) {
      return getDimension(this, 'height', 600);
    } as typeof $.fn.outerHeight;

    return () => {
      $.fn.offset = originalOffset;
      $.fn.width = originalWidth;
      $.fn.height = originalHeight;
      $.fn.outerWidth = originalOuterWidth;
      $.fn.outerHeight = originalOuterHeight;
    };
  };

  afterEach(() => {
    cleanupLayout(layout);
    layout = null;
  });

  it('supports diagonal drag at a T-junction intersection', async () => {
    const restoreMocks = setupDimensionMocks();

    try {
      layout = await createLayout({
        content: [
          {
            type: 'column',
            content: [
              {
                type: 'component',
                componentName: 'testComponent',
              },
              {
                type: 'row',
                content: [
                  {
                    type: 'column',
                    content: [
                      {
                        type: 'component',
                        componentName: 'testComponent',
                      },
                      {
                        type: 'component',
                        componentName: 'testComponent',
                      },
                    ],
                  },
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                ],
              },
            ],
          },
        ],
      });

      const bottomRow = verifyPath('column.1.row', layout) as any;
      const leftColumn = verifyPath('column.1.row.0.column', layout) as any;

      expect(bottomRow).toBeDefined();
      expect(leftColumn).toBeDefined();

      const intersectionHandle = bottomRow.element
        .find('.lm_intersection_splitter')
        .first();
      expect(intersectionHandle.length).toBe(1);

      const initialLeftWidth = bottomRow.contentItems[0].config.width;
      const initialLeftTopHeight = leftColumn.contentItems[0].config.height;

      const startX = 100;
      const startY = 100;

      const mousedown = $.Event('mousedown') as JQuery.TriggeredEvent;
      mousedown.pageX = startX;
      mousedown.pageY = startY;
      mousedown.button = 0;
      intersectionHandle.trigger(mousedown);

      const mousemove = $.Event('mousemove') as JQuery.TriggeredEvent;
      mousemove.pageX = startX - 60;
      mousemove.pageY = startY - 60;
      $(document).trigger(mousemove);

      $(document).trigger('mouseup');

      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => resolve());
      });

      expect(bottomRow.contentItems[0].config.width).not.toBe(initialLeftWidth);
      expect(leftColumn.contentItems[0].config.height).not.toBe(
        initialLeftTopHeight
      );
    } finally {
      restoreMocks();
    }
  });

  it('supports diagonal drag on the second intersection in a full grid', async () => {
    const restoreMocks = setupDimensionMocks();

    try {
      layout = await createLayout({
        content: [
          {
            type: 'row',
            content: [
              {
                type: 'column',
                content: [
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                ],
              },
              {
                type: 'column',
                content: [
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                ],
              },
            ],
          },
        ],
      });

      const rootRow = verifyPath('row', layout) as any;
      const leftColumn = verifyPath('row.0.column', layout) as any;

      expect(rootRow).toBeDefined();
      expect(leftColumn).toBeDefined();

      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => resolve());
      });

      const intersections = rootRow.element.find('.lm_intersection_splitter');
      expect(intersections.length).toBeGreaterThanOrEqual(1);

      const secondIntersection = intersections.eq(1);

      const initialLeftWidth = rootRow.contentItems[0].config.width;
      const initialMiddleHeight = leftColumn.contentItems[1].config.height;

      const startX = 180;
      const startY = 180;

      const mousedown = $.Event('mousedown') as JQuery.TriggeredEvent;
      mousedown.pageX = startX;
      mousedown.pageY = startY;
      mousedown.button = 0;
      secondIntersection.trigger(mousedown);

      const mousemove = $.Event('mousemove') as JQuery.TriggeredEvent;
      mousemove.pageX = startX - 50;
      mousemove.pageY = startY - 50;
      $(document).trigger(mousemove);

      $(document).trigger('mouseup');

      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => resolve());
      });

      expect(rootRow.contentItems[0].config.width).not.toBe(initialLeftWidth);
      expect(leftColumn.contentItems[1].config.height).not.toBe(
        initialMiddleHeight
      );
    } finally {
      restoreMocks();
    }
  });

  it('keeps all intersection handles after repeated size refreshes', async () => {
    const restoreMocks = setupDimensionMocks();

    try {
      layout = await createLayout({
        content: [
          {
            type: 'row',
            content: [
              {
                type: 'column',
                content: [
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                ],
              },
              {
                type: 'column',
                content: [
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                ],
              },
            ],
          },
        ],
      });

      const rootRow = verifyPath('row', layout) as any;
      expect(rootRow).toBeDefined();

      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => resolve());
      });

      const beforeRefreshCount = rootRow.element.find(
        '.lm_intersection_splitter'
      ).length;
      expect(beforeRefreshCount).toBeGreaterThanOrEqual(1);

      rootRow.element.width(900);
      rootRow.element.height(650);
      rootRow.setSize();
      rootRow.setSize();

      const afterRefreshCount = rootRow.element.find(
        '.lm_intersection_splitter'
      ).length;
      expect(afterRefreshCount).toBeGreaterThanOrEqual(beforeRefreshCount);
    } finally {
      restoreMocks();
    }
  });

  it('creates intersection handles from both sides of a parent splitter', async () => {
    const restoreMocks = setupDimensionMocks();

    try {
      layout = await createLayout({
        content: [
          {
            type: 'row',
            content: [
              {
                type: 'column',
                content: [
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                ],
              },
              {
                type: 'column',
                content: [
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                  {
                    type: 'component',
                    componentName: 'testComponent',
                  },
                ],
              },
            ],
          },
        ],
      });

      const rootRow = verifyPath('row', layout) as any;
      expect(rootRow).toBeDefined();

      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => resolve());
      });

      const intersections = rootRow.element.find('.lm_intersection_splitter');
      expect(intersections.length).toBeGreaterThanOrEqual(2);
    } finally {
      restoreMocks();
    }
  });

  it('creates a handle for a perpendicular splitter nested deeper than one level', async () => {
    const restoreMocks = setupDimensionMocks();

    try {
      // The bottom row holds a left column whose first child is itself a row.
      // That inner row's vertical splitter is two levels below the root column's
      // top/bottom bar yet its top still touches it, so the bar owner (the root
      // column) must create a crossing handle for it.
      layout = await createLayout({
        content: [
          {
            type: 'column',
            content: [
              { type: 'component', componentName: 'testComponent' },
              {
                type: 'row',
                content: [
                  {
                    type: 'column',
                    content: [
                      {
                        type: 'row',
                        content: [
                          { type: 'component', componentName: 'testComponent' },
                          { type: 'component', componentName: 'testComponent' },
                        ],
                      },
                      { type: 'component', componentName: 'testComponent' },
                    ],
                  },
                  { type: 'component', componentName: 'testComponent' },
                ],
              },
            ],
          },
        ],
      });

      const rootColumn = verifyPath('column', layout) as any;
      expect(rootColumn).toBeDefined();

      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => resolve());
      });

      // Handles owned by the root column are appended directly into its element.
      // It owns one for the bottom row's own vertical splitter (left column |
      // right component) and one for the deeply nested inner-row splitter.
      const rootOwnedHandles = rootColumn.element.children(
        '.lm_intersection_splitter'
      );
      expect(rootOwnedHandles.length).toBe(2);
    } finally {
      restoreMocks();
    }
  });

  it('preserves all intersection handles after normal vertical and horizontal splitter drags', async () => {
    const restoreMocks = setupDimensionMocks();

    try {
      layout = await createLayout({
        content: [
          {
            type: 'row',
            content: [
              {
                type: 'column',
                content: [
                  { type: 'component', componentName: 'testComponent' },
                  { type: 'component', componentName: 'testComponent' },
                  { type: 'component', componentName: 'testComponent' },
                ],
              },
              {
                type: 'column',
                content: [
                  { type: 'component', componentName: 'testComponent' },
                  { type: 'component', componentName: 'testComponent' },
                  { type: 'component', componentName: 'testComponent' },
                ],
              },
              {
                type: 'column',
                content: [
                  { type: 'component', componentName: 'testComponent' },
                  { type: 'component', componentName: 'testComponent' },
                  { type: 'component', componentName: 'testComponent' },
                ],
              },
            ],
          },
        ],
      });

      const rootRow = verifyPath('row', layout) as any;
      const leftColumn = verifyPath('row.0.column', layout) as any;

      expect(rootRow).toBeDefined();
      expect(leftColumn).toBeDefined();

      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => resolve());
      });

      const initialCount = rootRow.element.find(
        '.lm_intersection_splitter'
      ).length;
      expect(initialCount).toBeGreaterThanOrEqual(2);

      const verticalSplitter = rootRow.element
        .find('.lm_splitter.lm_vertical')
        .first();
      expect(verticalSplitter.length).toBe(1);
      await dragElement(verticalSplitter, 200, 200, 40, 0);

      const horizontalSplitter = leftColumn.element
        .find('.lm_splitter')
        .first();
      expect(horizontalSplitter.length).toBe(1);
      await dragElement(horizontalSplitter, 200, 200, 0, 40);

      const finalCount = rootRow.element.find(
        '.lm_intersection_splitter'
      ).length;
      expect(finalCount).toBeGreaterThanOrEqual(initialCount);
    } finally {
      restoreMocks();
    }
  });

  it('highlights both splitter lines while dragging and clears them on stop', async () => {
    const restoreMocks = setupDimensionMocks();

    try {
      layout = await createLayout({
        content: [
          {
            type: 'column',
            content: [
              { type: 'component', componentName: 'testComponent' },
              {
                type: 'row',
                content: [
                  {
                    type: 'column',
                    content: [
                      { type: 'component', componentName: 'testComponent' },
                      { type: 'component', componentName: 'testComponent' },
                    ],
                  },
                  { type: 'component', componentName: 'testComponent' },
                ],
              },
            ],
          },
        ],
      });

      const bottomRow = verifyPath('column.1.row', layout) as any;
      expect(bottomRow).toBeDefined();

      const intersectionHandle = bottomRow.element
        .find('.lm_intersection_splitter')
        .first();
      expect(intersectionHandle.length).toBe(1);

      const startX = 100;
      const startY = 100;
      const mousedown = $.Event('mousedown') as JQuery.TriggeredEvent;
      mousedown.pageX = startX;
      mousedown.pageY = startY;
      mousedown.button = 0;
      intersectionHandle.trigger(mousedown);

      const mousemove = $.Event('mousemove') as JQuery.TriggeredEvent;
      mousemove.pageX = startX - 40;
      mousemove.pageY = startY - 40;
      $(document).trigger(mousemove);

      // While dragging, both perpendicular splitter lines are highlighted.
      expect(bottomRow.element.find('.lm_splitter.lm_dragging').length).toBe(2);

      $(document).trigger('mouseup');
      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => resolve());
      });

      // Once the drag stops (pointer not over the handle), highlight is cleared.
      expect(bottomRow.element.find('.lm_splitter.lm_dragging').length).toBe(0);
    } finally {
      restoreMocks();
    }
  });

  it('highlights both splitter lines on hover and clears them on leave', async () => {
    const restoreMocks = setupDimensionMocks();

    try {
      layout = await createLayout({
        content: [
          {
            type: 'column',
            content: [
              { type: 'component', componentName: 'testComponent' },
              {
                type: 'row',
                content: [
                  {
                    type: 'column',
                    content: [
                      { type: 'component', componentName: 'testComponent' },
                      { type: 'component', componentName: 'testComponent' },
                    ],
                  },
                  { type: 'component', componentName: 'testComponent' },
                ],
              },
            ],
          },
        ],
      });

      const bottomRow = verifyPath('column.1.row', layout) as any;
      expect(bottomRow).toBeDefined();

      const intersectionHandle = bottomRow.element
        .find('.lm_intersection_splitter')
        .first();
      expect(intersectionHandle.length).toBe(1);

      intersectionHandle.trigger('mouseenter');
      expect(bottomRow.element.find('.lm_splitter.lm_dragging').length).toBe(2);

      intersectionHandle.trigger('mouseleave');
      expect(bottomRow.element.find('.lm_splitter.lm_dragging').length).toBe(0);
    } finally {
      restoreMocks();
    }
  });

  it('stretches the stem line with a transform (not box size) and clears it on stop', async () => {
    const restoreMocks = setupDimensionMocks();

    try {
      layout = await createLayout({
        content: [
          {
            type: 'column',
            content: [
              { type: 'component', componentName: 'testComponent' },
              {
                type: 'row',
                content: [
                  {
                    type: 'column',
                    content: [
                      { type: 'component', componentName: 'testComponent' },
                      { type: 'component', componentName: 'testComponent' },
                    ],
                  },
                  { type: 'component', componentName: 'testComponent' },
                ],
              },
            ],
          },
        ],
      });

      const bottomRow = verifyPath('column.1.row', layout) as any;
      expect(bottomRow).toBeDefined();

      const intersectionHandle = bottomRow.element
        .find('.lm_intersection_splitter')
        .first();
      expect(intersectionHandle.length).toBe(1);

      // The stem line is the vertical splitter inside the bottom row.
      const stemLine = bottomRow.element.find('.lm_splitter.lm_vertical');
      expect(stemLine.length).toBe(1);
      const stemEl = stemLine[0] as HTMLElement;

      const startX = 100;
      const startY = 100;
      const mousedown = $.Event('mousedown') as JQuery.TriggeredEvent;
      mousedown.pageX = startX;
      mousedown.pageY = startY;
      mousedown.button = 0;
      intersectionHandle.trigger(mousedown);

      const mousemove = $.Event('mousemove') as JQuery.TriggeredEvent;
      mousemove.pageX = startX - 40;
      mousemove.pageY = startY - 40;
      $(document).trigger(mousemove);

      // While dragging, the stem is stretched via a scale transform - never by
      // mutating its box size, which would reflow sibling panes and headers.
      expect(stemEl.style.transform).toContain('scale');
      expect(stemEl.style.width).toBe('');

      $(document).trigger('mouseup');
      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => resolve());
      });

      // The transform is cleared once the drag stops.
      expect(stemEl.style.transform).toBe('');
    } finally {
      restoreMocks();
    }
  });

  it('keeps stem transform scale positive on large intersection drags', async () => {
    const restoreMocks = setupDimensionMocks();

    try {
      layout = await createLayout({
        content: [
          {
            type: 'column',
            content: [
              { type: 'component', componentName: 'testComponent' },
              {
                type: 'row',
                content: [
                  {
                    type: 'column',
                    content: [
                      { type: 'component', componentName: 'testComponent' },
                      { type: 'component', componentName: 'testComponent' },
                    ],
                  },
                  { type: 'component', componentName: 'testComponent' },
                ],
              },
            ],
          },
        ],
      });

      const bottomRow = verifyPath('column.1.row', layout) as any;
      expect(bottomRow).toBeDefined();

      const intersectionHandle = bottomRow.element
        .find('.lm_intersection_splitter')
        .first();
      expect(intersectionHandle.length).toBe(1);

      const stemLine = bottomRow.element.find('.lm_splitter.lm_vertical');
      expect(stemLine.length).toBe(1);
      const stemEl = stemLine[0] as HTMLElement;

      const startX = 100;
      const startY = 100;
      const mousedown = $.Event('mousedown') as JQuery.TriggeredEvent;
      mousedown.pageX = startX;
      mousedown.pageY = startY;
      mousedown.button = 0;
      intersectionHandle.trigger(mousedown);

      // Drive far past practical bounds to ensure clamping never inverts or
      // collapses the stretched stem line.
      const mousemove = $.Event('mousemove') as JQuery.TriggeredEvent;
      mousemove.pageX = startX - 5000;
      mousemove.pageY = startY - 5000;
      $(document).trigger(mousemove);

      const transform = stemEl.style.transform;
      expect(transform).toContain('scale');
      const match = transform.match(/scale[XY]\(([-\d.]+)\)/);
      expect(match).not.toBeNull();
      expect(Number(match?.[1] ?? '0')).toBeGreaterThan(0);

      $(document).trigger('mouseup');
    } finally {
      restoreMocks();
    }
  });

  it('does not highlight other intersections while one intersection drag is active', async () => {
    const restoreMocks = setupDimensionMocks();

    try {
      layout = await createLayout({
        content: [
          {
            type: 'row',
            content: [
              {
                type: 'column',
                content: [
                  { type: 'component', componentName: 'testComponent' },
                  {
                    type: 'row',
                    content: [
                      {
                        type: 'column',
                        content: [
                          {
                            type: 'component',
                            componentName: 'testComponent',
                          },
                          {
                            type: 'component',
                            componentName: 'testComponent',
                          },
                        ],
                      },
                      { type: 'component', componentName: 'testComponent' },
                    ],
                  },
                ],
              },
              {
                type: 'column',
                content: [
                  { type: 'component', componentName: 'testComponent' },
                  {
                    type: 'row',
                    content: [
                      {
                        type: 'column',
                        content: [
                          {
                            type: 'component',
                            componentName: 'testComponent',
                          },
                          {
                            type: 'component',
                            componentName: 'testComponent',
                          },
                        ],
                      },
                      { type: 'component', componentName: 'testComponent' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const handles = $('.lm_intersection_splitter');
      expect(handles.length).toBeGreaterThanOrEqual(2);

      const firstHandle = handles.eq(0);
      const secondHandle = handles.eq(1);

      const startX = 100;
      const startY = 100;
      const mousedown = $.Event('mousedown') as JQuery.TriggeredEvent;
      mousedown.pageX = startX;
      mousedown.pageY = startY;
      mousedown.button = 0;
      firstHandle.trigger(mousedown);

      const mousemove = $.Event('mousemove') as JQuery.TriggeredEvent;
      mousemove.pageX = startX - 30;
      mousemove.pageY = startY - 30;
      $(document).trigger(mousemove);

      // Exactly the dragged intersection's two lines should be highlighted.
      expect($('.lm_splitter.lm_intersection_line').length).toBe(2);

      // Crossing another handle during drag must not add highlight lines.
      secondHandle.trigger('mouseenter');
      expect($('.lm_splitter.lm_intersection_line').length).toBe(2);

      $(document).trigger('mouseup');
      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => resolve());
      });
    } finally {
      restoreMocks();
    }
  });

  it('does not highlight the cross while a 1D golden-layout drag is active', async () => {
    const restoreMocks = setupDimensionMocks();

    try {
      layout = await createLayout({
        content: [
          {
            type: 'column',
            content: [
              { type: 'component', componentName: 'testComponent' },
              {
                type: 'row',
                content: [
                  {
                    type: 'column',
                    content: [
                      { type: 'component', componentName: 'testComponent' },
                      { type: 'component', componentName: 'testComponent' },
                    ],
                  },
                  { type: 'component', componentName: 'testComponent' },
                ],
              },
            ],
          },
        ],
      });

      const bottomRow = verifyPath('column.1.row', layout) as any;
      expect(bottomRow).toBeDefined();

      const intersectionHandle = bottomRow.element
        .find('.lm_intersection_splitter')
        .first();
      expect(intersectionHandle.length).toBe(1);

      // Simulate an in-progress golden-layout drag (a 1D splitter drag or a
      // panel drag), which sets `lm_dragging` on the body.
      $(document.body).addClass('lm_dragging');
      try {
        intersectionHandle.trigger('mouseenter');

        // The crossing must stay inert - no highlight lines added mid-drag.
        expect(
          bottomRow.element.find('.lm_splitter.lm_intersection_line').length
        ).toBe(0);
      } finally {
        $(document.body).removeClass('lm_dragging');
      }
    } finally {
      restoreMocks();
    }
  });
});
