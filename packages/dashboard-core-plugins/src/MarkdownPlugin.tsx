import { useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';
import {
  assertIsDashboardPluginProps,
  type DashboardPluginComponentProps,
  LayoutUtils,
  useListener,
} from '@deephaven/dashboard';
import { MarkdownPanel } from './panels';
import MarkdownUtils from './controls/markdown/MarkdownUtils';
import MarkdownEvent from './events/MarkdownEvent';

export type MarkdownPluginProps = Partial<DashboardPluginComponentProps>;

export type MarkdownComponentState = {
  panelState?: { content: string } | null;
};

export function MarkdownPlugin(props: MarkdownPluginProps): JSX.Element | null {
  assertIsDashboardPluginProps(props);
  const { id, layout, panelManager, registerComponent } = props;

  const handleOpen = useCallback(
    ({
      title = '',
      metadata = {},
      id: panelId = nanoid(),
      focusElement = LayoutUtils.DEFAULT_FOCUS_SELECTOR,
      createNewStack = false,
      dragEvent = undefined,
    } = {}) => {
      const openedMarkdowns = panelManager.getOpenedPanelConfigsOfType(
        MarkdownPanel.COMPONENT
      );
      const usedTitles = openedMarkdowns.map(markdown => markdown.title ?? '');
      const panelTitle =
        title != null && title !== ''
          ? title
          : MarkdownUtils.getNewMarkdownTitle(usedTitles);
      const content = null;
      const config = {
        type: 'react-component' as const,
        component: MarkdownPanel.COMPONENT,
        props: {
          id: panelId,
          metadata,
          panelState: { content },
          localDashboardId: id,
        },
        title: panelTitle,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({
        root,
        config,
        focusElement,
        createNewStack,
        dragEvent,
      });
    },
    [id, layout, panelManager]
  );

  useEffect(
    function registerComponentsAndReturnCleanup() {
      const cleanups = [
        registerComponent(MarkdownPanel.COMPONENT, MarkdownPanel),
      ];

      return () => {
        cleanups.forEach(cleanup => cleanup());
      };
    },
    [registerComponent]
  );

  useListener(layout.eventHub, MarkdownEvent.OPEN, handleOpen);

  return null;
}

export default MarkdownPlugin;
