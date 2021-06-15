import Log from '@deephaven/log';
import { getFileStorage } from '@deephaven/redux';
import FileExplorer, { FileInfo, FileStorage } from '@deephaven/file-explorer';
import GoldenLayout from 'golden-layout';
import React, { ReactNode } from 'react';
import { connect } from 'react-redux';
import Panel from './Panel';
import { NotebookEvent } from '../events';

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

  constructor(props: FileExplorerPanelProps) {
    super(props);

    this.handleOpen = this.handleOpen.bind(this);
    this.handleCreateFile = this.handleCreateFile.bind(this);
    this.handleSessionOpened = this.handleSessionOpened.bind(this);
    this.handleSessionClosed = this.handleSessionClosed.bind(this);

    const { session, language } = props;
    this.state = {
      language,
      session,
    };
  }

  handleCreateFile() {
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

  handleOpen(file: FileInfo): void {
    log.debug('handleOpen', file);
    const fileMetadata = { id: file.name };
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
    return (
      <Panel
        className="file-explorer-panel"
        componentPanel={this}
        glContainer={glContainer}
        glEventHub={glEventHub}
        onSessionOpen={this.handleSessionOpened}
        onSessionClose={this.handleSessionClosed}
      >
        <FileExplorer
          storage={fileStorage}
          onCreateFile={this.handleCreateFile}
          onOpen={this.handleOpen}
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
