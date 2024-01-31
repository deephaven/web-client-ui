import { VariableDefinition } from '@deephaven/jsapi-types';
import { useContextOrThrow } from '@deephaven/react-hooks';
import { createContext } from 'react';

/**
 * Metadata for an object. Used when needing to fetch an object.
 */
export type ObjectMetadata = VariableDefinition;

export type ObjectFetcher<T = unknown> = (
  metadata: ObjectMetadata
) => Promise<T>;

export const ObjectFetcherContext = createContext<ObjectFetcher | null>(null);

/**
 * Get the serializable metadata for an object definition.
 * Includes the properties that define the variable, such as id, title, type, and name if available
 * @param definition Object definition to get the metadata for
 * @returns Metadata object that is serializable
 */
export function getObjectMetadata(
  definition: VariableDefinition
): ObjectMetadata {
  // Can't use a spread operator because of how the GWT compiled code defines properties on the object: https://github.com/gwtproject/gwt/issues/9913
  return {
    id: definition.id,
    name: definition.name,
    type: definition.type,
    title: definition.title,
  };
}

/**
 * Get the VariableDefinition from the provided object metadata
 * @param metadata Object metadata, which should include the type and either the id or title
 * @returns Variable definition based on the metadata
 */
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

/**
 * Use a function to fetch an object based on provided metadata
 * @returns Function to asynchronously fetch an object based on provided metadata
 */
export function useObjectFetcher<T = unknown>(): ObjectFetcher<T> {
  return useContextOrThrow(
    ObjectFetcherContext,
    'No ObjectFetcher available in useObjectFetcher. Was code wrapped in ObjectFetcherContext.Provider?'
  ) as ObjectFetcher<T>;
}
