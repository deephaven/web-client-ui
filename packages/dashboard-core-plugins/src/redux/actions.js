import deepEqual from 'deep-equal';
import { updateDashboardData } from '@deephaven/dashboard';
import { getLinksForDashboard } from './selectors';

/**
 * Set the session wrapper for the dashboard specified
 * @param {string} id The ID of the dashboard to set the session for
 * @param {SessionWrapper} sessionWrapper The session wrapper object to set for the dashboard
 */
export const setDashboardSessionWrapper = (id, sessionWrapper) => dispatch =>
  dispatch(updateDashboardData(id, { sessionWrapper }));

/**
 * Set the links for a given dashboard
 * @param {string} id The ID of the dashboard to set the links for
 * @param {Link[]} links The links to set
 */
export const setDashboardLinks = (id, links) => dispatch =>
  dispatch(updateDashboardData(id, { links }));

/**
 * Add links to the existing links in a dashboard. Filters out any duplicate links.
 * @param {string} id The ID of the dashboard to add links to
 * @param {Link[]} newLinks The new links to add
 */
export const addDashboardLinks = (id, newLinks) => (dispatch, getState) => {
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
 * @param {string} id The ID of the dashboard to delete links from
 * @param {string[]} linkIds The link IDs to delete
 */
export const deleteDashboardLinks = (id, linkIds) => (dispatch, getState) => {
  const links = getLinksForDashboard(getState(), id);
  const newLinks = links.filter(link => !linkIds.includes(link.id));
  return dispatch(setDashboardLinks(id, newLinks));
};

/**
 * Set the isolated linker panel ID for a dashboard
 * @param {string} id The ID of the dashboard to set the isolated linker panel ID in
 * @param {string|undefined} isolatedLinkerPanelId The isolated panel ID, or undefined to unset
 */
export const setDashboardIsolatedLinkerPanelId = (
  id,
  isolatedLinkerPanelId
) => dispatch => dispatch(updateDashboardData(id, { isolatedLinkerPanelId }));

/**
 * Set the column selection validator for a dashboard
 * @param {string} id The ID of the dashboard to set the column selection validator on
 * @param {ColumnSelectionValidator|undefined} columnSelectionValidator The column selection validator to set
 */
export const setDashboardColumnSelectionValidator = (
  id,
  columnSelectionValidator
) => dispatch =>
  dispatch(updateDashboardData(id, { columnSelectionValidator }));

/**
 * Set the console settings for a dashboard
 * @param {string} id The ID of the dashboard to set the console settings on
 * @param {ConsoleSettings} consoleSettings The console settings to set for the dashboard
 */
export const setDashboardConsoleSettings = (id, consoleSettings) => dispatch =>
  dispatch(updateDashboardData(id, { consoleSettings }));
