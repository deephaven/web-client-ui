import deepEqual from 'deep-equal';
/**
 * Store information about links in a dashboard
 */
import {
  SET_DASHBOARD_LINKS,
  ADD_DASHBOARD_LINKS,
  DELETE_DASHBOARD_LINKS,
} from '../actionTypes';

function setDashboardLinks(state, id, links) {
  return { ...state, [id]: links };
}

function addDashboardLinks(state, id, newLinks) {
  const links = state[id];
  const filtered = newLinks.filter(
    newLink =>
      links.findIndex(
        link =>
          deepEqual(link.start, newLink.start) &&
          deepEqual(link.end, newLink.end)
      ) < 0
  );
  return { ...state, [id]: [...links, ...filtered] };
}

function deleteDashboardLinks(state, id, linkIds) {
  return {
    ...state,
    [id]: state[id].filter(link => !linkIds.includes(link.id)),
  };
}

function dashboardLinksReducer(state = {}, action) {
  const { type, id, payload } = action;
  switch (type) {
    case SET_DASHBOARD_LINKS:
      return setDashboardLinks(state, id, payload);
    case ADD_DASHBOARD_LINKS:
      return addDashboardLinks(state, id, payload);
    case DELETE_DASHBOARD_LINKS:
      return deleteDashboardLinks(state, id, payload);
    default:
      return state;
  }
}

export default dashboardLinksReducer;
