const PouchDB = jest.fn().mockImplementation(() => ({
  changes: jest.fn(() => ({
    on: jest.fn(() => {}),
  })),
  createIndex: jest.fn(),
  find: jest.fn(() => ({
    docs: [],
  })),
}));
PouchDB.plugin = jest.fn();

export default PouchDB;
