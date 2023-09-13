import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Content,
  Heading,
  Icon,
  IllustratedMessage,
} from '@adobe/react-spectrum';
import { vsEmptyWindow } from '@deephaven/icons';

const DEFAULT_DELAY_MS = 500;

export interface TableViewEmptyStateProps {
  heading: string;
  content?: string;
  delayMs?: number;
}

export function TableViewEmptyState({
  heading,
  content,
  delayMs = DEFAULT_DELAY_MS,
}: TableViewEmptyStateProps): JSX.Element | null {
  const [show, setShow] = useState(false);

  // Spectrum `TableView` will render the result of `renderEmptyState` prop
  // immediately, and it will be hidden once data loads. In cases where the data
  // load is quick, there is a jarring flicker, and the empty data message is
  // not helpful. This delay will avoid showing the message if data loads within
  // the `delayMs`.
  useEffect(() => {
    window.setTimeout(() => {
      setShow(true);
    }, delayMs);
  }, [delayMs]);

  return show ? (
    <IllustratedMessage>
      <Icon size="XXL">
        <FontAwesomeIcon icon={vsEmptyWindow} />
      </Icon>
      <Heading>{heading}</Heading>
      {content == null ? null : <Content>{content}</Content>}
    </IllustratedMessage>
  ) : null;
}

export default TableViewEmptyState;
