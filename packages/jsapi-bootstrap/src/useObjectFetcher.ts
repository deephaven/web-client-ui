import { VariableDescriptor, VariableDefinition } from '@deephaven/jsapi-types';
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
): value is VariableDescriptor {
  return isNameVariableDescriptor(value) || isIdVariableDescriptor(value);
}

/**
 * Function to fetch an object based on a provided descriptor object
 */
export type ObjectFetcher<T = unknown> = (
  descriptor: VariableDescriptor
) => Promise<T>;

export const ObjectFetcherContext = createContext<ObjectFetcher | null>(null);

/**
 * Get the serializable descriptor for a variable definition.
 * @param definition Variable definition to get the serialized descriptor for
 * @returns Descriptor object that is serializable
 */
export function getVariableDescriptor(
  definition: VariableDefinition
): NameVariableDescriptor | IdVariableDescriptor {
  // Can't use a spread operator because of how the GWT compiled code defines properties on the object: https://github.com/gwtproject/gwt/issues/9913
  if (isIdVariableDescriptor(definition)) {
    return {
      id: definition.id,
      type: definition.type,
    };
  }
  if (definition.title != null || definition.name != null) {
    return {
      name: definition.title ?? definition.name ?? '',
      type: definition.type,
    };
  }
  throw new Error(`Can't get a descriptor for definition: ${definition}`);
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
