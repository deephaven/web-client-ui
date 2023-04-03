class NotebookEvent {
  static CREATE_NOTEBOOK = 'NotebookEvent.createNotebook';

  static SELECT_NOTEBOOK = 'NotebookEvent.selectNotebook';

  static CLOSE_FILE = 'NotebookEvent.closeFile';

  static RENAME = 'NotebookEvent.rename';

  static RENAME_FILE = 'NotebookEvent.renameFile';

  static REGISTER_FILE = 'NotebookEvent.registerFile';

  static SEND_TO_NOTEBOOK = 'NotebookEvent.sendToNotebook';

  static UNREGISTER_FILE = 'NotebookEvent.unregisterFile';

  static PROMOTE_FROM_PREVIEW = 'NotebookEvent.promoteFromPreview';
}

export default NotebookEvent;
