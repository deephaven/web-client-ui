import cl from 'classnames';

export const SAMPLE_SECTION_CLASS = 'sample-section';

/**
 * Return id, className, and UNSAFE_className props for a sample section. Class
 * names generated by this util are used by e2e tests to take snapshots of
 * styleguide sections.
 * @param name Name of the section
 * @param classNames Optional list of class names to include
 */
export function sampleSectionIdAndClasses(
  name: string,
  classNames: string[] = []
): { id: string; className: string; UNSAFE_className: string } {
  const id = `${SAMPLE_SECTION_CLASS}-${name
    .toLocaleLowerCase()
    .replaceAll(' ', '-')}`;

  const className = cl(SAMPLE_SECTION_CLASS, ...classNames);

  return {
    id,
    className,
    // Used for Spectrum components
    UNSAFE_className: className,
  };
}
