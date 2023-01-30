import React, {
  ChangeEvent,
  FormEvent,
  PureComponent,
  ReactElement,
  RefObject,
} from 'react';
import classNames from 'classnames';
import { Button, Popper } from '@deephaven/components';

interface RenameDialogProps {
  isShared: boolean;
  isOwner: boolean;
  isShown: boolean;
  itemType: string;
  onSubmit: (title: string) => void;
  onCancel: () => void;
  value?: string | null;
}

interface RenameDialogState {
  value?: string | null;
  valueWasValidated: boolean;
}

export default class RenameDialog extends PureComponent<
  RenameDialogProps,
  RenameDialogState
> {
  static defaultProps = {
    isShared: false,
    isOwner: true,
    itemType: 'Item',
    value: '',
  };

  constructor(props: RenameDialogProps) {
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

  componentDidUpdate(prevProps: RenameDialogProps): void {
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

  renameInputRef: RefObject<HTMLInputElement>;

  resetState(): void {
    const { value } = this.props;
    this.setState({ value, valueWasValidated: false });
  }

  handleRenameDialogOpened(): void {
    this.renameInputRef?.current?.focus();
  }

  handleRenameInputChange(event: ChangeEvent<HTMLInputElement>): void {
    this.setState({ value: event.target.value });
  }

  handleRenameCancel(): void {
    const { onCancel } = this.props;
    onCancel();
  }

  handleRenameSubmit(event: FormEvent<HTMLFormElement>): void {
    event.stopPropagation();
    event.preventDefault();
    const { value } = this.state;
    const newTitle = value?.trim();
    if (newTitle !== undefined && newTitle !== '') {
      const { onSubmit } = this.props;
      onSubmit(newTitle);
    } else {
      this.setState({ value: newTitle, valueWasValidated: true });
    }
  }

  renderRenameDialog(): ReactElement {
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
            value={value ?? undefined}
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
          <Button
            kind="secondary"
            className="mr-2"
            onClick={this.handleRenameCancel}
          >
            Cancel
          </Button>
          <Button kind="primary" type="submit">
            Rename
          </Button>
        </div>
      </form>
    );
  }

  render(): ReactElement {
    const { isShown, onCancel } = this.props;
    return (
      <Popper
        isShown={isShown}
        onEntered={this.handleRenameDialogOpened}
        onExited={onCancel}
        options={{
          placement: 'bottom',
        }}
        interactive
        closeOnBlur
      >
        {this.renderRenameDialog()}
      </Popper>
    );
  }
}
