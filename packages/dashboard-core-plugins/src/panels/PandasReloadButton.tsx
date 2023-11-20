import React, { useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhRefresh } from '@deephaven/icons';
import { Button } from '@deephaven/components';

export function PandasReloadButton({
  onClick,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}): JSX.Element {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      buttonRef.current?.blur();
      onClick(e);
    },
    [onClick]
  );

  return (
    <Button
      ref={buttonRef}
      kind="primary"
      className="btn-pandas"
      onClick={handleClick}
      tooltip="Click to refresh pandas dataframe, updates do not occur automatically."
    >
      pandas dataframe
      <span>
        <FontAwesomeIcon
          icon={dhRefresh}
          transform="shrink-1"
          className="mr-1"
        />
        Reload
      </span>
    </Button>
  );
}

export default PandasReloadButton;
