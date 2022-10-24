import React, { Component, ReactElement } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@deephaven/components';
import { vsArrowLeft, vsCircleLargeFilled } from '@deephaven/icons';
import './CommandHistoryActions.scss';
import { HistoryAction } from './CommandHistoryTypes';

interface CommandHistoryActionsProps {
  actions: HistoryAction[];
  hasSelection: boolean;
}

class CommandHistoryActions extends Component<
  CommandHistoryActionsProps,
  Record<string, never>
> {
  static itemKey(i: unknown, item: HistoryAction): string {
    return `${item.title}`;
  }

  static renderContent(item: HistoryAction): JSX.Element {
    if (item.selectionRequired !== undefined && item.selectionRequired) {
      return (
        <div className="fa-md fa-layers">
          <FontAwesomeIcon
            icon={vsCircleLargeFilled}
            mask={item.icon}
            transform="right-5 down-5 shrink-4"
          />
          <FontAwesomeIcon
            icon={vsArrowLeft}
            transform="shrink-3 right-7 down-6"
          />
        </div>
      );
    }
    return <FontAwesomeIcon icon={item.icon} />;
  }

  render(): ReactElement {
    const { actions, hasSelection } = this.props;

    return (
      <div className="command-history-actions">
        {actions.map((item, index) => (
          <Button
            kind="inline"
            className={classNames(item.className)}
            key={CommandHistoryActions.itemKey(index, item)}
            onClick={item.action}
            tooltip={item.description}
            disabled={
              item.selectionRequired !== undefined &&
              item.selectionRequired &&
              !hasSelection
            }
            icon={CommandHistoryActions.renderContent(item)}
          />
        ))}
      </div>
    );
  }
}

export default CommandHistoryActions;
