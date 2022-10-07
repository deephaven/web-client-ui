import shortid from 'shortid';

/**
 * Generate a unique python variable name
 * @param prefix Prefix to give the variable name
 * @returns A unique string that is a valid python variable name
 */
export function generateVarName(prefix = 'v'): string {
  // Don't allow a `-` in variable names
  let id: string;
  do {
    id = shortid();
  } while (id.includes('-'));
  return `${prefix}_${id}`;
}

export default { generateVarName };
