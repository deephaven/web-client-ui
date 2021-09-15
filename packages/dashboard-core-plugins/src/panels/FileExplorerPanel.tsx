import Log from '@deephaven/log';
import { getFileStorage } from '@deephaven/redux';
import FileExplorer, {
  FileExplorerToolbar,
  FileStorage,
  FileStorageItem,
  NewItemModal,
} from '@deephaven/file-explorer';
import GoldenLayout from '@deephaven/golden-layout';
import React, { ReactNode } from 'react';
import { connect } from 'react-redux';
import Panel from './Panel';
import { NotebookEvent } from '../events';
import './FileExplorerPanel.scss';
import { getSessionWrapper } from '../../redux';

const log = Log.module('FileExplorerPanel');

type DhSession = {
  close: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FileExplorerPanelProps {
  fileStorage: FileStorage;
  glContainer: GoldenLayout.Container;
  glEventHub: GoldenLayout.EventEmitter;
  language: string;
  session?: DhSession;
}

export interface FileExplorerPanelState {
  isShown: boolean;
  language?: string;
  session?: DhSession;
  showCreateFolder: boolean;
}

/**
 * Panel for showing a FileExplorer in a Dashboard.
 */
export class FileExplorerPanel extends React.Component<
  FileExplorerPanelProps,
  FileExplorerPanelState
> {
  static COMPONENT = 'FileExplorerPanel';

  static TITLE = 'File Explorer';

  static handleError(error: Error): void {
    log.error(error);
  }

  constructor(props: FileExplorerPanelProps) {
    super(props);

    this.handleFileSelect = this.handleFileSelect.bind(this);
    this.handleCreateFile = this.handleCreateFile.bind(this);
    this.handleCreateDirectory = this.handleCreateDirectory.bind(this);
    this.handleCreateDirectoryCancel = this.handleCreateDirectoryCancel.bind(
      this
    );
    this.handleCreateDirectorySubmit = this.handleCreateDirectorySubmit.bind(
      this
    );
    this.handleDelete = this.handleDelete.bind(this);
    this.handleRename = this.handleRename.bind(this);
    this.handleSessionOpened = this.handleSessionOpened.bind(this);
    this.handleSessionClosed = this.handleSessionClosed.bind(this);
    this.handleShow = this.handleShow.bind(this);

    const { session, language } = props;
    this.state = {
      isShown: false,
      language,
      session,
      showCreateFolder: false,
    };
  }

  componentDidMount(): void {
    if (!this.isHidden()) {
      this.setState({ isShown: true });
    }
  }

  handleCreateFile(): void {
    const { glEventHub } = this.props;
    const { session, language } = this.state;
    const notebookSettings = {
      language,
      value: '',
    };
    log.debug('handleCreateFile', session, language, notebookSettings);
    glEventHub.emit(
      NotebookEvent.CREATE_NOTEBOOK,
      session,
      language,
      notebookSettings
    );
  }

  handleCreateDirectory(path?: string): void {
    this.setState({ showCreateFolder: true });
  }

  handleCreateDirectoryCancel(): void {
    log.debug('handleCreateDirectoryCancel');
    this.setState({
      showCreateFolder: false,
    });
  }

  handleCreateDirectorySubmit(path: string): void {
    log.debug('handleCreateDirectorySubmit', path);
    this.setState({ showCreateFolder: false });
    const { fileStorage } = this.props;
    fileStorage.createDirectory(path).catch(FileExplorerPanel.handleError);
  }

  handleDelete(files: FileStorageItem[]): void {
    const { glEventHub } = this.props;
    files.forEach(file => {
      glEventHub.emit(NotebookEvent.CLOSE_FILE, {
        id: file.filename,
        itemName: file.filename,
      });
    });
  }

  handleFileSelect(file: FileStorageItem): void {
    log.debug('fileSelect', file);
    if (file.type === 'directory') {
      return;
    }

    const fileMetadata = { id: file.filename, itemName: file.filename };
    const { glEventHub } = this.props;
    const { session, language } = this.state;
    const notebookSettings = {
      value: null,
      language,
    };
    glEventHub.emit(
      NotebookEvent.SELECT_NOTEBOOK,
      session,
      language,
      notebookSettings,
      fileMetadata
    );
  }

  handleRename(oldName: string, newName: string): void {
    const { glEventHub } = this.props;
    log.debug('handleRename', oldName, newName);
    glEventHub.emit(NotebookEvent.RENAME_FILE, oldName, newName);
  }

  handleSessionOpened(
    session: DhSession,
    { language }: { language: string }
  ): void {
    this.setState({
      session,
      language,
    });
  }

  handleSessionClosed(): void {
    this.setState({
      session: undefined,
      language: undefined,
    });
  }

  handleShow(): void {
    this.setState({ isShown: true });
  }

  isHidden(): boolean {
    const { glContainer } = this.props;
    const { isHidden } = glContainer;
    return isHidden;
  }

  render(): ReactNode {
    const { fileStorage, glContainer, glEventHub } = this.props;
    const { isShown, showCreateFolder } = this.state;
    return (
      <Panel
        className="file-explorer-panel"
        componentPanel={this}
        glContainer={glContainer}
        glEventHub={glEventHub}
        onSessionOpen={this.handleSessionOpened}
        onSessionClose={this.handleSessionClosed}
        onShow={this.handleShow}
      >
        <FileExplorerToolbar
          createFile={this.handleCreateFile}
          createFolder={this.handleCreateDirectory}
        />
        {isShown && (
          <FileExplorer
            isMultiSelect
            storage={fileStorage}
            onDelete={this.handleDelete}
            onRename={this.handleRename}
            onSelect={this.handleFileSelect}
          />
        )}
        <NewItemModal
          isOpen={showCreateFolder}
          type="directory"
          title="Create New Folder"
          storage={fileStorage}
          onSubmit={this.handleCreateDirectorySubmit}
          onCancel={this.handleCreateDirectoryCancel}
        />
      </Panel>
    );
  }
}

const mapStateToProps = (state: unknown) => {
  const fileStorage = getFileStorage(state);
  const sessionWrapper = getSessionWrapper(state);
  const { session, config: sessionConfig } = sessionWrapper;
  const language = sessionConfig.type;

  return {
    fileStorage,
    language,
    session,
  };
};

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  FileExplorerPanel
);
