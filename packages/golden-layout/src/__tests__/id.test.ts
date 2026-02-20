import LayoutManager from '../LayoutManager';
import type { AbstractContentItem } from '../items';
import { createLayout, cleanupLayout } from '../test-utils/testUtils';

describe('Dynamic ids work properly', () => {
  let layout: LayoutManager | null = null;
  let item: AbstractContentItem;
  let id: string | string[];

  afterEach(() => {
    cleanupLayout(layout);
    layout = null;
  });

  it('creates a layout', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });
    expect(layout.isInitialised).toBe(true);
  });

  it('finds the item', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    item = layout.root.contentItems[0].contentItems[0];
    expect(item.isComponent).toBe(true);
  });

  it('has an id', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    item = layout.root.contentItems[0].contentItems[0];
    id = item.config.id!;
    expect(id).not.toBe(undefined);
    expect(item.hasId('id_1')).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(item.hasId(undefined as any)).toBe(false);
  });

  it('adds the second id to an array', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    item = layout.root.contentItems[0].contentItems[0];
    id = item.config.id!;

    item.addId('id_2');
    expect(item.config.id instanceof Array).toBe(true);
    expect(item.config.id!.length).toBe(2);
    expect(item.config.id![0]).toBe(id);
    expect(item.config.id![1]).toBe('id_2');
    expect(item.hasId(id as string)).toBe(true);
    expect(item.hasId('id_2')).toBe(true);
    expect(layout.root.getItemsById(id as string)[0]).toBe(item);
    expect(layout.root.getItemsById('id_2')[0]).toBe(item);
  });

  it("doesn't add duplicated ids", async () => {
    layout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    item = layout.root.contentItems[0].contentItems[0];
    id = item.config.id!;

    item.addId('id_2');
    item.addId('id_2'); // Try to add duplicate
    expect(item.config.id instanceof Array).toBe(true);
    expect(item.config.id!.length).toBe(2);
    expect(item.config.id![0]).toBe(id);
    expect(item.config.id![1]).toBe('id_2');
    expect(layout.root.getItemsById(id as string)[0]).toBe(item);
    expect(layout.root.getItemsById('id_2')[0]).toBe(item);
  });

  it('removes ids', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    item = layout.root.contentItems[0].contentItems[0];
    id = item.config.id!;

    item.addId('id_2');
    item.removeId('id_2');
    expect(item.hasId(id as string)).toBe(true);
    expect(item.hasId('id_2')).toBe(false);
    expect(item.config.id!.length).toBe(1);
  });

  it('throws error when trying to remove a non-existant id', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    item = layout.root.contentItems[0].contentItems[0];

    expect(() => {
      item.removeId('non_existent_id');
    }).toThrow();
  });
});
