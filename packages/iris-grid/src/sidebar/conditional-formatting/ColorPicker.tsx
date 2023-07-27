// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { dhSort, vsCheck } from '@deephaven/icons';
// import { Button, DropdownMenu } from '@deephaven/components';
// import { ColorUtils } from '@deephaven/utils';
// import {
//   FormatStyleType,
//   getLabelForStyleType,
//   FormatStyleConfig,
//   getBackgroundForStyleConfig,
//   getColorForStyleConfig,
// } from './ConditionalFormattingUtils';

// const DEFAULT_BACKGROUND = '#fcfcfa';

// const DEFAULT_DROPDOWN_WIDTH = 200;

// export interface ColorPickerProps {
//   styleType: FormatStyleType;
//   onChange?: (config: FormatStyleConfig) => void;
// }

// function ColorPicker(props: ColorPickerProps): JSX.Element {
//   const { styleType, onChange } = props;
//   const [background, setBackground] = useState(
//     config.customConfig?.background ?? DEFAULT_BACKGROUND
//   );

//   const [isShown, setShown] = useState(false);
//   const [dropdownWidth, setDropdownWidth] = useState(DEFAULT_DROPDOWN_WIDTH);
//   const csContainer = useRef<HTMLDivElement>(null);

//   const handleToggleClick = useCallback(() => {
//     if (!isShown) {
//       updateDropdownWidth();
//     }
//     setShown(!isShown);
//   }, [isShown]);

//   const styleOptions = useMemo(
//     () => [
//       FormatStyleType.NO_FORMATTING,
//       FormatStyleType.POSITIVE,
//       FormatStyleType.NEGATIVE,
//       FormatStyleType.WARN,
//       FormatStyleType.NEUTRAL,
//       FormatStyleType.ACCENT_1,
//       FormatStyleType.ACCENT_2,
//       FormatStyleType.CUSTOM,
//     ],
//     []
//   );

//   function updateDropdownWidth(): void {
//     if (csContainer.current) {
//       setDropdownWidth(csContainer.current.getBoundingClientRect().width);
//     }
//   }

//   useEffect(
//     function updateTheme() {
//       onChange({
//         type: styleType,
//         customConfig: {
//           color: ColorUtils.isDark(background)
//             ? DEFAULT_COLOR_LIGHT
//             : DEFAULT_COLOR_DARK,
//           background,
//         },
//       });
//     },
//     [onChange, styleType, background]
//   );

//   const renderOptions = useCallback(() => {
//     let matchFound = false;
//     const optionArray: JSX.Element[] = [];
//     for (let index = 0; index < styleOptions.length; index += 1) {
//       const option = styleOptions[index];
//       const key = `option-${index}-${option}`;
//       matchFound = matchFound || option === styleType;
//       optionArray.push(
//         <Button
//           key={key}
//           kind="inline"
//           className="style-option-btn"
//           onClick={() => {
//             setStyleType(option);
//             setShown(false);
//           }}
//           style={{
//             color: getColorForStyleConfig({ type: option }),
//             background: getBackgroundForStyleConfig({ type: option }),
//           }}
//         >
//           {option === styleType && (
//             <FontAwesomeIcon icon={vsCheck} className="mr-2" />
//           )}
//           {option !== styleType && <span className="mr-4" />}
//           {getLabelForStyleType(option)}
//         </Button>
//       );
//     }
//     return optionArray;
//   }, [styleOptions, styleType]);

//   const renderMenuElement = useCallback(
//     () => (
//       <div
//         className="style-menu-container"
//         role="presentation"
//         style={{ width: dropdownWidth }}
//       >
//         <div className="style-options">{renderOptions()}</div>
//       </div>
//     ),
//     [dropdownWidth, renderOptions]
//   );

//   return (
//     <Button
//       kind="inline"
//       className="cs-dropdown"
//       style={{
//         color: getColorForStyleConfig({ type: styleType }),
//         background: getBackgroundForStyleConfig({ type: styleType }),
//       }}
//       onClick={handleToggleClick}
//     >
//       {getLabelForStyleType(styleType)}

//       <span>
//         <FontAwesomeIcon icon={dhSort} className="cs-caret" />
//       </span>
//       <DropdownMenu
//         isShown={isShown}
//         actions={{ menuElement: renderMenuElement() }}
//         popperOptions={{ placement: 'bottom-start' }}
//         popperClassName="style-dropdown-menu"
//         onMenuClosed={handleMenuClosed}
//         menuStyle={{ maxWidth: '100rem' }}
//       />
//     </Button>
//   );
// }

// export default ColorPicker;

import React from 'react';

// eslint-disable-next-line import/prefer-default-export
export function ColorPicker() {
  return <div>ColorPicker</div>;
}
