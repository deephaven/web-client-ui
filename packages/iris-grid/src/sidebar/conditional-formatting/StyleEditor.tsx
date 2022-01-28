import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Log from '@deephaven/log';
import { ColorUtils } from '@deephaven/utils';
import { dhSort, vsCheck } from '@deephaven/icons';
import { Button, DropdownMenu } from '@deephaven/components';
import {
  FormatStyleType,
  getLabelForStyleType,
  FormatStyleConfig,
  getBackgroundForStyleConfig,
  getColorForStyleConfig,
} from './ConditionalFormattingUtils';

import './StyleEditor.scss';

const log = Log.module('StyleEditor');

const DEFAULT_BACKGROUND = '#fcfcfa';

const DEFAULT_COLOR_LIGHT = '#f0f0ee';

const DEFAULT_COLOR_DARK = '#1a171a';

const DEFAULT_DROPDOWN_WIDTH = 200;

export interface ConditionEditorProps {
  config: FormatStyleConfig;
  onChange?: (config: FormatStyleConfig) => void;
}

const DEFAULT_CALLBACK = () => undefined;

const StyleEditor = (props: ConditionEditorProps): JSX.Element => {
  const { config, onChange = DEFAULT_CALLBACK } = props;
  const [styleType, setStyleType] = useState(config.type);
  const [background, setBackground] = useState(
    config.customConfig?.background ?? DEFAULT_BACKGROUND
  );
  const [isShown, setShown] = useState(false);
  const [dropdownWidth, setDropdownWidth] = useState(DEFAULT_DROPDOWN_WIDTH);
  const csContainer = useRef<HTMLDivElement>(null);

  const handleBackgroundChange = useCallback(e => {
    const { value } = e.target;
    log.debug('handleBackgroundChange', value);
    setBackground(value);
  }, []);

  const handleMenuClosed = useCallback(() => {
    if (isShown) {
      setShown(false);
    }
  }, [isShown]);

  const handleToggleClick = useCallback(() => {
    if (!isShown) {
      updateDropdownWidth();
    }
    setShown(!isShown);
  }, [isShown]);

  const styleOptions = useMemo(
    () => [
      FormatStyleType.NO_FORMATTING,
      FormatStyleType.POSITIVE,
      FormatStyleType.NEGATIVE,
      FormatStyleType.WARN,
      FormatStyleType.NEUTRAL,
      FormatStyleType.ACCENT_1,
      FormatStyleType.ACCENT_2,
      FormatStyleType.CUSTOM,
    ],
    []
  );

  function updateDropdownWidth(): void {
    if (csContainer.current) {
      setDropdownWidth(csContainer.current.getBoundingClientRect().width);
    }
  }

  useEffect(() => {
    onChange({
      type: styleType,
      customConfig: {
        color: ColorUtils.isDark(background)
          ? DEFAULT_COLOR_LIGHT
          : DEFAULT_COLOR_DARK,
        background,
      },
    });
  }, [onChange, styleType, background]);

  const renderOptions = useCallback(() => {
    let matchFound = false;
    const optionArray: JSX.Element[] = [];
    for (let index = 0; index < styleOptions.length; index += 1) {
      const option = styleOptions[index];
      const key = `option-${index}-${option}`;
      matchFound = matchFound || option === styleType;
      optionArray.push(
        <Button
          key={key}
          kind="inline"
          className="style-option-btn"
          onClick={() => {
            setStyleType(option);
            setShown(false);
          }}
          style={{
            color: getColorForStyleConfig({ type: option }),
            background: getBackgroundForStyleConfig({ type: option }),
          }}
        >
          {option === styleType && (
            <FontAwesomeIcon icon={vsCheck} className="mr-2" />
          )}
          {option !== styleType && <span className="mr-4" />}
          {getLabelForStyleType(option)}
        </Button>
      );
    }
    return optionArray;
  }, [styleOptions, styleType]);

  const renderMenuElement = useCallback(
    () => (
      <div
        className="style-menu-container"
        role="presentation"
        style={{ width: dropdownWidth }}
      >
        <div className="style-options">{renderOptions()}</div>
      </div>
    ),
    [dropdownWidth, renderOptions]
  );

  return (
    <div className="style-editor">
      <div className="mb-2" ref={csContainer}>
        <label className="mb-0">Style</label>
        <Button
          kind="inline"
          className="cs-dropdown"
          style={{
            color: getColorForStyleConfig({ type: styleType }),
            background: getBackgroundForStyleConfig({ type: styleType }),
          }}
          onClick={handleToggleClick}
        >
          {getLabelForStyleType(styleType)}

          <span>
            <FontAwesomeIcon icon={dhSort} className="cs-caret" />
          </span>
          <DropdownMenu
            isShown={isShown}
            actions={{ menuElement: renderMenuElement() }}
            popperOptions={{ placement: 'bottom-start' }}
            popperClassName="style-dropdown-menu"
            onMenuClosed={handleMenuClosed}
            menuStyle={{ maxWidth: '100rem' }}
          />
        </Button>
      </div>

      {styleType === FormatStyleType.CUSTOM && (
        <div className="mb-2">
          <label className="mb-0">Background</label>
          <input
            type="color"
            value={background}
            className="custom-select color-select"
            onChange={handleBackgroundChange}
          />
        </div>
      )}
    </div>
  );
};

export default StyleEditor;
