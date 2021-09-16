import React, { Component } from 'react';
import PropTypes from 'prop-types';
import memoize from 'memoize-one';
import { connect } from 'react-redux';
import { GLPropTypes, LayoutUtils, PanelEvent } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { getClosedPanelsForDashboard } from '@deephaven/redux';
import Panel from './Panel';
import MarkdownContainer from '../controls/markdown/MarkdownContainer';
import MarkdownStartPage from '../controls/markdown/MarkdownStartPage';
import MarkdownEditor from '../controls/markdown/MarkdownEditor';
import './MarkdownPanel.scss';

const log = Log.module('MarkdownPanel');

export class MarkdownPanel extends Component {
  static COMPONENT = 'MarkdownPanel';

  constructor(props) {
    super(props);

    this.handleContainerDoubleClick = this.handleContainerDoubleClick.bind(
      this
    );
    this.handleCreateMarkdown = this.handleCreateMarkdown.bind(this);
    this.handleDeleteMarkdown = this.handleDeleteMarkdown.bind(this);
    this.handleOpenMarkdown = this.handleOpenMarkdown.bind(this);
    this.handleEditorInitialized = this.handleEditorInitialized.bind(this);
    this.handleEditorBlur = this.handleEditorBlur.bind(this);
    this.handleEditorResize = this.handleEditorResize.bind(this);

    const { panelState } = props;
    let content = null;
    if (panelState && panelState.content) {
      ({ content } = panelState);
    }

    this.state = {
      isStartPageShown: content == null,
      isEditing: false,
      content,

      // eslint-disable-next-line react/no-unused-state
      panelState,
    };

    this.markdownEditor = null;
    this.editor = null;
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

  getClosedMarkdowns = memoize(closedPanels =>
    closedPanels.filter(panel => panel.component === 'MarkdownPanel').reverse()
  );

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

  handleCreateMarkdown() {
    log.debug('create markdown...');

    this.setState(
      {
        isStartPageShown: false,
        content: '',
        isEditing: true,

        // eslint-disable-next-line react/no-unused-state
        panelState: { content: '' },
      },
      () => {
        if (this.editor && this.editor.focus) {
          this.editor.focus();
        }
      }
    );
  }

  handleOpenMarkdown(markdown) {
    log.debug('open markdown...', markdown);

    const { glContainer, glEventHub } = this.props;
    const config = LayoutUtils.getComponentConfigFromContainer(glContainer);
    glEventHub.emit(PanelEvent.REOPEN, markdown, config);
  }

  handleDeleteMarkdown(markdown) {
    const { glEventHub } = this.props;
    glEventHub.emit(PanelEvent.DELETE, markdown);
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

  render() {
    const { glContainer, glEventHub, closedPanels } = this.props;
    const { isEditing, isStartPageShown, content } = this.state;
    const closedMarkdowns = this.getClosedMarkdowns(closedPanels);

    return (
      <Panel
        glContainer={glContainer}
        glEventHub={glEventHub}
        className="markdown-panel"
        componentPanel={this}
        onResize={this.handleEditorResize}
        onBlur={this.handleEditorBlur}
        isClonable
        isRenamable
      >
        {isStartPageShown ? (
          <MarkdownStartPage
            closedMarkdowns={closedMarkdowns}
            onCreate={this.handleCreateMarkdown}
            onOpen={this.handleOpenMarkdown}
            onDelete={this.handleDeleteMarkdown}
          />
        ) : (
          <MarkdownContainer
            isEditing={isEditing}
            onDoubleClick={this.handleContainerDoubleClick}
          >
            <MarkdownEditor
              ref={markdownEditor => {
                this.markdownEditor = markdownEditor;
              }}
              isEditing={isEditing}
              content={content}
              onEditorInitialized={this.handleEditorInitialized}
            />
          </MarkdownContainer>
        )}
      </Panel>
    );
  }
}

MarkdownPanel.propTypes = {
  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,
  panelState: PropTypes.shape({
    content: PropTypes.string,
  }),
  closedPanels: PropTypes.arrayOf(PropTypes.object).isRequired,
};

MarkdownPanel.defaultProps = {
  panelState: null,
};

const mapStateToProps = (state, ownProps) => {
  const { localDashboardId } = ownProps;
  return {
    closedPanels: getClosedPanelsForDashboard(state, localDashboardId),
  };
};

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  MarkdownPanel
);
