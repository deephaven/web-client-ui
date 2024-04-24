/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';

import {
  ContextMenuRoot,
  ThemePicker,
  useTheme,
  Flex,
} from '@deephaven/components';

import Buttons from './Buttons';
import Charts from './Charts';
import Colors from './Colors';
import ContextMenus from './ContextMenus';
import Dialog from './Dialog';
import DropdownMenus from './DropdownMenus';
import Editors from './Editors';
import Grids from './Grids';
import Icons from './Icons';
import Inputs from './Inputs';
import ItemListInputs from './ItemListInputs';
import Modals from './Modals';
import Progress from './Progress';
import TimeSliderInputs from './TimeSliderInputs';
import Tooltips from './Tooltips';
import Typograpy from './Typography';
import './StyleGuide.scss';
import DraggableLists from './DraggableLists';
import Navigations from './Navigations';
import ThemeColors from './ThemeColors';
import SpectrumComponents from './SpectrumComponents';
import SamplesMenu, { SampleMenuCategory } from './SamplesMenu';
import GotoTopButton from './GotoTopButton';
import { HIDE_FROM_E2E_TESTS_CLASS } from './utils';
import { GoldenLayout } from './GoldenLayout';
import { RandomAreaPlotAnimation } from './RandomAreaPlotAnimation';
import SpectrumComparison from './SpectrumComparison';
import Pickers from './Pickers';
import ListViews from './ListViews';

const stickyProps = {
  position: 'sticky',
  justifyContent: 'end',
  zIndex: 1,
  UNSAFE_style: {
    float: 'right',
  },
} as const;

function StyleGuide(): React.ReactElement {
  const { themes } = useTheme();
  const [hash, setHash] = useState(window.location.hash);
  const hasMultipleThemes = themes.length > 1;

  function isHash(label: string, processLabel = false): boolean {
    const newLabel = processLabel
      ? label.toLocaleLowerCase().replaceAll(' ', '-')
      : label;
    return hash === `#${newLabel}` || hash === '';
  }

  useEffect(() => {
    const hashChangeHandler = () => setHash(window.location.hash);
    window.addEventListener('hashchange', hashChangeHandler);
    return () => window.removeEventListener('hashchange', hashChangeHandler);
  }, []);

  return (
    // Needs a tabindex to capture focus on popper blur
    // AppMainContainer has a tabindex of -1 in the app itself
    <div tabIndex={-1} role="main">
      <div className="container style-guide-container">
        <Flex
          justifyContent="space-between"
          alignItems="center"
          marginTop="2rem"
          marginBottom="1rem"
        >
          <h1 style={{ paddingTop: '2rem' }}>Deephaven UI Components</h1>
        </Flex>

        {isHash('') && (
          <>
            <Flex
              {...stickyProps}
              UNSAFE_className={HIDE_FROM_E2E_TESTS_CLASS}
              marginTop={-56}
              top={20}
              gap={10}
              alignItems="end"
            >
              {hasMultipleThemes ? <ThemePicker /> : null}
              <SamplesMenu />
            </Flex>
            <Flex
              {...stickyProps}
              UNSAFE_className={HIDE_FROM_E2E_TESTS_CLASS}
              top="calc(100vh - 40px)"
              marginTop={-32}
              marginEnd={hasMultipleThemes ? -234 : 0}
            >
              <GotoTopButton />
            </Flex>
          </>
        )}

        {isHash('typography') && <Typograpy />}

        {isHash('') && <SampleMenuCategory data-menu-category="Colors" />}
        {isHash('colors') && <Colors />}
        {(isHash('theme-color-palette') ||
          isHash('semantic-colors') ||
          isHash('chart-colors') ||
          isHash('editor-colors') ||
          isHash('grid-colors') ||
          isHash('component-colors')) && <ThemeColors isHash={isHash} />}

        {isHash('') && <SampleMenuCategory data-menu-category="Layout" />}
        {isHash('golden-layout') && <GoldenLayout />}

        {isHash('') && <SampleMenuCategory data-menu-category="Components" />}
        {(isHash('buttons-regular') ||
          isHash('buttons-outline') ||
          isHash('buttons-inline') ||
          isHash('buttons-socketed') ||
          isHash('links')) && <Buttons isHash={isHash} />}
        {isHash('progress') && <Progress />}
        {isHash('inputs') && <Inputs />}
        {isHash('list-views') && <ListViews />}
        {isHash('pickers') && <Pickers />}
        {isHash('item-list-inputs') && <ItemListInputs />}
        {isHash('draggable-lists') && <DraggableLists />}
        {isHash('time-slider-inputs') && <TimeSliderInputs />}
        {isHash('dialog') && <Dialog />}
        {isHash('modals') && <Modals />}
        {isHash('context-menus') && <ContextMenus />}
        {isHash('dropdown-menus') && <DropdownMenus />}
        {isHash('navigations') && <Navigations />}
        {isHash('tooltips') && <Tooltips />}
        {isHash('icons') && <Icons />}
        {isHash('editors') && <Editors />}
        {(isHash('grids-grid') ||
          isHash('grids-static') ||
          isHash('grids-data-bar') ||
          isHash('grids-quadrillion') ||
          isHash('grids-async') ||
          isHash('grids-tree') ||
          isHash('grids-iris')) && <Grids isHash={isHash} />}
        {isHash('charts') && <Charts />}
        {isHash('context-menu-root') && <ContextMenuRoot />}
        {isHash('random-area-plot-animation') && <RandomAreaPlotAnimation />}

        {isHash('') && (
          <SampleMenuCategory data-menu-category="Spectrum Components" />
        )}
        {(isHash('spectrum-buttons') ||
          isHash('spectrum-collections') ||
          isHash('spectrum-content') ||
          isHash('spectrum-forms') ||
          isHash('spectrum-overlays') ||
          isHash('spectrum-well')) && <SpectrumComponents isHash={isHash} />}

        {isHash('') && (
          <SampleMenuCategory data-menu-category="Spectrum Comparison" />
        )}
        {isHash('spectrum-comparison') && <SpectrumComparison />}
      </div>
    </div>
  );
}

export default StyleGuide;
