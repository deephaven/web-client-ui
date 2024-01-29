import { VariableDefinition } from '@deephaven/jsapi-types';
import { useContextOrThrow } from '@deephaven/react-hooks';
import { createContext } from 'react';

/**
 * Metadata for an object. Used when needing to fetch an object.
 */
export type ObjectMetadata = Record<string, unknown> & VariableDefinition;

export type ObjectFetcher<T = unknown> = (
  metadata: ObjectMetadata
) => Promise<T>;

export const ObjectFetcherContext = createContext<ObjectFetcher | null>(null);

/**
 * Get the metadata for an object definition that is serializable.
 * @param definition Object definition to get the metadata for
 * @returns Metadata object that is serializable
 */
export function getObjectMetadata(
  definition: VariableDefinition
): ObjectMetadata {
  // Can't use a spread operator because the VariableDefinition JS API object uses property accessors
  return {
    id: definition.id,
    name: definition.name,
    type: definition.type,
    title: definition.title,
  };
}

export function getVariableDefinition(
  metadata: ObjectMetadata
): VariableDefinition {
  if (metadata.id != null) {
    return {
      type: metadata.type,
      id: metadata.id,
    };
  }
  return {
    type: metadata.type,
    name: metadata.name,
    title: metadata.title ?? metadata.name,
  };
}

export function useObjectFetcher(): ObjectFetcher {
  return useContextOrThrow(
    ObjectFetcherContext,
    'No ObjectFetcher available in useObjectFetcher. Was code wrapped in ObjectFetcherContext.Provider?'
  );
}
