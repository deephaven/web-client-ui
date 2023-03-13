import { RootState } from '@deephaven/redux';
import LayoutStorage from '../storage/LayoutStorage';

/**
 * Get the layout storage used by the app
 * @param store The redux store
 * @returns The layout storage instance
 */
export const getLayoutStorage = <State extends RootState = RootState>(
  store: State
): LayoutStorage => store.layoutStorage as LayoutStorage;

/**
 * Get the configuration values of the server
 * @param store The redux store
 * @returns The layout storage instance
 */
export const getServerConfigValues = <State extends RootState = RootState>(
  store: State
): State['serverConfigValues'] => store.serverConfigValues;
