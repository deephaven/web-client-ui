import LayoutManager from '../LayoutManager';
import type { AbstractContentItem, Stack } from '../items';
import { createLayout, cleanupLayout } from '../test-utils/testUtils';

function component() {
  return { type: 'component' as const, componentName: 'testComponent' };
}

/**
 * Expects each row/column's child elements (ignoring splitters) to match its content items, in order
 */
function expectDomMatchesTree(item: AbstractContentItem) {
  if (item.isRow || item.isColumn) {
    const childElements = item.childElementContainer
      .children()
      .not('.lm_splitter')
      .toArray();
    expect(childElements).toEqual(
      item.contentItems.map(
        child =>
          (child.isMaximised
            ? child.layoutManager.root.element.find('.lm_maximise_place')
            : child.element)[0]
      )
    );
  }
  item.contentItems.forEach(child => {
    if (!child.isComponent) {
      expectDomMatchesTree(child);
    }
  });
}

function expectSingleRootChild(layout: LayoutManager, maximised?: Stack) {
  const rootChildren = layout.root.element
    .children()
    .toArray()
    .filter(el => el !== maximised?.element[0]);
  expect(rootChildren).toEqual([layout.root.contentItems[0].element[0]]);
}

describe('tree manipulation while an item is maximised', () => {
  let layout: LayoutManager | null = null;

  afterEach(() => {
    cleanupLayout(layout);
    layout = null;
  });

  it('adds a sibling next to a maximised stack in its layout position', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'column',
          content: [
            { type: 'stack', content: [component()] },
            {
              type: 'row',
              content: [{ type: 'stack', content: [component()] }],
            },
          ],
        },
      ],
    });
    const row = layout.root.contentItems[0].contentItems[1];
    const maximised = row.contentItems[0] as Stack;
    maximised.toggleMaximise();

    row.addChild({ type: 'stack', content: [component()] });

    expect(maximised.isMaximised).toBe(true);
    expect(maximised.element.parent()[0]).toBe(layout.root.element[0]);
    expectSingleRootChild(layout, maximised);
    expectDomMatchesTree(layout.root.contentItems[0]);

    maximised.toggleMaximise();

    expectSingleRootChild(layout);
    expectDomMatchesTree(layout.root.contentItems[0]);
  });

  it('wraps a maximised stack in a new row in its layout position', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'column',
          content: [
            { type: 'stack', content: [component()] },
            { type: 'stack', content: [component()] },
          ],
        },
      ],
    });
    const column = layout.root.contentItems[0];
    const maximised = column.contentItems[1] as Stack;
    maximised.toggleMaximise();

    const row = layout.createContentItem({ type: 'row' }, column);
    column.replaceChild(maximised, row);
    row.addChild(maximised);
    row.addChild({ type: 'stack', content: [component()] });

    expect(maximised.isMaximised).toBe(true);
    expectSingleRootChild(layout, maximised);
    expectDomMatchesTree(column);

    maximised.toggleMaximise();

    expectSingleRootChild(layout);
    expectDomMatchesTree(column);
    expect(column.contentItems[1]).toBe(row);
    expect(row.contentItems[0]).toBe(maximised);
  });

  it('promotes a maximised stack when its sibling is removed', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'row',
          isClosable: true,
          content: [
            { type: 'stack', content: [component()] },
            { type: 'stack', content: [component()] },
          ],
        },
      ],
    });
    const row = layout.root.contentItems[0];
    const maximised = row.contentItems[0] as Stack;
    const retainedComponent = maximised.contentItems[0];
    maximised.toggleMaximise();
    const placeholder = layout.root.element.find('.lm_maximise_place')[0];

    row.contentItems[1].remove();

    expect(layout.root.contentItems).toEqual([maximised]);
    expect(maximised.parent).toBe(layout.root);
    expect(maximised.isMaximised).toBe(true);
    expect(layout.root.element.children().toArray()).toEqual([
      maximised.element[0],
      placeholder,
    ]);
    expect(row.element.parent()).toHaveLength(0);
    expect(maximised.contentItems[0]).toBe(retainedComponent);
    expect(
      maximised.element[0].contains(retainedComponent.element[0])
    ).toBe(true);

    maximised.toggleMaximise();

    expect(maximised.isMaximised).toBe(false);
    expect(layout.root.element.find('.lm_maximise_place')).toHaveLength(0);
    expectSingleRootChild(layout);
  });
});
