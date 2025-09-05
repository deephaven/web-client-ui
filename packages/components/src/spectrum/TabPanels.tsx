import React, { type Key, useMemo, useRef } from 'react';
import {
  createHtmlPortalNode,
  type HtmlPortalNode,
  InPortal,
  OutPortal,
} from 'react-reverse-portal';
import {
  Item,
  TabPanels,
  type SpectrumTabPanelsProps,
} from '@adobe/react-spectrum';
import { type CollectionChildren } from '@react-types/shared';

export interface DHCTabPanelsProps<T> extends SpectrumTabPanelsProps<T> {
  /**
   * If static panels with keys should stay mounted when not visible.
   * This will not apply to dynamic panels created with a render function.
   * Defaults to false.
   */
  keepMounted?: boolean;
}

/**
 * Wrapper for react-spectrum TabPanels that adds support for keeping panels mounted
 * when not visible using the `keepMounted` prop.
 * Panels created with a render function will not be kept mounted.
 */
export function DHCTabPanels<T extends object>(
  props: DHCTabPanelsProps<T>
): JSX.Element {
  const { children, keepMounted: keepMountedProp = false, ...rest } = props;
  const keepMounted = keepMountedProp && typeof children !== 'function';

  const portalNodeMap = useRef(new Map<Key, HtmlPortalNode>());

  const portalNodes = useMemo(() => {
    const nodes: JSX.Element[] = [];
    const nextNodeMap = new Map<Key, HtmlPortalNode>(); // Keep track of the portals we use so we can clean up stale portals
    if (!keepMounted) {
      portalNodeMap.current = nextNodeMap;
      return nodes;
    }
    React.Children.forEach(children, child => {
      // Spectrum would ignore these anyway because it uses Item key to determine if the panel mounts
      if (child == null || child.key == null) {
        return;
      }

      // Skip children with function-based content (i.e. ItemRenderer) as it can't be portaled
      if (typeof child.props.children === 'function') {
        throw new Error(
          'DHCTabPanels cannot use keepMounted with an ItemRenderer function as its children'
        );
      }

      let portal = portalNodeMap.current.get(child.key);
      if (portal == null) {
        portal = createHtmlPortalNode({
          attributes: {
            // Should make the placeholder div not affect layout and act as if children are mounted directly to the parent
            style: 'display: contents',
          },
        });
      }
      nextNodeMap.set(child.key, portal);

      nodes.push(
        <InPortal node={portal} key={child.key}>
          {child.props.children}
        </InPortal>
      );
    });

    portalNodeMap.current = nextNodeMap;

    return nodes;
  }, [children, keepMounted]);

  const mappedChildren: CollectionChildren<T> = useMemo(() => {
    const newChildren: CollectionChildren<T> = [];
    if (!keepMounted) {
      return newChildren;
    }
    // Need to use forEach instead of map because map always changes the key of the returned elements
    React.Children.forEach(children, child => {
      if (child == null || child.key == null) {
        newChildren.push(child);
        return;
      }

      const portal = portalNodeMap.current.get(child.key);
      if (portal == null) {
        newChildren.push(child);
        return;
      }

      newChildren.push(
        <Item key={child.key}>
          <OutPortal node={portal} />
        </Item>
      );
    });

    return newChildren;
  }, [children, keepMounted]);

  return (
    <>
      {keepMounted && portalNodes}
      <TabPanels
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
      >
        {keepMounted ? mappedChildren : children}
      </TabPanels>
    </>
  );
}
