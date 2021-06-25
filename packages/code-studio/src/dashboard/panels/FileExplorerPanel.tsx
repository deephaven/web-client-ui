import Log from '@deephaven/log';
import { getFileStorage } from '@deephaven/redux';
import FileExplorer, {
  FileExplorerToolbar,
  FileInfo,
  FileStorage,
  NewItemModal,
} from '@deephaven/file-explorer';
import GoldenLayout from 'golden-layout';
import React, { ReactNode } from 'react';
import { connect } from 'react-redux';
import Panel from './Panel';
import { NotebookEvent } from '../events';
import './FileExplorerPanel.scss';

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
  language?: string;
  session?: DhSession;
  showCreateFolder: boolean;
  newItemPath?: string;
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
    this.handleSessionOpened = this.handleSessionOpened.bind(this);
    this.handleSessionClosed = this.handleSessionClosed.bind(this);

    const { session, language } = props;
    this.state = {
      language,
      session,
      showCreateFolder: false,
    };
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
    this.setState({
      showCreateFolder: true,
      newItemPath: path,
    });
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

  handleFileSelect(file: FileInfo): void {
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

  render(): ReactNode {
    // TODO: Pass a FileStorage instance instead to a FileExplorer, then WebdavExplorer can just use that client...
    const { fileStorage, glContainer, glEventHub } = this.props;
    const { newItemPath, showCreateFolder } = this.state;
    return (
      <Panel
        className="file-explorer-panel"
        componentPanel={this}
        glContainer={glContainer}
        glEventHub={glEventHub}
        onSessionOpen={this.handleSessionOpened}
        onSessionClose={this.handleSessionClosed}
      >
        <div className="file-explorer-toolbar">
          <FileExplorerToolbar
            createFile={this.handleCreateFile}
            createFolder={this.handleCreateDirectory}
          />
        </div>
        <FileExplorer storage={fileStorage} onSelect={this.handleFileSelect} />
        <NewItemModal
          isOpen={showCreateFolder}
          // defaultValue={'/'}
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

const mapStateToProps = (state: unknown) => ({
  fileStorage: getFileStorage(state),
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  FileExplorerPanel
);
