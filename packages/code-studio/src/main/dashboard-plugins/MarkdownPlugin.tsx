import React, { ComponentType, useCallback, useEffect } from 'react';
import { DashboardPluginComponentProps } from '../../dashboard/DashboardPlugin';
import { MarkdownPanel } from '../../dashboard/panels';
import MarkdownUtils from '../../controls/markdown/MarkdownUtils';
import { dehydrate, hydrate } from '../../dashboard/DashboardUtils';

type MarkdownComponentState = {
  panelState?: { content: string } | null;
};

export const MarkdownPlugin = ({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  const dehydrateMarkdown = useCallback(config => {
    const { title, componentState, props } = config;
    let { panelState = null }: MarkdownComponentState = props;
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

  const registerComponents = useCallback(() => {
    registerComponent(
      MarkdownPanel.COMPONENT,
      (MarkdownPanel as unknown) as ComponentType,
      hydrate,
      dehydrateMarkdown
    );
  }, [dehydrateMarkdown, registerComponent]);

  useEffect(() => {
    registerComponents();
  }, [registerComponents]);

  return <></>;
};

export default MarkdownPlugin;
