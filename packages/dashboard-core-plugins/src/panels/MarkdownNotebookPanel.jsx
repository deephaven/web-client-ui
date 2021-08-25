import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { LoadingOverlay } from '@deephaven/components';
import { GLPropTypes } from '@deephaven/dashboard';
import { Pending } from '@deephaven/utils';
import { getFileStorage } from '@deephaven/redux';
import Log from '@deephaven/log';
import Panel from './Panel';
import { getDashboardSessionWrapper } from '../redux';
import { ConsoleEvent, NotebookEvent } from '../events';
import './MarkdownNotebookPanel.scss';
import MarkdownNotebookContainer from './MarkdownNotebookContainer';
import MarkdownNotebookEditor from './MarkdownNotebookEditor';

const log = Log.module('MarkdownNotebookPanel');

export class MarkdownNotebookPanel extends Component {
  static COMPONENT = 'MarkdownNotebookPanel';

  constructor(props) {
    super(props);

    this.handleContainerDoubleClick = this.handleContainerDoubleClick.bind(
      this
    );
    this.handleEditorInitialized = this.handleEditorInitialized.bind(this);
    this.handleEditorBlur = this.handleEditorBlur.bind(this);
    this.handleEditorResize = this.handleEditorResize.bind(this);
    this.handleLinkClick = this.handleLinkClick.bind(this);
    this.handleTab = this.handleTab.bind(this);
    this.handleRunCommand = this.handleRunCommand.bind(this);
    this.transformLinkUri = this.transformLinkUri.bind(this);

    this.pending = new Pending();

    const { panelState } = props;
    let { isPreview } = props;
    if (panelState && panelState.isPreview != null) {
      isPreview = panelState.isPreview;
    }
    this.state = {
      isEditing: false,
      isLoading: true,
      isPreview,
      content: null,

      // eslint-disable-next-line react/no-unused-state
      panelState,
    };

    this.markdownEditor = null;
    this.editor = null;
  }

  componentDidMount() {
    const {
      glContainer: { tab },
    } = this.props;
    if (tab) this.initTab(tab);

    this.initNotebookContent();
  }

  componentWillUnmount() {
    this.pending.cancel();

    const { glEventHub, metadata } = this.props;
    const { isPreview } = this.state;
    if (metadata) {
      glEventHub.emit(NotebookEvent.UNREGISTER_FILE, metadata, isPreview);
    }
  }

  initNotebookContent() {
    const { panelState } = this.props;
    if (panelState && panelState.content) {
      // If we're passed the content directly, just use that
      log.debug('Using content passed directly');
      this.setState({ content: panelState.content, isLoading: false });
    } else if (panelState && panelState.fileMetadata) {
      const { fileMetadata } = panelState;
      log.debug('Loading content from file');
      const { isPreview } = this.state;
      this.registerFileMetadata(fileMetadata, isPreview);
      const { id: fileId } = fileMetadata;
      const { fileStorage } = this.props;
      this.pending
        .add(fileStorage.loadFile(fileId))
        .then(loadedFile => {
          log.debug('Loaded file', loadedFile);
          const { content } = loadedFile;
          this.setState({
            content,
            isLoading: false,

            // eslint-disable-next-line react/no-unused-state
            panelState: { content },
          });
        })
        .catch(err => {
          log.error('Unable to load file', err);
          this.setState({ content: '', isLoading: false });
        });
    } else {
      log.debug('Starting with an empty file');
      this.setState({ content: '', isLoading: false });
    }
  }

  initTab(tab) {
    const tabElement = tab.element.get(0);
    const titleElement = tabElement.querySelector('.lm_title');
    this.tabTitleElement = titleElement;
    titleElement.classList.add('markdown-notebook-title');
    this.setPreviewStatus();
  }

  setPreviewStatus() {
    if (!this.tabTitleElement) {
      return;
    }
    const { isPreview } = this.state;
    log.debug('setPreviewStatus', this.tabTitleElement, isPreview);
    if (isPreview) {
      this.tabTitleElement.classList.add('is-preview');
    } else {
      this.tabTitleElement.classList.remove('is-preview');
    }
  }

  registerFileMetadata(fileMetadata, isPreview) {
    const { glEventHub, metadata, id: tabId } = this.props;
    glEventHub.emit(NotebookEvent.REGISTER_FILE, tabId, metadata, isPreview);
  }

  setEditorPosition(clickPositionY) {
    const { container: markdownEditorContainer } = this.markdownEditor;
    if (this.editor && markdownEditorContainer) {
      const contentTop = markdownEditorContainer.getBoundingClientRect().top;
      const contentScrollTop = markdownEditorContainer.scrollTop;
      const contentScrollHeight = markdownEditorContainer.scrollHeight;
      const totalLines = this.editor.getModel().getLineCount();

      let lineToFocus = Math.round(
        ((contentScrollTop + clickPositionY - contentTop) /
          contentScrollHeight) *
          totalLines
      );
      if (lineToFocus > totalLines) {
        lineToFocus = totalLines;
      }

      this.editor.revealLine(lineToFocus);
      this.editor.setPosition({
        lineNumber: lineToFocus,
        column: 1,
      });
      this.editor.focus();
    }
  }

  handleContainerDoubleClick(event) {
    const { isEditing } = this.state;
    const dbClickPositionY = event.clientY;

    if (!isEditing) {
      this.setState({ isEditing: true }, () => {
        this.setEditorPosition(dbClickPositionY);
      });
    }
  }

