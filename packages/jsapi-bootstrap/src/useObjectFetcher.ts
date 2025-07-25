import type { dh } from '@deephaven/jsapi-types';
import { useContextOrThrow } from '@deephaven/react-hooks';
import { createContext } from 'react';

/**
 * Descriptor for a variable by name. Used when needed to fetch an object.
 */
export type NameVariableDescriptor = {
  /** Type of the variable */
  type: string;
  /** Name of the variable */
  name: string;
};

/**
 * Descriptor for a variable by id. Used when needed to fetch an object.
 */
export type IdVariableDescriptor = {
  /** Type of the variable */
  type: string;
  /** Id of the variable */
  id: string;
};

export type UriVariableDescriptor = string;

export function isNameVariableDescriptor(
  value: unknown
): value is NameVariableDescriptor {
  return (
    typeof value === 'object' &&
    value != null &&
    typeof (value as NameVariableDescriptor).type === 'string' &&
    (value as NameVariableDescriptor).name != null
  );
}

export function isIdVariableDescriptor(
  value: unknown
): value is IdVariableDescriptor {
  return (
    typeof value === 'object' &&
    value != null &&
    typeof (value as IdVariableDescriptor).type === 'string' &&
    (value as IdVariableDescriptor).id != null
  );
}

export function isVariableDescriptor(
  value: unknown
): value is dh.ide.VariableDescriptor {
  return isNameVariableDescriptor(value) || isIdVariableDescriptor(value);
}

/**
 * Function to fetch an object based on a provided descriptor object.
 * @param descriptor Descriptor object or URI to fetch the object from. Can be extended by a specific implementation to
 *                   include additional fields (such as a session ID) to uniquely identify an object.
 */
export type ObjectFetcher = <T = unknown>(
  descriptor: dh.ide.VariableDescriptor | UriVariableDescriptor
) => Promise<T>;

export const ObjectFetcherContext = createContext<ObjectFetcher | null>(null);

/**
 * Gets a descriptor that only has the ID or name set, but not both.
 * API will throw an error if both are set when fetching from the connection.
 * @param descriptor Variable descriptor to sanitize
 * @returns Descriptor object that has either the ID or name set, but not both.
 */
export function sanitizeVariableDescriptor(
  descriptor: Partial<dh.ide.VariableDescriptor>
): NameVariableDescriptor | IdVariableDescriptor {
  // Can't use a spread operator because of how the GWT compiled code defines properties on the object: https://github.com/gwtproject/gwt/issues/9913
  if (isIdVariableDescriptor(descriptor)) {
    return {
      id: descriptor.id,
      type: descriptor.type,
    };
  }
  if (isNameVariableDescriptor(descriptor)) {
    return {
      name: descriptor.name ?? '',
      type: descriptor.type,
    };
  }
  throw new Error(`Invalid descriptor: ${descriptor}`);
}

/**
 * Get the variable descriptor for a definition.
 * @param definition Definition to get the variable descriptor from
 * @returns Serializable VariableDescriptor object
 */
export function getVariableDescriptor(
  definition: dh.ide.VariableDescriptor & { title?: string }
): dh.ide.VariableDescriptor {
  return {
    type: definition.type ?? '',
    name: definition.title ?? definition.name,
    id: definition.id,
  };
}

/**
 * Use a function to fetch an object based on provided metadata
 * @returns Function to asynchronously fetch an object based on provided metadata
 */
export function useObjectFetcher(): ObjectFetcher {
  return useContextOrThrow(
    ObjectFetcherContext,
    'No ObjectFetcher available in useObjectFetcher. Was code wrapped in ObjectFetcherContext.Provider?'
  );
}
