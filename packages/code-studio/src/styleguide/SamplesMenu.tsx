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
export function SampleMenuCategory({
  'data-menu-category': dataMenuCategory,
}: Record<typeof MENU_CATEGORY_DATA_ATTRIBUTE, string>): JSX.Element {
  return <div data-menu-category={dataMenuCategory} />;
}

/**
 * Creates a menu from h2, h3 elements on the page and assigns them each an id
 * for hash navigation purposes. If the current hash matches one of the ids, it
 * will scroll to that element. This handles the initial page load scenario.
 * Menu sections are identified by divs with MENU_CATEGORY_DATA_ATTRIBUTE
 * attributes.
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

    document
      .querySelectorAll(`h2,h3,[${MENU_CATEGORY_DATA_ATTRIBUTE}]`)
      .forEach(el => {
        if (el.textContent == null || el.hasAttribute(NO_MENU_DATA_ATTRIBUTE)) {
          return;
        }

        // Create a new category section
        if (el.hasAttribute(MENU_CATEGORY_DATA_ATTRIBUTE)) {
          currentCategory = {
            category: el.getAttribute(MENU_CATEGORY_DATA_ATTRIBUTE) ?? '',
            items: [],
          };
          categories.push(currentCategory);

          return;
        }

        const id = `${
          spectrumComponentsSamples?.contains(el) === true ? 'spectrum-' : ''
        }${el.textContent}`
          .toLowerCase()
          .replace(/\s/g, '-');

        // eslint-disable-next-line no-param-reassign
        el.id = id;

        currentCategory.items.push({ id, label: el.textContent });

        if (`#${id}` === window.location.hash) {
          el.scrollIntoView();
        }
      });

    setLinks(categories);
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
    }, 500);
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
