import deepEqual from 'deep-equal';
import { updateDashboardData } from '@deephaven/dashboard';
import { ThunkAction } from 'redux-thunk';
import { RootState } from '@deephaven/redux';
import { Action } from 'redux';
import { IdeConnection, IdeSession } from '@deephaven/jsapi-shim';
import { getLinksForDashboard } from './selectors';
import { FilterSet } from '../panels';
import { Link } from '../linker/LinkerUtils';
import { ColumnSelectionValidator } from '../linker/ColumnSelectionValidator';

export interface SessionWrapper {
  session: IdeSession;
  connection: IdeConnection;
  config: {
    type: string;
    id: string;
  };
}
/**
 * Set the session wrapper for the dashboard specified
 * @param id The ID of the dashboard to set the session for
 * @param sessionWrapper The session wrapper object to set for the dashboard
 */
export const setDashboardSessionWrapper = (
  id: string,
  sessionWrapper: SessionWrapper
): ThunkAction<unknown, RootState, undefined, Action<unknown>> => dispatch =>
  dispatch(updateDashboardData(id, { sessionWrapper }));

/**
 * Set the links for a given dashboard
 * @param id The ID of the dashboard to set the links for
 * @param links The links to set
 */
export const setDashboardLinks = (
  id: string,
  links: Link[]
): ThunkAction<unknown, RootState, undefined, Action<unknown>> => dispatch =>
  dispatch(updateDashboardData(id, { links }));

/**
 * Add links to the existing links in a dashboard. Filters out any duplicate links.
 * @param id The ID of the dashboard to add links to
 * @param newLinks The new links to add
 */
export const addDashboardLinks = (
  id: string,
  newLinks: Link[]
): ThunkAction<unknown, RootState, undefined, Action<unknown>> => (
  dispatch,
  getState
) => {
  const links = getLinksForDashboard(getState(), id);
  const filtered = newLinks.filter(
    newLink =>
      links.findIndex(
        link =>
          deepEqual(link.start, newLink.start) &&
          deepEqual(link.end, newLink.end)
      ) < 0
  );
  return dispatch(setDashboardLinks(id, links.concat(filtered)));
};

/**
 * Delete links from a dashboard
 * @param id The ID of the dashboard to delete links from
 * @param linkIds The link IDs to delete
 */
export const deleteDashboardLinks = (
  id: string,
  linkIds: string[]
): ThunkAction<unknown, RootState, undefined, Action<unknown>> => (
  dispatch,
  getState
) => {
  const links = getLinksForDashboard(getState(), id);
  const newLinks = links.filter(link => !linkIds.includes(link.id));
  return dispatch(setDashboardLinks(id, newLinks));
};

/**
 * Set the isolated linker panel ID for a dashboard
 * @param id The ID of the dashboard to set the isolated linker panel ID in
 * @param isolatedLinkerPanelId The isolated panel ID, or undefined to unset
 */
export const setDashboardIsolatedLinkerPanelId = (
  id: string,
  isolatedLinkerPanelId: string | string[] | undefined
): ThunkAction<unknown, RootState, undefined, Action<unknown>> => dispatch =>
  dispatch(updateDashboardData(id, { isolatedLinkerPanelId }));

/**
 * Set the column selection validator for a dashboard
 * @param id The ID of the dashboard to set the column selection validator on
 * @param columnSelectionValidator The column selection validator to set
 */
export const setDashboardColumnSelectionValidator = (
  id: string,
  columnSelectionValidator: ColumnSelectionValidator | undefined
): ThunkAction<unknown, RootState, undefined, Action<unknown>> => dispatch =>
  dispatch(updateDashboardData(id, { columnSelectionValidator }));

/**
 * Set the console settings for a dashboard
 * @param id The ID of the dashboard to set the console settings on
 * @param consoleSettings The console settings to set for the dashboard
 */
export const setDashboardConsoleSettings = (
  id: string,
  consoleSettings: Record<string, unknown>
): ThunkAction<unknown, RootState, undefined, Action<unknown>> => dispatch =>
  dispatch(updateDashboardData(id, { consoleSettings }));

/**
 * Set the filter sets for a specific dashboard
 * @param id The ID of the dashboard to set the filter sets for
 * @param filterSets The filter sets to set
 */
export const setDashboardFilterSets = (
  id: string,
  filterSets: FilterSet[]
): ThunkAction<unknown, RootState, undefined, Action<unknown>> => dispatch =>
  dispatch(updateDashboardData(id, { filterSets }));
