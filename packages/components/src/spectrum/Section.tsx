/**
 * Wrapping Spectrum `Section` components will break functionality due to the way
 * they are consumed by collection components. They are only used to pass data
 * and don't render anything on their own, so they don't need to be wrapped.
 * See https://github.com/adobe/react-spectrum/blob/main/packages/%40react-stately/collections/src/Section.ts#L18
 */
import { Section } from '@adobe/react-spectrum';

export type { SectionProps } from '@react-types/shared';

export { Section };

export default Section;
