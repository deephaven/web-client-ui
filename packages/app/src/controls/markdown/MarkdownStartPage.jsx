import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsTrash } from '@deephaven/icons';

import Log from '@deephaven/log';

const log = Log.module('MarkdownStartPage');

class MarkdownStartPage extends PureComponent {
  constructor(props) {
    super(props);
    this.handleDeleteButtonClick = this.handleDeleteButtonClick.bind(this);
    this.handleDeleteModalClose = this.handleDeleteModalClose.bind(this);
    this.state = {
      isDeleteModalShown: false,
      toBeDeleted: null,
    };
  }

  handleDeleteButtonClick(markdown) {
    this.setState({ isDeleteModalShown: true, toBeDeleted: markdown });
  }

  handleDeleteModalClose() {
    this.setState({ isDeleteModalShown: false, toBeDeleted: null });
  }

  handleDeleteMarkdown(markdown) {
    log.debug('delete markdown: ', markdown);

    const { onDelete } = this.props;
    onDelete(markdown);

    this.setState({ isDeleteModalShown: false, toBeDeleted: null });
  }

  render() {
    const { closedMarkdowns, onOpen, onCreate } = this.props;
    const { isDeleteModalShown, toBeDeleted } = this.state;

    return (
      <div className="markdown-panel-start-page h-100 w-100">
        <div className="markdown-panel-start-page-container">
          <div className="markdown-panel-start-list">
            <h3 className="list-title">Start</h3>
            <div className="list-item">
              <button
                className="btn btn-link title"
                type="button"
                onClick={onCreate}
              >
                New Markdown Note
              </button>
            </div>
          </div>
          <div className="markdown-panel-start-list">
            <h3 className="list-title">Recently Closed from Dashboard</h3>
            {closedMarkdowns.map(markdown => (
              <div className="list-item" key={markdown.id}>
                <button
                  className="btn btn-link title"
                  type="button"
                  onClick={() => onOpen(markdown)}
                >
                  {markdown.title}
                </button>
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
                <button
                  className="btn btn-outline-primary"
                  onClick={this.handleDeleteModalClose}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    this.handleDeleteMarkdown(toBeDeleted);
                  }}
                  type="button"
                >
                  Delete
                </button>
              </ModalFooter>
            </Modal>
          </div>
        </div>
      </div>
    );
  }
}

MarkdownStartPage.propTypes = {
  closedMarkdowns: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      content: PropTypes.string,
    })
  ),
  onOpen: PropTypes.func,
  onCreate: PropTypes.func,
  onDelete: PropTypes.func,
};

MarkdownStartPage.defaultProps = {
  closedMarkdowns: [],
  onOpen: () => {},
  onCreate: () => {},
  onDelete: () => {},
};

export default MarkdownStartPage;
