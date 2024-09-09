import React, { useCallback, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { Workspace } from '@astral-sh/ruff-wasm-web';
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
import ruffSchema from './ruffSchema';
import './RuffSettingsModal.scss';

interface RuffSettingsModalProps {
  text: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: Record<string, unknown>) => void;
}

const formattedDefault = JSON.stringify(RUFF_DEFAULT_SETTINGS, null, 2);

export default function RuffSettingsModal({
  text,
  isOpen,
  onClose,
  onSave,
}: RuffSettingsModalProps): React.ReactElement | null {
  const [isValid, setIsValid] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const [ruffVersion] = useState(() => Workspace.version() ?? '');

  const handleClose = useCallback((): void => {
    if (isOpen) {
      onClose();
      editorRef.current = undefined;
    }
  }, [isOpen, onClose]);

  const handleSave = useCallback((): void => {
    if (isOpen) {
      try {
        onSave(JSON.parse(editorRef.current?.getModel()?.getValue() ?? ''));
      } catch {
        // no-op
      }
      handleClose();
    }
  }, [isOpen, handleClose, onSave]);

  const handleReset = useCallback((): void => {
    const model = editorRef.current?.getModel();
    assertNotNull(model);
    model.setValue(formattedDefault);
  }, []);

  const validate = useCallback(val => {
    try {
      JSON.parse(val);
      setIsValid(true);
    } catch {
      setIsValid(false);
    }
    setIsDefault(
      editorRef.current?.getModel()?.getValue() === formattedDefault
    );
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

      debouncedValidate(model.getValue());

      // Register the ruff schema so users get validation and completion
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        enableSchemaRequest: true,
        schemas: [
          {
            uri: 'json://ruff-schema',
            fileMatch: [model.uri.toString()],
            schema: ruffSchema,
          },
        ],
      });
    },
    [debouncedValidate]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      centered
      keyboard
      clickOutside={false}
      toggle={handleClose}
      size="lg"
      className="ruff-settings-modal"
    >
      <ModalHeader closeButton={false}>
        <span className="settings-modal-title mr-auto">
          Ruff v{ruffVersion} Settings
        </span>

        <Link href="https://docs.astral.sh/ruff/settings/" target="_blank">
          <Button kind="ghost" onClick={EMPTY_FUNCTION} icon={vsLinkExternal}>
            Settings Docs
          </Button>
        </Link>

        <ActionButton isDisabled={isDefault} onPress={handleReset}>
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
        <Button kind="secondary" data-dismiss="modal" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          kind="primary"
          data-dismiss="modal"
          tooltip={!isValid ? 'Cannot save invalid JSON' : undefined}
          disabled={!isValid}
          onClick={handleSave}
        >
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
}
