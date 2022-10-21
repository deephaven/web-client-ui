import React, {
  Key,
  MouseEventHandler,
  PureComponent,
  ReactElement,
} from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@deephaven/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsTrash } from '@deephaven/icons';

import Log from '@deephaven/log';
import type { ReactComponentConfig } from '@deephaven/golden-layout';

const log = Log.module('MarkdownStartPage');

interface MarkdownStartPageProps {
  closedMarkdowns: ReactComponentConfig[];
  onOpen: (markdown: ReactComponentConfig) => void;
  onCreate: MouseEventHandler<HTMLButtonElement>;
  onDelete: (markdown: ReactComponentConfig) => void;
}

interface MarkdownStartPageState {
  isDeleteModalShown: boolean;
  toBeDeleted?: ReactComponentConfig;
}

class MarkdownStartPage extends PureComponent<
  MarkdownStartPageProps,
  MarkdownStartPageState
> {
  static defaultProps = {
    closedMarkdowns: [],
    onOpen: (): void => undefined,
    onCreate: (): void => undefined,
    onDelete: (): void => undefined,
  };

  constructor(props: MarkdownStartPageProps) {
    super(props);
    this.handleDeleteButtonClick = this.handleDeleteButtonClick.bind(this);
    this.handleDeleteModalClose = this.handleDeleteModalClose.bind(this);
    this.state = {
      isDeleteModalShown: false,
    };
  }

  handleDeleteButtonClick(markdown: ReactComponentConfig): void {
    this.setState({ isDeleteModalShown: true, toBeDeleted: markdown });
  }

  handleDeleteModalClose(): void {
    this.setState({ isDeleteModalShown: false, toBeDeleted: undefined });
  }

  handleDeleteMarkdown(markdown?: ReactComponentConfig): void {
    log.debug('delete markdown: ', markdown);

    if (markdown !== undefined) {
      const { onDelete } = this.props;
      onDelete(markdown);
    }

    this.setState({ isDeleteModalShown: false, toBeDeleted: undefined });
  }

  render(): ReactElement {
    const { closedMarkdowns, onOpen, onCreate } = this.props;
    const { isDeleteModalShown, toBeDeleted } = this.state;

    return (
      <div className="markdown-panel-start-page h-100 w-100">
        <div className="markdown-panel-start-page-container">
          <div className="markdown-panel-start-list">
            <h3 className="list-title">Start</h3>
            <div className="list-item">
              <Button kind="ghost" className="title" onClick={onCreate}>
                New Markdown Note
              </Button>
            </div>
          </div>
          <div className="markdown-panel-start-list">
            <h3 className="list-title">Recently Closed from Dashboard</h3>
            {closedMarkdowns.map(markdown => (
              <div className="list-item" key={markdown.id as Key}>
                <Button
                  kind="ghost"
                  className="title"
                  onClick={() => onOpen(markdown)}
                >
                  {markdown.title}
                </Button>
                <button
                  className="btn-link icon"
                  type="button"
                  onClick={() => {
                    this.handleDeleteButtonClick(markdown);
                  }}
                >
                  <FontAwesomeIcon icon={vsTrash} />
                </button>
              </div>
            ))}
            <Modal
              isOpen={isDeleteModalShown}
              toggle={this.handleDeleteModalClose}
              className="modal-dialog-centered markdown-delete-modal theme-bg-light"
            >
              <ModalHeader>
                Are you sure you want to permanently delete this note?
              </ModalHeader>
              <ModalBody>You can&#39;t undo this action.</ModalBody>
              <ModalFooter>
                <Button kind="secondary" onClick={this.handleDeleteModalClose}>
                  Cancel
                </Button>
                <Button
                  kind="danger"
                  onClick={() => {
                    this.handleDeleteMarkdown(toBeDeleted);
                  }}
                >
                  Delete
                </Button>
              </ModalFooter>
            </Modal>
          </div>
        </div>
      </div>
    );
  }
}

export default MarkdownStartPage;
