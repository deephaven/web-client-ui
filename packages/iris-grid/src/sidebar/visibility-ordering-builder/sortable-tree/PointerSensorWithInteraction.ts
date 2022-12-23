import type { PointerEvent } from 'react';
import { PointerSensor } from '@dnd-kit/core';

/**
 * An extended "PointerSensor" that prevent some
 * interactive html element(button, input, textarea, select, option...) from dragging
 */
export default class PointerSensorWithInteraction extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: PointerEvent) => {
        if (
          !event.isPrimary ||
          event.button !== 0 ||
          isInteractiveElement(event.target as Element)
        ) {
          return false;
        }

        return true;
      },
    },
  ];
}

const INTERACTIVE_ELEMENTS = [
  'button',
  'input',
  'textarea',
  'select',
  'option',
];

function isInteractiveElement(element: Element | null) {
  if (
    element?.tagName != null &&
    INTERACTIVE_ELEMENTS.includes(element.tagName.toLowerCase())
  ) {
    return true;
  }

  return false;
}
