import React, { Component, FocusEvent, MouseEvent, ReactElement } from 'react';
import memoize from 'memoize-one';
import { connect } from 'react-redux';
import {
  ClosedPanel,
  ClosedPanels,
  getClosedPanelsForDashboard,
  LayoutUtils,
  PanelEvent,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import type {
  Container,
  EventEmitter,
  ReactComponentConfig,
} from '@deephaven/golden-layout';
import type * as monaco from 'monaco-editor';
import { assertNotNull } from '@deephaven/utils';
import { RootState } from '@deephaven/redux';
import Panel from './Panel';
import MarkdownContainer from '../controls/markdown/MarkdownContainer';
import MarkdownStartPage from '../controls/markdown/MarkdownStartPage';
import MarkdownEditor from '../controls/markdown/MarkdownEditor';
import './MarkdownPanel.scss';

const log = Log.module('MarkdownPanel');

interface PanelState {
  content?: string;
}

interface MarkdownPanelProps {
  glContainer: Container;
  glEventHub: EventEmitter;
  panelState: PanelState;
  closedPanels: ClosedPanel[];
}

interface MarkdownPanelState {
  isStartPageShown: boolean;
  isEditing: boolean;
  content?: string | null;

  // eslint-disable-next-line react/no-unused-state
  panelState: PanelState;
}

export class MarkdownPanel extends Component<
  MarkdownPanelProps,
  MarkdownPanelState
> {
  static defaultProps = {
    panelState: null,
  };

  static COMPONENT = 'MarkdownPanel';

  constructor(props: MarkdownPanelProps) {
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
  }

  markdownEditor: MarkdownEditor | null;

  editor?: monaco.editor.IStandaloneCodeEditor;

  setEditorPosition(clickPositionY: number): void {
    assertNotNull(this.markdownEditor);
    const { container: markdownEditorContainer } = this.markdownEditor;
    if (this.editor && markdownEditorContainer) {
      const contentTop = markdownEditorContainer.getBoundingClientRect().top;
      const contentScrollTop = markdownEditorContainer.scrollTop;
      const contentScrollHeight = markdownEditorContainer.scrollHeight;
      const totalLines = this.editor.getModel()?.getLineCount() ?? 0;

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

  getClosedMarkdowns = memoize((closedPanels: ClosedPanels) =>
    closedPanels.filter(panel => panel.component === 'MarkdownPanel').reverse()
  );

  handleContainerDoubleClick(event: MouseEvent<Element>): void {
    const { isEditing } = this.state;
    const dbClickPositionY = event.clientY;

    if (!isEditing) {
      this.setState({ isEditing: true }, () => {
        this.setEditorPosition(dbClickPositionY);
      });
    }
  }

  handleEditorInitialized(editor: monaco.editor.IStandaloneCodeEditor): void {
    log.debug('Markdown Editor Initialized...');
    this.editor = editor;
  }

  handleCreateMarkdown(): void {
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

  handleOpenMarkdown(markdown: ReactComponentConfig): void {
    log.debug('open markdown...', markdown);

    const { glContainer, glEventHub } = this.props;
    const config = LayoutUtils.getComponentConfigFromContainer(glContainer);
    glEventHub.emit(PanelEvent.REOPEN, markdown, config);
  }

  handleDeleteMarkdown(markdown: ReactComponentConfig): void {
    const { glEventHub } = this.props;
    glEventHub.emit(PanelEvent.DELETE, markdown);
  }

  handleEditorBlur(event: FocusEvent<HTMLDivElement>): void {
    log.debug(`markdown content changed, saving...`);
    const { isEditing } = this.state;

    // if not in edit mode, or in edit mode but blur went to an internal monaco field (like search)
    if (
      !isEditing ||
      this.markdownEditor?.container?.contains(event.relatedTarget)
    ) {
      return;
    }

    const content = this.editor?.getValue();

    this.setState({
      content,
      isEditing: false,

      // eslint-disable-next-line react/no-unused-state
      panelState: { content },
    });
  }

  handleEditorResize(): void {
    const { isEditing } = this.state;
    if (isEditing && this.editor) {
      this.editor.layout();
    }
  }

  render(): ReactElement {
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
              content={content ?? undefined}
              onEditorInitialized={this.handleEditorInitialized}
            />
          </MarkdownContainer>
        )}
      </Panel>
    );
  }
}

const mapStateToProps = (
  state: RootState,
  ownProps: { localDashboardId: string }
) => {
  const { localDashboardId } = ownProps;
  return {
    closedPanels: getClosedPanelsForDashboard(state, localDashboardId),
  };
};

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  MarkdownPanel
);
