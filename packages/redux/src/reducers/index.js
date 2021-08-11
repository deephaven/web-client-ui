import activeTool from './activeTool';
import dashboardClosedPanels from './dashboardClosedPanels';
import dashboardOpenedPanelMaps from './dashboardOpenedPanelMaps';
import dashboardInputFilters from './dashboardInputFilters';
import dashboardIsolatedLinkerPanelIds from './dashboardIsolatedLinkerPanelIds';
import dashboardColumns from './dashboardColumns';
import dashboardColumnSelectionValidators from './dashboardColumnSelectionValidators';
import dashboardConsoleCreatorSettings from './dashboardConsoleCreatorSettings';
import dashboardLinks from './dashboardLinks';
import dashboardPanelTableMaps from './dashboardPanelTableMaps';
import isLoggedIn from './isLoggedIn';
import storage from './storage';
import user from './user';
import workspace from './workspace';
import controllerConfiguration from './controllerConfiguration';
import draftManager from './draftManager';
import serverConfigValues from './serverConfigValues';

const reducers = {
  activeTool,
  dashboardClosedPanels,
  dashboardOpenedPanelMaps,
  dashboardColumnSelectionValidators,
  dashboardConsoleCreatorSettings,
  dashboardInputFilters,
  dashboardIsolatedLinkerPanelIds,
  dashboardColumns,
  dashboardLinks,
  dashboardPanelTableMaps,
  isLoggedIn,
  storage,
  user,
  workspace,
  controllerConfiguration,
  draftManager,
  serverConfigValues,
};

export default reducers;
