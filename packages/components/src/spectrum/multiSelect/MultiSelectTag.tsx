import CrossSmall from '@spectrum-icons/ui/CrossSmall';

export interface MultiSelectTagProps {
  tagKey: string;
  label: string;
  isDisabled: boolean;
  isReadOnly: boolean;
  onRemove: (key: string) => void;
}

/**
 * A tag rendered inside the `MultiSelect` trigger area.
 * Private subcomponent of `MultiSelect`.
 */
export function MultiSelectTag({
  tagKey,
  label,
  isDisabled,
  isReadOnly,
  onRemove,
}: MultiSelectTagProps): JSX.Element {
  return (
    <span className="dh-multi-select-tag">
      <span className="dh-multi-select-tag-label">{label}</span>
      {!isDisabled && !isReadOnly && (
        <button
          type="button"
          className="dh-multi-select-tag-remove"
          tabIndex={-1}
          aria-label={`Remove ${label}`}
          // Prevent the search input from losing focus when the user clicks the tag's remove
          // button. `onPointerDown` fires before the input's blur, so suppressing its default
          // keeps focus on the input.
          onPointerDown={e => e.preventDefault()}
          onClick={() => onRemove(tagKey)}
        >
          <CrossSmall />
        </button>
      )}
    </span>
  );
}

export default MultiSelectTag;
