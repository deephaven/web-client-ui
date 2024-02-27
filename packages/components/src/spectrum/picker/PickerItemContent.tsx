import { isValidElement, ReactNode } from 'react';
import { Text } from '@adobe/react-spectrum';
import stylesCommon from '../../SpectrumComponent.module.scss';

export interface PickerItemContentProps {
  children: ReactNode;
}

/**
 * Picker item content. Text content will be wrapped in a Spectrum Text
 * component with ellipsis overflow handling.
 */
export function PickerItemContent({
  children: content,
}: PickerItemContentProps): JSX.Element {
  if (isValidElement(content)) {
    return content;
  }

  if (content === '') {
    // Prevent the item height from collapsing when the content is empty
    // eslint-disable-next-line no-param-reassign
    content = <>&nbsp;</>;
  }

  return (
    <Text UNSAFE_className={stylesCommon.spectrumEllipsis}>{content}</Text>
  );
}

export default PickerItemContent;
