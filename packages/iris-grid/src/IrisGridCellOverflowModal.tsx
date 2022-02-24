import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@deephaven/console';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import * as monaco from 'monaco-editor';
import { Button } from '@deephaven/components';
import { vsJson, vsListOrdered } from '@deephaven/icons';
import './IrisGridCellOverflowModal.scss';
import classNames from 'classnames';

interface IrisGridCellOverflowModalProps {
  text: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function IrisGridCellOverflowModal({
  text,
  isOpen,
  onClose,
}: IrisGridCellOverflowModalProps): JSX.Element {
  const [height, setHeight] = useState(250);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [closeOnEscape, setCloseOnEscape] = useState(true);
  const [isFormatted, setIsFormatted] = useState(false);
  const [isFormatError, setIsFormatError] = useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [height]);

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
    if (!model) {
      return;
    }

    if (!isFormatted) {
      try {
        model.setValue(JSON.stringify(JSON.parse(text), undefined, 2));
        setIsFormatted(true);
        updateLayout();
      } catch {
        setIsFormatError(true);
      }
    } else {
      model.setValue(text);
      setIsFormatted(false);
      updateLayout();
    }
  }

  function updateLayout() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    setHeight(editor.getContentHeight());
    setShowLineNumbers((editor.getModel()?.getLineCount() ?? 0) > 1);
  }

  return (
    <Modal
      isOpen={isOpen}
      centered
      keyboard={closeOnEscape}
      toggle={onClose}
      size="xl"
      className="theme-bg-dark"
      modalTransition={{
        timeout: 150,
      }}
      backdropTransition={{
        timeout: 150,
      }}
    >
      <ModalHeader
        tag="div"
        className="cell-overflow-modal-header"
        toggle={onClose}
      >
        <h5 className="overflow-modal-title">Cell Contents</h5>
        <Button
          kind="inline"
          active={showLineNumbers}
          icon={vsListOrdered}
          tooltip="Toggle line numbers"
          onClick={toggleLineNumbers}
        />
        <Button
          kind="inline"
          icon={vsJson}
          active={isFormatted}
          disabled={isFormatError}
          tooltip={
            isFormatError ? 'Unable to format as JSON' : 'Format as JSON'
          }
          className={classNames({ 'format-btn-error': isFormatError })}
          onClick={formatAsJSON}
        />
      </ModalHeader>
      <ModalBody
        onBlur={() => setCloseOnEscape(true)}
        style={{ height, maxHeight: '80vh', flexShrink: 1 }}
      >
        <Editor
          onEditorInitialized={(
            editor: monaco.editor.IStandaloneCodeEditor
          ) => {
            editorRef.current = editor;
            editor.focus();
            updateLayout();
          }}
          settings={{
            value: text,
            readOnly: true,
            wordWrap: 'on',
            language: 'json',
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
