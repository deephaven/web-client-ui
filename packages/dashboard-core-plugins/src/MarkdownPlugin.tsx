import React, { useCallback, useEffect } from 'react';
import shortid from 'shortid';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  dehydrate,
  hydrate,
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

export const MarkdownPlugin = (props: MarkdownPluginProps): JSX.Element => {
  assertIsDashboardPluginProps(props);
  const { id, layout, panelManager, registerComponent } = props;
  const dehydrateMarkdown = useCallback(config => {
    const { title, componentState, props: configProps } = config;
    let { panelState = null }: MarkdownComponentState = configProps;
    if (componentState) {
      ({ panelState = null } = componentState as MarkdownComponentState);
    }
    if (
      !title ||
      !panelState ||
      !panelState.content ||
      panelState.content.length === 0 ||
      panelState.content === MarkdownUtils.DEFAULT_CONTENT
    ) {
      // We don't want to save it if there's no content
      return null;
    }
    return dehydrate(config);
  }, []);

  const handleOpen = useCallback(
    ({
      title = '',
      metadata = {},
      id: panelId = shortid.generate(),
      focusElement = LayoutUtils.DEFAULT_FOCUS_SELECTOR,
      createNewStack = false,
      dragEvent = null,
    } = {}) => {
      const openedMarkdowns = panelManager.getOpenedPanelConfigsOfType(
        MarkdownPanel.COMPONENT
      );
      const closedMarkdowns = panelManager.getClosedPanelConfigsOfType(
        MarkdownPanel.COMPONENT
      );
      const usedTitles = openedMarkdowns.map(markdown => markdown.title ?? '');
      const panelTitle = title || MarkdownUtils.getNewMarkdownTitle(usedTitles);
      const content =
        closedMarkdowns.length > 0 ? null : MarkdownUtils.DEFAULT_CONTENT;
      const config = {
        type: 'react-component',
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

  useEffect(() => {
    const cleanups = [
      registerComponent(
        MarkdownPanel.COMPONENT,
        MarkdownPanel,
        hydrate,
        dehydrateMarkdown
      ),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [dehydrateMarkdown, registerComponent]);

  useListener(layout.eventHub, MarkdownEvent.OPEN, handleOpen);

  return <></>;
};

export default MarkdownPlugin;
