import deepEqual from 'deep-equal';
import Log from '@deephaven/log';

const log = Log.module('DashboardUtils');

class DashboardUtils {
  static TYPES = Object.freeze({
    DASHBOARD: 'Dashboard',
    CODE_STUDIO: 'CodeStudio',
    QUERY_MONITOR: 'QueryMonitor',
  });

  static META_DATA = Object.freeze({
    Dashboard: { isShareable: true, isChangeable: true },
    CodeStudio: { isShareable: false, isChangeable: true },
    QueryMonitor: { isShareable: false, isChangeable: false },
  });

  static getDashboardMetadataForRow({
    id,
    name: title,
    data,
    owner,
    viewerGroups,
    adminGroups,
    lastModifiedTime = Date.now(),
  }) {
    const { type } = data;
    return {
      id,
      type,
      title,
      owner,
      viewerGroups: DashboardUtils.cloneArray(viewerGroups),
      adminGroups: DashboardUtils.cloneArray(adminGroups),
      lastModifiedTime,
      ...DashboardUtils.META_DATA[type],
    };
  }

  static getDashboardMetadataForTabModel({
    id,
    type,
    title,
    owner,
    viewerGroups,
    adminGroups,
    lastModifiedTime,
    isShareable,
    isChangeable,
  }) {
    return {
      id,
      type,
      title,
      owner,
      viewerGroups,
      adminGroups,
      lastModifiedTime,
      isShareable,
      isChangeable,
    };
  }

  static getDashboardRowForTabModel({
    id,
    viewerGroups,
    adminGroups,
    type,
    title,
    layoutConfig,
    layoutSettings,
    owner,
    data,
  }) {
    return {
      id,
      name: title,
      owner,
      data: {
        type,
        config: layoutConfig,
        layoutSettings,
        data,
      },
      adminGroups,
      viewerGroups,
    };
  }

  static updateDashboardMetadataInList(dashboardList, metadata) {
    const { id } = metadata;
    const index = dashboardList.findIndex(({ id: itemId }) => itemId === id);
    if (index === -1) {
      log.error(`Could not find dashboard ${id} in list`);
      return dashboardList;
    }
    if (deepEqual(dashboardList[index], metadata)) {
      log.debug('No metadata modified', id);
      return dashboardList;
    }
    const updatedList = [...dashboardList];
    updatedList[index] = metadata;
    return updatedList;
  }

  static cloneData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  static cloneArray(array) {
    return array != null ? [...array] : [];
  }
}

export default DashboardUtils;
