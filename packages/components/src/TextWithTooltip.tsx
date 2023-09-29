import { useMemo } from 'react';
import { Text } from '@adobe/react-spectrum';
import stylesCommon from './SpectrumComponent.module.scss';
import { PopperOptions, Tooltip } from './popper';

export interface TextWithTooltipProps {
  text?: string | null;
  placement?: PopperOptions['placement'];
}

export function TextWithTooltip({
  text,
  placement = 'top-start',
}: TextWithTooltipProps): JSX.Element {
  const options = useMemo(() => ({ placement }), [placement]);

  return (
    <>
      <Text UNSAFE_className={stylesCommon.spectrumEllipsis}>
        {text ?? (
          /* &nbsp; so that height doesn't collapse when empty */
          <>&nbsp;</>
        )}
      </Text>
      {text == null || text === '' ? null : (
        <Tooltip options={options}>{text}</Tooltip>
      )}
    </>
  );
}

export default TextWithTooltip;