  handleEditorInitialized(editor) {
    log.debug('Markdown Editor Initialized...');
    this.editor = editor;
  }

  handleEditorBlur(event) {
    log.debug(`markdown content changed, saving...`);
    const { isEditing } = this.state;

    // if not in edit mode, or in edit mode but blur went to an internal monaco field (like search)
    if (
      !isEditing ||
      this.markdownEditor?.container?.contains(event.relatedTarget)
    ) {
      return;
    }

    const content = this.editor.getValue();

    this.setState({
      content,
      isEditing: false,

      // eslint-disable-next-line react/no-unused-state
      panelState: { content },
    });
  }

  handleEditorResize() {
    const { isEditing } = this.state;
    if (isEditing && this.editor) {
      this.editor.layout();
    }
  }

  /**
   * @param {MouseEvent} event The click event from clicking on the link
   */
  handleLinkClick(event) {
    const { notebooksUrl, session, sessionLanguage } = this.props;
    const { href } = event.target;
    if (!href || !href.startsWith(notebooksUrl)) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    const notebookPath = `/${href.substring(notebooksUrl.length)}`.replace(
      /%20/g,
      ' '
    );
    log.debug('Notebook link clicked, opening', notebookPath);

    const { glEventHub } = this.props;
    const notebookSettings = {
      value: null,
      language: sessionLanguage,
    };
    const fileMetadata = { id: notebookPath, itemName: notebookPath };
    glEventHub.emit(
      NotebookEvent.SELECT_NOTEBOOK,
      session,
      sessionLanguage,
      notebookSettings,
      fileMetadata
    );
  }

  handleTab(tab) {
    log.debug('MarkdownNotebookPanel tab event', tab);
    this.initTab(tab);
  }

  handleRunCommand(command) {
    if (!command) {
      log.debug('Ignoring empty command.');
      return;
    }

    this.setState(
      ({ isPreview, panelState = {} }) => {
        if (isPreview) {
          const { metadata } = this.props;
          this.registerFileMetadata(metadata, false);
          return { isPreview: false, panelState: { ...panelState, isPreview } };
        }
        return null;
      },
      () => {
        this.setPreviewStatus();
      }
    );

    const { glEventHub } = this.props;
    glEventHub.emit(ConsoleEvent.SEND_COMMAND, command, false, true);
  }

  /**
   * Transform the link URI to load from where the notebook is if it's relative
   * @param {String} src The link to transform
   * @returns String the transformed link
   */
  transformLinkUri(src) {
    const { metadata, notebooksUrl } = this.props;
    let itemName = metadata?.itemName;
    if (!itemName) {
      return src;
    }
    if (itemName.charAt(0) === '/') {
      itemName = itemName.substring(1);
    }

    const itemUri = new URL(itemName, notebooksUrl);
    if (src.charAt(0) === '/') {
      return `${notebooksUrl}${src}`;
    }
    return new URL(src, itemUri).href;
  }

  render() {
    const { glContainer, glEventHub } = this.props;
    const { isEditing, isLoading, content } = this.state;

    return (
      <Panel
        glContainer={glContainer}
        glEventHub={glEventHub}
        className="markdown-notebook-panel"
        componentPanel={this}
        onResize={this.handleEditorResize}
        onBlur={this.handleEditorBlur}
        onTab={this.handleTab}
        isClonable
        isRenamable
      >
        {!isLoading && (
          <MarkdownNotebookContainer
            isEditing={isEditing}
            // onDoubleClick={this.handleContainerDoubleClick}
          >
            <MarkdownNotebookEditor
              ref={markdownEditor => {
                this.markdownEditor = markdownEditor;
              }}
              isEditing={isEditing}
              content={content}
              onLinkClick={this.handleLinkClick}
              onRunCode={this.handleRunCommand}
              onEditorInitialized={this.handleEditorInitialized}
              transformImageUri={this.transformLinkUri}
              transformLinkUri={this.transformLinkUri}
            />
          </MarkdownNotebookContainer>
        )}
        {isLoading && <LoadingOverlay />}
      </Panel>
    );
  }
}

MarkdownNotebookPanel.propTypes = {
  id: PropTypes.string.isRequired,
  fileStorage: PropTypes.shape({
    deleteFile: PropTypes.func.isRequired,
    loadFile: PropTypes.func.isRequired,
    saveFile: PropTypes.func.isRequired,
  }).isRequired,
  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,
  metadata: PropTypes.shape({
    itemName: PropTypes.string,
  }),
  panelState: PropTypes.shape({
    content: PropTypes.string,
    isPreview: PropTypes.bool,
    fileMetadata: PropTypes.shape({
      id: PropTypes.string,
      itemName: PropTypes.string,
    }),
  }),
  isPreview: PropTypes.bool,
  notebooksUrl: PropTypes.string,
  session: PropTypes.shape({}).isRequired,
  sessionLanguage: PropTypes.string.isRequired,
};

MarkdownNotebookPanel.defaultProps = {
  isPreview: false,
  metadata: null,
  panelState: null,
  notebooksUrl: new URL(
    `${process.env.REACT_APP_NOTEBOOKS_URL}/`,
    window.location
  ).href,
};

const mapStateToProps = (state, ownProps) => {
  const fileStorage = getFileStorage(state);
  const sessionWrapper = getDashboardSessionWrapper(
    state,
    ownProps.localDashboardId
  );
  const { session, config: sessionConfig } = sessionWrapper;
  const { type: sessionLanguage } = sessionConfig;
  return { fileStorage, session, sessionLanguage };
};

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  MarkdownNotebookPanel
);
