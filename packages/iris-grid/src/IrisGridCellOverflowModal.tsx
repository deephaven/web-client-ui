import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@deephaven/console';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import * as monaco from 'monaco-editor';
import { Button } from '@deephaven/components';
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
}: IrisGridCellOverflowModalProps): React.ReactNode {
  const [isOpened, setIsOpened] = useState(false);
  const [height, setHeight] = useState(0);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [isFormatted, setIsFormatted] = useState(false);
  const [canFormat] = useState(() => {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  });
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();

  // Re-layout editor on height change
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [height]);

  // Update editor options on line number toggle
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        lineNumbers: showLineNumbers ? 'on' : 'off',
      });
    }
  }, [showLineNumbers]);

  function toggleLineNumbers() {
    setShowLineNumbers(!showLineNumbers);
  }

  function formatAsJSON() {
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

  function autoSetLineNumbers() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    setShowLineNumbers((editor.getModel()?.getLineCount() ?? 0) > 1);
  }

  function handleToggle() {
    if (isOpened) {
      editorRef.current = undefined;
      onClose();
    }
  }

  function onEditorInitialized(editor: monaco.editor.IStandaloneCodeEditor) {
    editorRef.current = editor;
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
      size="xl"
      className="theme-bg-dark cell-overflow-modal"
    >
      <ModalHeader tag="div" toggle={onClose}>
        <h5 className="overflow-modal-title">Cell Contents</h5>
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
