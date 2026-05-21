import { useContext } from 'react';
import {
  IrisGridTableOptionsContext,
  type IrisGridTableOptionsExtension,
} from './IrisGridTableOptionsContext';

const EMPTY_EXTENSION: IrisGridTableOptionsExtension = Object.freeze({});

/**
 * Returns the current `IrisGridTableOptionsExtension` from context, or a
 * frozen empty extension when no Provider is present. Always returns
 * a non-null value so call sites can destructure
 * `transformTableOptions` without a null guard.
 */
export function useTableOptionsExtension(): IrisGridTableOptionsExtension {
  return useContext(IrisGridTableOptionsContext) ?? EMPTY_EXTENSION;
}

export default useTableOptionsExtension;
