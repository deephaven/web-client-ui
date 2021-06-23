import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { ContextActions, GLOBAL_SHORTCUTS } from '@deephaven/components';
import Log from '@deephaven/log';
import { PanelManager } from '../panels';
import { UIPropTypes } from '../../include/prop-types';
import LayoutUtils from '../../layout/LayoutUtils';
import LinkerLink from './LinkerLink';
import LinkType from './LinkType';
import './LinkerOverlayContent.scss';

const log = Log.module('LinkerOverlayContent');

export class LinkerOverlayContent extends Component {
  constructor(props) {
    super(props);

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleEscapePressed = this.handleEscapePressed.bind(this);

    this.state = {
      mouseX: null,
      mouseY: null,
    };
  }

  componentDidMount() {
    window.addEventListener('mousemove', this.handleMouseMove, true);
  }

  // eslint-disable-next-line react/sort-comp
  componentDidCatch(error, info) {
    log.error('componentDidCatch', error, info);
  }

  componentWillUnmount() {
    window.removeEventListener('mousemove', this.handleMouseMove, true);
  }

  /** Gets the on screen points for a link start or end spec */
  getPointFromLinkPoint(linkPoint) {
    const { panelManager } = this.props;
    const { panelId, columnName } = linkPoint;
    const panel = panelManager.getOpenedPanelById(panelId);
    if (panel != null) {
      if (!panel.getCoordinateForColumn) {
        throw new Error(
          `Panel does not have getCoordinateForColumn method: ${panelId}`
        );
      }
      try {
        // TODO: remove try/catch when IDS-7371 is fixed.
        // getCoordinateForColumn throws an exception when accessing
        // columns on a model while it reconnects
        const coordinate = panel.getCoordinateForColumn(columnName);
        if (coordinate != null) {
          return coordinate;
        }
      } catch (e) {
        log.error('Could not get coordinate for column', columnName, panel);
      }
    }
    // Fallback to panel container if the panel itself
    // crashed, unmounted, and removed from openedPanelMap.
    const glContainer = panelManager.getContainerByPanelId(panelId);
    if (glContainer == null) {
      throw new Error(`Unable to find panel container for id: ${panelId}`);
    }
    return LayoutUtils.getTabPoint(glContainer);
  }

  handleMouseMove(event) {
    this.setState({
      mouseX: event.clientX,
      mouseY: event.clientY,
    });
  }

  handleEscapePressed() {
    const { onCancel } = this.props;
    onCancel();
  }

  render() {
    const {
      disabled,
      links,
      messageText,
      onLinkDeleted,
      onAllLinksDeleted,
      onDone,
    } = this.props;

    const { mouseX, mouseY } = this.state;
    const visibleLinks = links
      .map(link => {
        try {
          const { id, type, isReversed, start, end } = link;
          let [x1, y1] = this.getPointFromLinkPoint(start);
          let x2 = mouseX ?? x1;
          let y2 = mouseY ?? y1;
          if (end != null) {
            [x2, y2] = this.getPointFromLinkPoint(end);
          }
          if (isReversed) {
            const [tmpX, tmpY] = [x1, y1];
            [x1, y1] = [x2, y2];
            [x2, y2] = [tmpX, tmpY];
          }
          const className = classNames(
            'linker-link',
            { disabled },
            { 'link-filter-source': type === LinkType.FILTER_SOURCE },
            { 'link-invalid': type === LinkType.INVALID },
            { interactive: link.end == null }
          );
          return { x1, y1, x2, y2, id, className };
        } catch (error) {
          log.error('Unable to get point for link', link, error);
          return null;
        }
      })
      .filter(item => item != null);

    return (
      <div className="linker-overlay">
        <svg>
          {visibleLinks.map(({ x1, y1, x2, y2, id, className }) => (
            <LinkerLink
              className={className}
              disabled={disabled}
              id={id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              key={id}
              onClick={onLinkDeleted}
            />
          ))}
        </svg>
        <div className="linker-toast-dialog">
          <div className="toast-body">{messageText}</div>
          <div className="toast-footer">
            <button
              className="btn btn-outline-primary"
              onClick={onAllLinksDeleted}
              type="button"
            >
              Clear All
            </button>
            <button className="btn btn-primary" onClick={onDone} type="button">
              Done
            </button>
          </div>
        </div>
        <ContextActions
          actions={[
            {
              action: this.handleEscapePressed,
              shortcut: GLOBAL_SHORTCUTS.LINKER_CLOSE,
              isGlobal: true,
            },
          ]}
        />
      </div>
    );
  }
}

LinkerOverlayContent.propTypes = {
  disabled: PropTypes.bool,
  links: UIPropTypes.Links.isRequired,
  messageText: PropTypes.string.isRequired,
  onLinkDeleted: PropTypes.func.isRequired,
  onAllLinksDeleted: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
  panelManager: PropTypes.instanceOf(PanelManager).isRequired,
};

LinkerOverlayContent.defaultProps = {
  disabled: false,
};

export default LinkerOverlayContent;
