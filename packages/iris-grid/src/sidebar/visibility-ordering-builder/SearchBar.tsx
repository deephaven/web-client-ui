import { useRef, useState } from 'react';
import { Dialog, DialogTrigger, Popover } from 'react-aria-components';
import type { TextFieldRef } from '@react-types/textfield';
import {
  Content,
  // Dialog,
  DialogContainer,
  Popper,
  // DialogTrigger,
  SearchField,
  Text,
} from '@deephaven/components';

interface SearchBarProps {
  items: { name: string; movable: boolean }[];
}

export function SearchBar({ items }: SearchBarProps): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchRef = useRef<TextFieldRef>(null);
  return (
    <>
      <SearchField
        ref={searchRef}
        onChange={() => setIsModalOpen(true)}
        aria-label="Search columns"
      />
      <Popper
        isShown={isModalOpen}
        closeOnBlur={false}
        interactive
        referenceObject={searchRef.current?.getInputElement()}
        options={{ placement: 'bottom' }}
      >
        Testing
      </Popper>
    </>
  );
}

export default SearchBar;
