import React, { useCallback, useMemo, useRef, useState } from 'react';
import type * as Monaco from 'monaco-editor';
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
import {
  useDebouncedCallback,
  usePromiseFactory,
} from '@deephaven/react-hooks';
import { assertNotNull, EMPTY_FUNCTION } from '@deephaven/utils';
import Editor from '../notebook/Editor';
import RUFF_DEFAULT_SETTINGS from './RuffDefaultSettings';
import ruffSchema from './ruffSchema';
import './RuffSettingsModal.scss';
import MonacoProviders from './MonacoProviders';

export interface RuffSettingsModalProps {
  text: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: Record<string, unknown>) => void;
  readOnly?: boolean;
  defaultSettings?: Record<string, unknown>;
}

// const RUFF_SETTINGS_URI = Monaco.Uri.parse(
//   'inmemory://dh-config/ruff-settings.json'
// );

function registerRuffSchema(
  monaco: typeof Monaco,
  ruffSettingsUri: Monaco.Uri
): void {
  const { schemas = [] } =
    monaco.languages.json.jsonDefaults.diagnosticsOptions;

  if (!schemas.some(schema => schema.uri === 'json://ruff-schema')) {
    // Register the ruff schema so users get validation and completion
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      schemas: [
        ...schemas,
        {
          uri: 'json://ruff-schema',
          fileMatch: [ruffSettingsUri.toString()],
          schema: ruffSchema,
        },
      ],
    });
  }
}

async function getRuffVersion(): Promise<string> {
  await MonacoProviders.initRuff();
  return `v${Workspace.version()}`;
}

export default function RuffSettingsModal({
  text,
  isOpen,
  monaco,
  onClose,
  onSave,
  readOnly = false,
  defaultSettings = RUFF_DEFAULT_SETTINGS,
}: RuffSettingsModalProps & {
  monaco: typeof Monaco;
}): React.ReactElement | null {
  const [isValid, setIsValid] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor>();

  const formattedDefaultSettings = useMemo(
    () => JSON.stringify(defaultSettings, null, 2),
    [defaultSettings]
  );

  const { data: ruffVersion } = usePromiseFactory(getRuffVersion);

  const ruffSettingsUri = useMemo(
    () => monaco.Uri.parse('inmemory://dh-config/ruff-settings.json'),
    [monaco]
  );

  const [model] = useState(() =>
    monaco.editor.createModel(text, 'json', ruffSettingsUri)
  );

  const handleClose = useCallback((): void => {
    if (isOpen) {
      onClose();
      editorRef.current = undefined;
      model.dispose();
    }
  }, [isOpen, onClose, model]);

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
    assertNotNull(model);
    model.setValue(formattedDefaultSettings);
  }, [model, formattedDefaultSettings]);

  const validate = useCallback(
    val => {
      try {
        JSON.parse(val);
        setIsValid(true);
      } catch {
        setIsValid(false);
      }
      setIsDefault(
        editorRef.current?.getModel()?.getValue() === formattedDefaultSettings
      );
    },
    [formattedDefaultSettings]
  );

  const debouncedValidate = useDebouncedCallback(validate, 500, {
    leading: true,
  });

  const onEditorInitialized = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor): void => {
      editorRef.current = editor;

      model.onDidChangeContent(() => {
        debouncedValidate(model.getValue());
      });

      registerRuffSchema(monaco, ruffSettingsUri);
      debouncedValidate(model.getValue());
    },
    [debouncedValidate, model, monaco, ruffSettingsUri]
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
          Ruff {ruffVersion} Settings
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
            readOnly,
            value: text,
            language: 'json',
            folding: true,
            padding: { bottom: 16 },
            lineNumbers: 'on',
            overviewRulerLanes: 0,
            model,
          }}
        />
      </ModalBody>
      <ModalFooter>
        {readOnly ? (
          <Button kind="secondary" data-dismiss="modal" onClick={handleClose}>
            Close
          </Button>
        ) : (
          <>
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
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
