describe('Dynamic ids work properly', function () {
  var layout, item, id;

  it('creates a layout', function () {
    layout = testTools.createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });
  });

  it('finds the item', function () {
    item = layout.root.contentItems[0].contentItems[0];
    expect(item.isComponent).toBe(true);
  });

  it('has an id', function () {
    id = item.config.id;
    expect(id).not.toBe(undefined);
    expect(item.hasId('id_1')).toBe(false);
    expect(item.hasId(undefined)).toBe(false);
  });

  it('adds the second id to an array', function () {
    item.addId('id_2');
    expect(item.config.id instanceof Array).toBe(true);
    expect(item.config.id.length).toBe(2);
    expect(item.config.id[0]).toBe(id);
    expect(item.config.id[1]).toBe('id_2');
    expect(item.hasId(id)).toBe(true);
    expect(item.hasId('id_2')).toBe(true);
    expect(layout.root.getItemsById(id)[0]).toBe(item);
    expect(layout.root.getItemsById('id_2')[0]).toBe(item);
  });

  it('doesn\t add duplicated ids', function () {
    item.addId('id_2');
    expect(item.config.id instanceof Array).toBe(true);
    expect(item.config.id.length).toBe(2);
    expect(item.config.id[0]).toBe(id);
    expect(item.config.id[1]).toBe('id_2');
    expect(layout.root.getItemsById(id)[0]).toBe(item);
    expect(layout.root.getItemsById('id_2')[0]).toBe(item);
  });

  it('removes ids', function () {
    item.removeId('id_2');
    expect(item.hasId(id)).toBe(true);
    expect(item.hasId('id_2')).toBe(false);
    expect(item.config.id.length).toBe(1);
  });

  it('throws error when trying to remove a non-existant id', function () {
    var error;

    try {
      item.removeId('id_2');
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
  });

  it('destroys the layout', function () {
    layout.destroy();
  });
});
