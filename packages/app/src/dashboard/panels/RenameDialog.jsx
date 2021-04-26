import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Popper } from '@deephaven/components';

export default class RenameDialog extends PureComponent {
  constructor(props) {
    super(props);

    this.handleRenameDialogOpened = this.handleRenameDialogOpened.bind(this);
    this.handleRenameInputChange = this.handleRenameInputChange.bind(this);
    this.handleRenameCancel = this.handleRenameCancel.bind(this);
    this.handleRenameSubmit = this.handleRenameSubmit.bind(this);

    this.renameInputRef = React.createRef();

    const { value } = props;

    this.state = {
      value,
      valueWasValidated: false,
    };
  }

  componentDidUpdate(prevProps) {
    const { isShown: prevIsShown } = prevProps;
    const { isShown } = this.props;
    // Reset the state on dialog shown and not on the `value` prop change
    // so the input keeps the internal value while the dialog is open.
    // Useful in case the `value` prop update is triggered externally
    // i.e. by someone else renaming the same shared dashboard
    if (isShown && !prevIsShown) {
      this.resetState();
    }
  }

  resetState() {
    const { value } = this.props;
    this.setState({ value, valueWasValidated: false });
  }

  handleRenameDialogOpened() {
    if (this.renameInputRef) {
      this.renameInputRef.current.focus();
    }
  }

  handleRenameInputChange(event) {
    this.setState({ value: event.target.value });
  }

  handleRenameCancel() {
    const { onCancel } = this.props;
    onCancel();
  }

  handleRenameSubmit(event) {
    event.stopPropagation();
    event.preventDefault();
    const { value } = this.state;
    const newTitle = value.trim();
    if (newTitle !== '') {
      const { onSubmit } = this.props;
      onSubmit(newTitle);
    } else {
      this.setState({ value: newTitle, valueWasValidated: true });
    }
  }

  renderRenameDialog() {
    const { isShared, isOwner, itemType } = this.props;
    const { value, valueWasValidated } = this.state;

    return (
      <form
        className={classNames('p-3', { 'was-validated': valueWasValidated })}
        onSubmit={this.handleRenameSubmit}
        noValidate
        role="presentation"
        onMouseDown={event => {
          // block events in the NewTabScreen ItemList
          event.stopPropagation();
        }}
        onMouseUp={event => {
          event.stopPropagation();
        }}
      >
        <div className="form-group">
          <label htmlFor={`rename-dialog-${itemType}-input`}>
            Rename {itemType}
          </label>
          <input
            type="text"
            className="form-control"
            id={`rename-dialog-${itemType}-input`}
            value={value}
            ref={this.renameInputRef}
            onChange={this.handleRenameInputChange}
            required
          />
          <div className="invalid-feedback">
            {itemType} name cannot be empty
          </div>
          {(isShared || !isOwner) && (
            <div className="pt-2">
              Renaming this {itemType} will rename for all users.
            </div>
          )}
        </div>

        <div className="text-right">
          <button
            type="button"
            className="btn btn-outline-primary mr-2"
            onClick={this.handleRenameCancel}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Rename
          </button>
        </div>
      </form>
    );
  }

  render() {
    const { isShown, onCancel } = this.props;
    return (
      <Popper
        isShown={isShown}
        onEntered={this.handleRenameDialogOpened}
        onExited={onCancel}
        options={{
          placement: 'bottom',
          modifiers: { preventOverflow: { boundariesElement: 'viewport' } },
        }}
        interactive
        closeOnBlur
      >
        {this.renderRenameDialog()}
      </Popper>
    );
  }
}

RenameDialog.propTypes = {
  isShared: PropTypes.bool,
  isOwner: PropTypes.bool,
  isShown: PropTypes.bool.isRequired,
  itemType: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  value: PropTypes.string,
};

RenameDialog.defaultProps = {
  isShared: false,
  isOwner: true,
  itemType: 'Item',
};

RenameDialog.defaultProps = {
  value: '',
};
