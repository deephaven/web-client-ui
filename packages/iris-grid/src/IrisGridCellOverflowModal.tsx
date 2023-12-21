import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@deephaven/console';
import * as monaco from 'monaco-editor';
import {
  Button,
  CopyButton,
  Modal,
  ModalBody,
  ModalHeader,
} from '@deephaven/components';
import { vsJson, vsListOrdered } from '@deephaven/icons';
import './IrisGridCellOverflowModal.scss';

interface IrisGridCellOverflowModalProps {
  text: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function IrisGridCellOverflowModal({
  text,
  isOpen,
  onClose,
}: IrisGridCellOverflowModalProps): React.ReactElement | null {
  const [isOpened, setIsOpened] = useState(false);
  const [height, setHeight] = useState(0);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [isFormatted, setIsFormatted] = useState(false);
  const [canFormat, setCanFormat] = useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();

  // Update format button on open
  useEffect(
    function enableFormatButtonWhenOpen() {
      if (!isOpen) {
        return;
      }

      try {
        JSON.parse(text);
        setCanFormat(true);
      } catch {
        setCanFormat(false);
      }
      setIsFormatted(false);
    },
    [isOpen, text]
  );

  // Re-layout editor on height change
  useEffect(
    function updateLayoutOnHeightChange() {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    },
    [height]
  );

  // Update editor options on line number toggle
  useEffect(
    function toggleShowLineNumber() {
      if (editorRef.current) {
        editorRef.current.updateOptions({
          lineNumbers: showLineNumbers ? 'on' : 'off',
        });
      }
    },
    [showLineNumbers]
  );

  function toggleLineNumbers(): void {
    setShowLineNumbers(!showLineNumbers);
  }

  function formatAsJSON(): void {
    const model = editorRef.current?.getModel();
    if (!canFormat || !model) {
      return;
    }

    if (!isFormatted) {
      model.setValue(JSON.stringify(JSON.parse(text), undefined, 2));
      setIsFormatted(true);
    } else {
      model.setValue(text);
      setIsFormatted(false);
    }
    autoSetLineNumbers();
  }

  function autoSetLineNumbers(): void {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    setShowLineNumbers((editor.getModel()?.getLineCount() ?? 0) > 1);
  }

  function handleToggle(): void {
    if (isOpened) {
      editorRef.current = undefined;
      onClose();
    }
  }

  function onEditorInitialized(
    editor: monaco.editor.IStandaloneCodeEditor
  ): void {
    editorRef.current = editor;
    setHeight(editor.getContentHeight());
    editor.onDidContentSizeChange(({ contentHeight }) =>
      setHeight(contentHeight)
    );
    autoSetLineNumbers();
  }

  if (!isOpen && !isOpened) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      centered
      keyboard
      toggle={handleToggle}
      onOpened={() => setIsOpened(true)}
      onClosed={() => {
        setIsOpened(false);
        setHeight(0);
      }}
      className="cell-overflow-modal"
      size="xl"
    >
      <ModalHeader toggle={onClose}>
        <h5 className="overflow-modal-title">Cell Contents</h5>
        <CopyButton
          kind="inline"
          tooltip="Copy cell contents"
          copy={editorRef.current?.getValue() ?? text}
        />
        <Button
          kind="inline"
          active={showLineNumbers}
          icon={vsListOrdered}
          tooltip="Toggle line numbers"
          onClick={toggleLineNumbers}
        />
        {canFormat && (
          <Button
            kind="inline"
            icon={vsJson}
            active={isFormatted}
            tooltip="Format as JSON"
            onClick={formatAsJSON}
          />
        )}
      </ModalHeader>
      <ModalBody style={{ height }}>
        <Editor
          onEditorInitialized={onEditorInitialized}
          settings={{
            value: text,
            readOnly: true,
            wordWrap: 'on',
            // Loading json language w/o the monaco workers causes UI freezes and monaco errors. TS colorizes the same
            language: canFormat ? 'typescript' : 'plaintext',
            folding: canFormat,
            padding: { bottom: 16 },
            lineNumbers: showLineNumbers ? 'on' : 'off',
            overviewRulerLanes: 0,
            renderLineHighlight: 'none',
            /*
              The entire string may be 1 giant line
              Monaco by default seeds find w/ that line
              On very long strings this hangs the browser, so never seed the search
            */
            find: { seedSearchStringFromSelection: 'never' },
          }}
        />
      </ModalBody>
    </Modal>
  );
}
