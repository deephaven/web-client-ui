import React, { Key, useCallback, useEffect, useState } from 'react';
import {
  ActionButton,
  Icon,
  Item,
  Menu,
  MenuTrigger,
  Section,
} from '@adobe/react-spectrum';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsMenu } from '@deephaven/icons';
import {
  MENU_CATEGORY_DATA_ATTRIBUTE,
  NO_MENU_DATA_ATTRIBUTE,
  SPECTRUM_COMPARISON_SAMPLES_ID,
  SPECTRUM_COMPONENT_SAMPLES_ID,
} from './constants';

interface Link {
  id: string;
  label: string;
}
type LinkCategory = { category: string; items: Link[] };

/**
 * Metadata only div that provides a MENU_CATEGORY_DATA_ATTRIBUTE defining a
 * menu category. These will be queried by the SamplesMenu component to build
 * up the menu sections.
 */
export function SampleMenuCategory(
  props: Record<typeof MENU_CATEGORY_DATA_ATTRIBUTE, string>
): JSX.Element {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <div {...props} />;
}

/**
 * Creates a menu from h2, h3 elements on the page and assigns them each an id
 * for hash navigation purposes. If the current hash matches one of the ids, it
 * will scroll to that element. This handles the initial page load scenario.
 * Menu categories are identified by divs with MENU_CATEGORY_DATA_ATTRIBUTE
 * attributes originating from the <SampleMenuCategory> component.
 */
export function SamplesMenu(): JSX.Element {
  const [links, setLinks] = useState<LinkCategory[]>([]);

  useEffect(() => {
    let currentCategory: LinkCategory = {
      category: '',
      items: [],
    };
    const categories: LinkCategory[] = [currentCategory];

    const spectrumComponentsSamples = document.querySelector(
      `#${SPECTRUM_COMPONENT_SAMPLES_ID}`
    );

    const spectrumComparisonSamples = document.querySelector(
      `#sample-section-${SPECTRUM_COMPARISON_SAMPLES_ID}`
    );

    document
      .querySelectorAll(`h2,h3,[${MENU_CATEGORY_DATA_ATTRIBUTE}]`)
      .forEach(headingEl => {
        if (
          headingEl.textContent == null ||
          headingEl.hasAttribute(NO_MENU_DATA_ATTRIBUTE)
        ) {
          return;
        }

        // Create a new category section
        if (headingEl.hasAttribute(MENU_CATEGORY_DATA_ATTRIBUTE)) {
          currentCategory = {
            category:
              headingEl.getAttribute(MENU_CATEGORY_DATA_ATTRIBUTE) ?? '',
            items: [],
          };
          categories.push(currentCategory);

          return;
        }

        const idPrefix =
          // eslint-disable-next-line no-nested-ternary
          spectrumComponentsSamples?.contains(headingEl) === true
            ? 'spectrum-'
            : spectrumComparisonSamples?.contains(headingEl) === true
            ? 'spectrum-compare-'
            : '';

        const id = `${idPrefix}${headingEl.textContent}`
          .toLowerCase()
          .replace(/\s/g, '-');

        // eslint-disable-next-line no-param-reassign
        headingEl.id = id;

        currentCategory.items.push({ id, label: headingEl.textContent });
      });

    setLinks(categories);
  }, []);

  useEffect(() => {
    const el =
      window.location.hash === ''
        ? null
        : document.querySelector(window.location.hash);

    // Give everything a chance to render before scrolling
    setTimeout(() => {
      if (el) {
        el.scrollIntoView();
      } else {
        // NavTabList sample causes auto scrolling to middle of page, so we
        // have to explicilty scroll back to the top of the page
        window.scrollTo({
          top: 0,
          behavior: 'auto',
        });
      }
    }, 0);
  }, []);

  const onAction = useCallback((key: Key) => {
    const id = String(key);
    const el = document.getElementById(id);

    el?.scrollIntoView({
      behavior: 'smooth',
    });

    // Keep hash in sync for page reloads, but give some delay to allow smooth
    // scrolling above
    setTimeout(() => {
      window.location.hash = id;
    }, 1000);
  }, []);

  return (
    <MenuTrigger>
      <ActionButton>
        <Icon>
          <FontAwesomeIcon icon={vsMenu} />
        </Icon>
      </ActionButton>
      <Menu items={links} onAction={onAction}>
        {({ category, items }) => (
          <Section key={category} items={items} title={category}>
            {({ id, label }) => <Item key={id}>{label}</Item>}
          </Section>
        )}
      </Menu>
    </MenuTrigger>
  );
}

export default SamplesMenu;
