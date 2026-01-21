import $ from 'jquery';
import LayoutManager from '../LayoutManager';
import {
  createLayout,
  cleanupLayout,
  verifyPath,
} from '../test-utils/testUtils';

describe('supports drag creation', () => {
  let layout: LayoutManager | null = null;

  // Mock jQuery dimension methods and visibility that jsdom doesn't support properly
  const setupDimensionMocks = () => {
    // Store original methods
    const originalOffset = $.fn.offset;
    const originalWidth = $.fn.width;
    const originalHeight = $.fn.height;
    const originalOuterWidth = $.fn.outerWidth;
    const originalOuterHeight = $.fn.outerHeight;
    const originalIs = $.fn.is;

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
      // Default sizes for layout elements
      const layoutClasses = [
        'lm_goldenlayout',
        'lm_item_container',
        'lm_content',
        'lm_root',
        'lm_stack',
        'lm_items',
        'lm_item',
      ];
      for (const cls of layoutClasses) {
        if (el.hasClass(cls)) return defaultSize;
      }
      return 100;
    };

    // Mock offset - only handles getter case (returns coordinates)
    $.fn.offset = function (this: JQuery) {
      if (this.length === 0) return undefined;
      return { left: 0, top: 0 };
    } as typeof $.fn.offset;

    // Mock width - handles both getter and setter (for chaining)
    $.fn.width = function (this: JQuery, value?: number | string) {
      if (value !== undefined) {
        // Setter - store value and return this for chaining
        this.each(function () {
          if (this instanceof HTMLElement) {
            this.style.width = typeof value === 'number' ? `${value}px` : value;
          }
        });
        return this;
      }
      // Getter
      return getDimension(this, 'width', 800);
    } as typeof $.fn.width;

    // Mock height - handles both getter and setter (for chaining)
    $.fn.height = function (this: JQuery, value?: number | string) {
      if (value !== undefined) {
        // Setter - store value and return this for chaining
        this.each(function () {
          if (this instanceof HTMLElement) {
            this.style.height =
              typeof value === 'number' ? `${value}px` : value;
          }
        });
        return this;
      }
      // Getter
      return getDimension(this, 'height', 600);
    } as typeof $.fn.height;

    // Mock outerWidth/outerHeight as getters only
    $.fn.outerWidth = function (this: JQuery) {
      return getDimension(this, 'width', 800);
    } as typeof $.fn.outerWidth;

    $.fn.outerHeight = function (this: JQuery) {
      return getDimension(this, 'height', 600);
    } as typeof $.fn.outerHeight;

    // Mock is(':visible') - jsdom doesn't compute visibility
    $.fn.is = function (this: JQuery, selector: string) {
      if (selector === ':visible') {
        // Consider layout elements as visible
        if (this.length === 0) return false;
        const layoutClasses = [
          'lm_goldenlayout',
          'lm_item_container',
          'lm_content',
          'lm_root',
          'lm_stack',
          'lm_items',
          'lm_item',
        ];
        for (const cls of layoutClasses) {
          if (this.hasClass(cls)) return true;
        }
        // Default to visible for elements in the document
        return document.body.contains(this[0]);
      }
      return originalIs.call(this, selector);
    } as typeof $.fn.is;

    return () => {
      $.fn.offset = originalOffset;
      $.fn.width = originalWidth;
      $.fn.height = originalHeight;
      $.fn.outerWidth = originalOuterWidth;
      $.fn.outerHeight = originalOuterHeight;
      $.fn.is = originalIs;
    };
  };

  afterEach(() => {
    cleanupLayout(layout);
    layout = null;
  });

  it('creates a layout', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentState: { html: '<div id="dragsource"></div>' },
              componentName: 'testComponent',
            },
          ],
        },
      ],
    });

    expect(layout.isInitialised).toBe(true);
  });

  it('creates a drag source', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentState: { html: '<div id="dragsource"></div>' },
              componentName: 'testComponent',
            },
          ],
        },
      ],
    });

    const dragSrc = layout.root.contentItems[0].element.find('#dragsource');
    expect(dragSrc.length).toBe(1);

    layout.createDragSource(dragSrc, {
      type: 'component',
      componentState: { html: '<div class="dragged"></div>' },
      componentName: 'testComponent',
    });
  });

  it('creates new components if dragged', async () => {
    const restoreMocks = setupDimensionMocks();

    try {
      layout = await createLayout({
        content: [
          {
            type: 'stack',
            content: [
              {
                type: 'component',
                componentState: { html: '<div id="dragsource"></div>' },
                componentName: 'testComponent',
              },
            ],
          },
        ],
      });

      const dragSrc = layout.root.contentItems[0].element.find('#dragsource');
      layout.createDragSource(dragSrc, {
        type: 'component',
        componentState: { html: '<div class="dragged"></div>' },
        componentName: 'testComponent',
      });

      expect($('.dragged').length).toBe(0);

      // Coordinates within the mocked layout area
      const startX = 100;
      const startY = 100;

      const mousedown = $.Event('mousedown') as JQuery.TriggeredEvent;
      mousedown.pageX = startX;
      mousedown.pageY = startY;
      mousedown.button = 0;
      dragSrc.trigger(mousedown);

      // Move more than _nDistance (10px) to trigger drag
      const mousemove = $.Event('mousemove') as JQuery.TriggeredEvent;
      mousemove.pageX = startX + 50;
      mousemove.pageY = startY + 50;
      $(document).trigger(mousemove);

      // Drop
      $(document).trigger('mouseup');

      expect($('.dragged').length).toBe(1);
      const node = verifyPath('row.0', layout);
      expect(node?.element.find('.dragged').length).toBe(1);
    } finally {
      restoreMocks();
    }
  });

  it('destroys the layout', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    layout.destroy();
    expect(layout.root.contentItems.length).toBe(0);
  });
});
