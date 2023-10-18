import React, { useCallback } from 'react';
import { Button, Icon } from '@adobe/react-spectrum';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsChevronUp } from '@deephaven/icons';

/**
 * Button that scrolls to top of page and clears location hash.
 */
export function GotoTopButton(): JSX.Element {
  const gotoTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Small delay to give scrolling a chance to move smoothly to top
    setTimeout(() => {
      window.location.hash = '';
    }, 500);
  }, []);

  return (
    <Button variant="accent" onPress={gotoTop}>
      <Icon>
        <FontAwesomeIcon icon={vsChevronUp} />
      </Icon>
    </Button>
  );
}

export default GotoTopButton;
