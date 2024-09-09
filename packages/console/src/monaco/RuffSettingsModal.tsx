import React, { useCallback, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ActionButton,
  Button,
  Icon,
  Link,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Text,
} from '@deephaven/components';
import { vsLinkExternal, vsDiscard } from '@deephaven/icons';
import { useDebouncedCallback } from '@deephaven/react-hooks';
import { assertNotNull, EMPTY_FUNCTION } from '@deephaven/utils';
import Editor from '../notebook/Editor';
import RUFF_DEFAULT_SETTINGS from './RuffDefaultSettings';
import './RuffSettingsModal.scss';

interface RuffSettingsModalProps {
  text: string;
  isOpen: boolean;
  onClose: (value: Record<string, unknown>) => void;
}

const formattedDefault = JSON.stringify(RUFF_DEFAULT_SETTINGS, null, 2);

export default function RuffSettingsModal({
  text,
  isOpen,
  onClose,
}: RuffSettingsModalProps): React.ReactElement | null {
  const [isOpened, setIsOpened] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();

  function handleToggle(): void {
    if (isOpened) {
      let value = JSON.parse(text);
      try {
        value = JSON.parse(editorRef.current?.getModel()?.getValue() ?? '');
      } catch {
        // no-op
      }
      onClose(value);
      editorRef.current = undefined;
    }
  }

  function handleReset(): void {
    const model = editorRef.current?.getModel();
    assertNotNull(model);
    model.setValue(formattedDefault);
  }

  const isDefault =
    editorRef.current?.getModel()?.getValue() === formattedDefault;

  const validate = useCallback(val => {
    try {
      JSON.parse(val);
      setIsValid(true);
    } catch {
      setIsValid(false);
    }
  }, []);

  const debouncedValidate = useDebouncedCallback(validate, 500, {
    leading: true,
  });

  const onEditorInitialized = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor): void => {
      editorRef.current = editor;
      const model = editor.getModel();
      assertNotNull(model);

      model.onDidChangeContent(() => {
        debouncedValidate(model.getValue());
      });

      // Register the ruff schema so users get validation and completion
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        enableSchemaRequest: true,
        schemas: [
          {
            uri: 'json://ruff-schema',
            fileMatch: [model.uri.toString()],
            schema: {
              allOf: [
                {
                  $ref: 'https://raw.githubusercontent.com/astral-sh/ruff/main/ruff.schema.json',
                },
              ],
            },
          },
        ],
      });
    },
    [debouncedValidate]
  );

  if (!isOpen && !isOpened) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      centered
      keyboard
      // toggle={handleToggle}
      onOpened={() => {
        setIsOpened(true);
        setIsValid(true);
      }}
      onClosed={() => {
        setIsOpened(false);
      }}
      size="lg"
      className="ruff-settings-modal"
    >
      <ModalHeader closeButton={false}>
        <span className="settings-modal-title mr-auto">Ruff Settings</span>

        <Link href="https://docs.astral.sh/ruff/settings/" target="_blank">
          <Button kind="ghost" onClick={EMPTY_FUNCTION} icon={vsLinkExternal}>
            Settings Docs
          </Button>
        </Link>

        <ActionButton
          isDisabled={isDefault}
          onPress={handleReset}
          UNSAFE_style={{ alignSelf: 'flex-end' }}
        >
          <Icon>
            <FontAwesomeIcon icon={vsDiscard} />
          </Icon>
          <Text>Reset to default</Text>
        </ActionButton>
      </ModalHeader>
      <ModalBody style={{ height: '80vh' }}>
        <Editor
          onEditorInitialized={onEditorInitialized}
          settings={{
            value: text,
            language: 'json',
            folding: true,
            padding: { bottom: 16 },
            lineNumbers: 'on',
            overviewRulerLanes: 0,
          }}
        />
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" data-dismiss="modal" onClick={() => false}>
          Cancel
        </Button>
        <Button
          kind="primary"
          data-dismiss="modal"
          tooltip={!isValid ? 'Cannot save invalid JSON' : undefined}
          disabled={!isValid}
          onClick={() => false}
        >
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
}
