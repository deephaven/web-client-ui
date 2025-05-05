/**
 * Completion provider for a code session
 */
import { PureComponent } from 'react';
import * as monaco from 'monaco-editor';
import Log from '@deephaven/log';
import type { dh } from '@deephaven/jsapi-types';
import init, { Workspace, type Diagnostic } from '@astral-sh/ruff-wasm-web';
import RUFF_DEFAULT_SETTINGS from './RuffDefaultSettings';
import MonacoUtils from './MonacoUtils';

const log = Log.module('MonacoCompletionProvider');

interface MonacoProviderProps {
  model: monaco.editor.ITextModel;
  session: dh.IdeSession;
  language: string;
}

/**
 * Registers a completion provider with monaco for the language and session provided.
 */
class MonacoProviders extends PureComponent<
  MonacoProviderProps,
  Record<string, never>
> {
  static ruffWorkspace?: Workspace;

  static initRuffPromise?: Promise<void>;

  static isRuffInitialized = false;

  static isRuffEnabled = true;

  static ruffSettings: Record<string, unknown> = RUFF_DEFAULT_SETTINGS;

  /**
   * Loads and initializes Ruff if it is enabled.
   * Subsequent calls will return the same promise.
   */
  static async initRuff(): Promise<void> {
    if (!MonacoProviders.isRuffEnabled) {
      return;
    }
    if (MonacoProviders.initRuffPromise) {
      return MonacoProviders.initRuffPromise;
    }

    MonacoProviders.initRuffPromise = init({}).then(() => {
      log.debug('Initialized Ruff', Workspace.version());
      MonacoProviders.isRuffInitialized = true;
      MonacoProviders.updateRuffWorkspace();
    });

    return MonacoProviders.initRuffPromise;
  }

  /**
   * Updates the current ruff workspace with MonacoProviders.ruffSettings.
   * Re-lints all Python models after updating.
   */
  static updateRuffWorkspace(): void {
    if (!MonacoProviders.isRuffInitialized) {
      return;
    }

    /* eslint-disable no-console */
    const prevLog = console.log;
    try {
      console.log = () => undefined; // Suppress not useful ruff-wasm-web logs when it creates the workspace
      MonacoProviders.ruffWorkspace = new Workspace(
        MonacoProviders.ruffSettings
      );
    } finally {
      console.log = prevLog; // Restore console.log
    }
    /* eslint-enable no-console */

    MonacoProviders.lintAllPython();
  }

  /**
   * Sets ruff settings
   * @param settings The ruff settings
   */
  static setRuffSettings(
    settings: Record<string, unknown> = MonacoProviders.ruffSettings
  ): void {
    MonacoProviders.ruffSettings = settings;

    if (!MonacoProviders.isRuffInitialized) {
      MonacoProviders.initRuff();
      return;
    }

    MonacoProviders.updateRuffWorkspace();
  }

  static getDiagnostics(model: monaco.editor.ITextModel): Diagnostic[] {
    if (!MonacoProviders.ruffWorkspace) {
      return [];
    }

    const diagnostics = MonacoProviders.ruffWorkspace.check(
      model.getValue()
    ) as Diagnostic[];
    if (MonacoUtils.isConsoleModel(model)) {
      // Only want SyntaxErrors for console which have no code
      return diagnostics.filter(d => d.code == null);
    }
    return diagnostics;
  }

  static lintAllPython(): void {
    if (!MonacoProviders.isRuffEnabled) {
      monaco.editor.removeAllMarkers('ruff');
      return;
    }

    monaco.editor
      .getModels()
      .filter(m => m.getLanguageId() === 'python')
      .forEach(MonacoProviders.lintPython);
  }

  static lintPython(model: monaco.editor.ITextModel): void {
    if (!MonacoProviders.isRuffEnabled) {
      return;
    }

    if (!MonacoProviders.ruffWorkspace) {
      return;
    }

    const diagnostics = MonacoProviders.getDiagnostics(model);
    log.debug(`Linting Python document: ${model.uri.toString()}`, diagnostics);

    monaco.editor.setModelMarkers(
      model,
      'ruff',
      diagnostics.map((d: Diagnostic) => {
        // Unused variable or import. Mark as unnecessary to fade the text
        const isUnnecessary = d.code === 'F401' || d.code === 'F841';
        const isSyntaxError = d.code == null; // SyntaxError has no error code
        return {
          startLineNumber: d.location.row,
          startColumn: d.location.column,
          endLineNumber: d.end_location.row,
          endColumn: d.end_location.column,
          message: isSyntaxError ? d.message : `${d.code}: ${d.message}`,
          severity: isSyntaxError
            ? monaco.MarkerSeverity.Error
            : monaco.MarkerSeverity.Warning,
          tags: isUnnecessary ? [monaco.MarkerTag.Unnecessary] : [],
        };
      })
    );
  }

  /**
   * Converts LSP CompletionItemKind to Monaco CompletionItemKind
   * Defaults to Variable if no LSP kind was provided
   * https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#completionItemKind
   *
   * @param kind The LSP kind
   * @returns Monaco kind
   */
  static lspToMonacoKind(kind: number | undefined): number {
    const monacoKinds = monaco.languages.CompletionItemKind;
    switch (kind) {
      case 1:
        return monacoKinds.Text;
      case 2:
        return monacoKinds.Method;
      case 3:
        return monacoKinds.Function;
      case 4:
        return monacoKinds.Constructor;
      case 5:
        return monacoKinds.Field;
      case 6:
        return monacoKinds.Variable;
      case 7:
        return monacoKinds.Class;
      case 8:
        return monacoKinds.Interface;
      case 9:
        return monacoKinds.Module;
      case 10:
        return monacoKinds.Property;
      case 11:
        return monacoKinds.Unit;
      case 12:
        return monacoKinds.Value;
      case 13:
        return monacoKinds.Enum;
      case 14:
        return monacoKinds.Keyword;
      case 15:
        return monacoKinds.Snippet;
      case 16:
        return monacoKinds.Color;
      case 17:
        return monacoKinds.File;
      case 18:
        return monacoKinds.Reference;
      case 19:
        return monacoKinds.Folder;
      case 20:
        return monacoKinds.EnumMember;
      case 21:
        return monacoKinds.Constant;
      case 22:
        return monacoKinds.Struct;
      case 23:
        return monacoKinds.Event;
      case 24:
        return monacoKinds.Operator;
      case 25:
        return monacoKinds.TypeParameter;
      default:
        return monacoKinds.Variable;
    }
  }

  /**
   * Converts an LSP document range to a monaco range
   * Accounts for LSP indexing from 0 and monaco indexing from 1
   *
   * @param range The LSP document range to convert
   * @returns The corresponding monaco range
   */
  static lspToMonacoRange(range: dh.lsp.Range): monaco.IRange {
    const { start, end } = range;

    // Monaco expects the columns/ranges to start at 1. LSP starts at 0
    return {
      startLineNumber: start.line + 1,
      startColumn: start.character + 1,
      endLineNumber: end.line + 1,
      endColumn: end.character + 1,
    };
  }

  /**
   * Converts a monaco position to an LSP position
   * Accounts for LSP indexing from 0 and monaco indexing from 1
   *
   * @param position The monaco position
   * @returns The corresponding LSP position
   */
  static monacoToLspPosition(
    position: monaco.IPosition
  ): Pick<dh.lsp.Position, 'line' | 'character'> {
    // Monaco 1-indexes Position. LSP 0-indexes Position
    return {
      line: position.lineNumber - 1,
      character: position.column - 1,
    };
  }

  static handlePythonCodeActionRequest(
    model: monaco.editor.ITextModel,
    range: monaco.Range
  ): monaco.languages.ProviderResult<monaco.languages.CodeActionList> {
    if (!MonacoProviders.isRuffEnabled || !MonacoProviders.ruffWorkspace) {
      return {
        actions: [],
        dispose: () => {
          /* no-op */
        },
      };
    }

    const diagnostics = MonacoProviders.getDiagnostics(model).filter(d => {
      const diagnosticRange = new monaco.Range(
        d.location.row,
        d.location.column,
        d.end_location.row,
        d.end_location.column
      );
      return (
        d.code != null && // Syntax errors have no code and can't be fixed/disabled
        diagnosticRange.intersectRanges(range)
      );
    });

    const fixActions: monaco.languages.CodeAction[] = diagnostics
      .filter(({ fix }) => fix != null)
      .map(d => {
        let title = 'Fix';
        if (d.fix != null) {
          if (d.fix.message != null && d.fix.message !== '') {
            title = `${d.code}: ${d.fix.message}`;
          } else {
            title = `Fix ${d.code}`;
          }
        }
        return {
          title,
          id: `fix-${d.code}`,
          kind: 'quickfix',
          edit: d.fix
            ? {
                edits: d.fix.edits.map(edit => ({
                  resource: model.uri,
                  versionId: model.getVersionId(),
                  textEdit: {
                    range: {
                      startLineNumber: edit.location.row,
                      startColumn: edit.location.column,
                      endLineNumber: edit.end_location.row,
                      endColumn: edit.end_location.column,
                    },
                    text: edit.content ?? '',
                  },
                })),
              }
            : undefined,
        };
      });

    const seenCodes = new Set<string>();
    const duplicateCodes = new Set<string>();
    diagnostics.forEach(d => {
      if (d.code == null) {
        return;
      }
      if (seenCodes.has(d.code)) {
        duplicateCodes.add(d.code);
      }
      seenCodes.add(d.code);
    });

    const disableLineActions: monaco.languages.CodeAction[] = diagnostics
      .map(d => {
        if (d.code == null) {
          // The nulls are already filtered out, but TS doesn't know that
          return [];
        }
        const line = model.getLineContent(d.location.row);
        const lastToken = monaco.editor
          .tokenize(line, model.getLanguageId())[0]
          .at(-1);
        const lineEdit = {
          range: {
            startLineNumber: d.location.row,
            startColumn: line.length + 1,
            endLineNumber: d.location.row,
            endColumn: line.length + 1,
          },
          text: ` # noqa: ${d.code}`,
        };
        if (lastToken != null && lastToken.type.startsWith('comment')) {
          // Already a comment at the end of the line
          lineEdit.text = `# noqa: ${d.code} `;
          if (line.startsWith('# noqa:', lastToken.offset)) {
            // Already another suppressed rule on the line
            lineEdit.range.startColumn = lastToken.offset + 1;
            lineEdit.range.endColumn = lastToken.offset + 9; // "# noqa: " length + 1 to offset
          } else {
            lineEdit.range.startColumn = lastToken.offset + 1;
            lineEdit.range.endColumn = line.startsWith('# ', lastToken.offset)
              ? lastToken.offset + 3 // "# " + 1 to offset
              : lastToken.offset + 2; // "#" + 1 to offset
          }
        }
        return [
          {
            title: `Disable ${d.code} for ${
              duplicateCodes.has(d.code)
                ? `line ${d.location.row}`
                : 'this line'
            }`,
            kind: 'quickfix',
            edit: {
              edits: [
                {
                  resource: model.uri,
                  versionId: model.getVersionId(),
                  textEdit: lineEdit,
                },
              ],
            },
          },
        ];
      })
      .flat()
      .filter(
        // Remove actions with duplicate titles as you can't disable the same rule on a line twice
        (action, i, arr) => arr.find(a => a.title === action.title) === action
      );

    const disableGlobalActions: monaco.languages.CodeAction[] = [
      ...seenCodes,
    ].map(code => ({
      title: `Disable ${code} for this file`,
      kind: 'quickfix',
      edit: {
        edits: [
          {
            resource: model.uri,
            versionId: model.getVersionId(),
            textEdit: {
              range: {
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 1,
              },
              text: `# ruff: noqa: ${code}\n`,
            },
          },
        ],
      },
    }));

    return {
      actions: [...fixActions, ...disableLineActions, ...disableGlobalActions],
      dispose: () => {
        /* no-op */
      },
    };
  }

  static handlePythonFormatRequest(
    model: monaco.editor.ITextModel,
    options: monaco.languages.FormattingOptions,
    token: monaco.CancellationToken
  ): monaco.languages.ProviderResult<monaco.languages.TextEdit[]> {
    if (!MonacoProviders.ruffWorkspace) {
      return;
    }

    log.debug(`Formatting Python document: ${model.uri.toString}`);

    return [
      {
        range: model.getFullModelRange(),
        text: MonacoProviders.ruffWorkspace.format(model.getValue()),
      },
    ];
  }

  constructor(props: MonacoProviderProps) {
    super(props);

    this.handleCompletionRequest = this.handleCompletionRequest.bind(this);
    this.handleSignatureRequest = this.handleSignatureRequest.bind(this);
    this.handleHoverRequest = this.handleHoverRequest.bind(this);
  }

  componentDidMount(): void {
    const { language, session } = this.props;

    this.registeredCompletionProvider =
      monaco.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: this.handleCompletionRequest,
        triggerCharacters: ['.', '"', "'"],
      });

    if (session.getSignatureHelp != null) {
      this.registeredSignatureProvider =
        monaco.languages.registerSignatureHelpProvider(language, {
          provideSignatureHelp: this.handleSignatureRequest,
          signatureHelpTriggerCharacters: ['(', ','],
        });
    }

    if (session.getHover != null) {
      this.registeredHoverProvider = monaco.languages.registerHoverProvider(
        language,
        {
          provideHover: this.handleHoverRequest,
        }
      );
    }
  }

  componentWillUnmount(): void {
    this.registeredCompletionProvider?.dispose();
    this.registeredSignatureProvider?.dispose();
    this.registeredHoverProvider?.dispose();
  }

  registeredCompletionProvider?: monaco.IDisposable;

  registeredSignatureProvider?: monaco.IDisposable;

  registeredHoverProvider?: monaco.IDisposable;

  handleCompletionRequest(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext
  ): monaco.languages.ProviderResult<monaco.languages.CompletionList> {
    const { model: propModel, session } = this.props;
    if (model !== propModel) {
      return null;
    }

    const params = {
      textDocument: {
        uri: `${model.uri}`,
        version: model.getVersionId(),
      },
      position: MonacoProviders.monacoToLspPosition(position),
      context,
    };

    const completionItems = session.getCompletionItems(params);
    log.debug('Requested completion items', params);

    const monacoCompletionItems = completionItems
      .then(items => {
        log.debug('Completion items received: ', params, items);

        const suggestions = items.map(item => {
          const {
            label,
            kind,
            detail,
            documentation,
            sortText,
            filterText,
            textEdit,
            insertTextFormat,
          } = item;

          return {
            label,
            kind: MonacoProviders.lspToMonacoKind(kind),
            detail,
            documentation:
              documentation?.kind === 'markdown'
                ? documentation
                : documentation?.value,
            sortText,
            filterText,
            insertText: textEdit.text,
            // We are basically guessing that LSP's insertTextFormat===2 is
            // semantically equivalent to monaco's insertTextRules===4.
            // Why microsoft is using almost-but-not-LSP apis is beyond me....
            insertTextRules: insertTextFormat === 2 ? 4 : insertTextFormat,
            range: MonacoProviders.lspToMonacoRange(textEdit.range),
          };
        });

        return {
          incomplete: true,
          suggestions,
        };
      })
      .catch((error: unknown) => {
        log.error('There was an error retrieving completion items', error);
        return { suggestions: [] };
      });

    return monacoCompletionItems;
  }

  handleSignatureRequest(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    token: monaco.CancellationToken,
    context: monaco.languages.SignatureHelpContext
  ): monaco.languages.ProviderResult<monaco.languages.SignatureHelpResult> {
    const defaultResult: monaco.languages.SignatureHelpResult = {
      value: {
        signatures: [],
        activeSignature: 0,
        activeParameter: 0,
      },
      dispose: () => {
        /* no-op */
      },
    };

    const { model: propModel, session } = this.props;
    if (model !== propModel || session.getSignatureHelp == null) {
      return null;
    }

    const params = {
      textDocument: {
        uri: `${model.uri}`,
        version: model.getVersionId(),
      },
      position: MonacoProviders.monacoToLspPosition(position),
      context,
    };

    const signatureItems = session.getSignatureHelp(params);
    log.debug('Requested signature help', params);

    const monacoSignatures = signatureItems
      .then(items => {
        log.debug('Signatures received: ', params, signatureItems);
        const signatures = items.map(item => {
          const { label, documentation, parameters } = item;

          return {
            documentation:
              documentation?.kind === 'markdown'
                ? documentation
                : documentation?.value,
            label,
            parameters: parameters ?? [],
          };
        });

        if (signatures.length === 0) {
          return defaultResult;
        }

        // For now we will assume we only autocomplete Python w/ 1 signature
        // For multiple signatures, this may need to be sent through the request as context
        const activeSignature = 0;

        return {
          value: {
            signatures,
            activeSignature,
            activeParameter: items[activeSignature].activeParameter,
          },
          dispose: () => {
            /* no-op */
          },
        };
      })
      .catch((error: unknown) => {
        log.error('There was an error retrieving completion items', error);
        return defaultResult;
      });

    return monacoSignatures;
  }

  handleHoverRequest(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): monaco.languages.ProviderResult<monaco.languages.Hover> {
    const { model: propModel, session } = this.props;
    if (model !== propModel || session.getHover == null) {
      return null;
    }

    const params = {
      textDocument: {
        uri: `${model.uri}`,
        version: model.getVersionId(),
      },
      position: MonacoProviders.monacoToLspPosition(position),
    };

    const hover = session.getHover(params);
    log.debug('Requested hover', params);

    const monacoHover = hover
      .then(hoverItem => {
        log.debug('Hover received: ', params, hoverItem);
        const { contents: hoverContents } = hoverItem;

        return {
          contents: hoverContents != null ? [hoverContents] : [],
        };
      })
      .catch((error: unknown) => {
        log.error('There was an error retrieving hover', error);
        return { contents: [] };
      });

    return monacoHover;
  }

  render(): null {
    return null;
  }
}

export default MonacoProviders;
