/**
 * Console display for use in the Iris environment.
 */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ButtonOld } from '@deephaven/components';
import { PropTypes as APIPropTypes } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import { Code, ObjectIcon } from '../common';
import ConsoleHistoryItemResult from './ConsoleHistoryItemResult';
import ConsoleHistoryResultInProgress from './ConsoleHistoryResultInProgress';
import ConsoleHistoryResultErrorMessage from './ConsoleHistoryResultErrorMessage';
import ConsoleUtils from '../common/ConsoleUtils';
import './ConsoleHistoryItem.scss';

const log = Log.module('ConsoleHistoryItem');

class ConsoleHistoryItem extends PureComponent {
  constructor(props) {
    super(props);

    this.handleCancelClick = this.handleCancelClick.bind(this);
    this.handleObjectClick = this.handleObjectClick.bind(this);
  }

  handleObjectClick(object) {
    log.debug('handleObjectClick', object);

    const { openObject } = this.props;
    openObject(object);
  }

  handleCancelClick() {
    const { item } = this.props;
    if (item && item.cancelResult) {
      log.debug(`Cancelling command: ${item.command}`);
      item.cancelResult();
    }
  }

  render() {
    const { item, language } = this.props;
    const { disabledObjects, result } = item;

    let commandElement = null;
    if (item.command) {
      commandElement = (
        <div className="console-history-item-command">
          <div className="console-history-gutter">&gt;</div>
          <div className="console-history-content">
            <Code language={language}>{item.command}</Code>
          </div>
        </div>
      );
    }

    const resultElements = [];

    if (result) {
      const { error, message, changes } = result;

      if (changes) {
        const { created, updated } = changes;
        [...created, ...updated]
          .filter(({ type }) => ConsoleUtils.isOpenableType(type))
          .forEach(object => {
            const { name } = object;
            const key = `${name}`;
            const disabled = (disabledObjects ?? []).indexOf(name) >= 0;
            const element = (
              <ButtonOld
                key={key}
                onClick={() => this.handleObjectClick(object)}
                className="btn-primary btn-console"
                disabled={disabled}
              >
                <ObjectIcon type={object.type} /> {name}
              </ButtonOld>
            );
            resultElements.push(element);
          });
      }

      // If the error has an associated command, we'll actually get a separate ERROR item printed out, so only print an error if there isn't an associated command
      if (error && !item.command) {
        let errorMessage = error.message;
        if (!errorMessage) {
          errorMessage = error;
        }
        const element = (
          <ConsoleHistoryResultErrorMessage
            key="result-error"
            message={errorMessage}
          />
        );
        resultElements.push(element);
      }

      if (message) {
        const element = (
          <div key="log-message" className="log-message">
            {message}
          </div>
        );
        resultElements.push(element);
      }
    } else {
      const element = (
        <ConsoleHistoryResultInProgress
          key="in_progress"
          onCancelClick={this.handleCancelClick}
        />
      );
      resultElements.push(element);
    }

    let resultElement = null;
    if (resultElements.length > 0) {
      resultElement = (
        <ConsoleHistoryItemResult>{resultElements}</ConsoleHistoryItemResult>
      );
    }

    return (
      <div className="container-fluid">
        {commandElement}
        {resultElement}
      </div>
    );
  }
}

ConsoleHistoryItem.propTypes = {
  item: PropTypes.shape({
    cancelResult: PropTypes.func,
    command: PropTypes.string,
    disabledObjects: PropTypes.arrayOf(PropTypes.string),
    result: PropTypes.shape({
      error: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({ message: PropTypes.string }),
      ]),
      message: PropTypes.string,
      changes: APIPropTypes.VariableChanges,
    }),
    startTime: PropTypes.number,
    endTime: PropTypes.number,
  }).isRequired,
  language: PropTypes.string.isRequired,
  openObject: PropTypes.func.isRequired,
};

export default ConsoleHistoryItem;
