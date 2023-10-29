import React, { useCallback, useEffect } from 'react';
import { Button, Icon } from '@adobe/react-spectrum';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsChevronUp } from '@deephaven/icons';
import './GotoTopButton.css';

/**
 * Button that scrolls to top of styleguide and clears location hash.
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

  // Set data-scroll="true" on the html element when the user scrolls down below
  // 120px. CSS uses this to only show the button when the user has scrolled.
  useEffect(() => {
    function onScroll() {
      document.documentElement.dataset.scroll = String(window.scrollY > 120);
    }
    document.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <Button
      UNSAFE_className="goto-top-button"
      variant="accent"
      onPress={gotoTop}
    >
      <Icon>
        <FontAwesomeIcon icon={vsChevronUp} />
      </Icon>
    </Button>
  );
}

export default GotoTopButton;
