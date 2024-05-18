/**
 * Completion provider for a code session
 */
import { PureComponent } from 'react';
import * as monaco from 'monaco-editor';
import throttle from 'lodash.throttle';
import Log from '@deephaven/log';
import type { dh } from '@deephaven/jsapi-types';
import init, { Workspace, type Diagnostic } from './ruff/ruff_wasm';

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
  static workspace?: Workspace;

  static lintPython = throttle((model: monaco.editor.ITextModel): void => {
    if (!MonacoProviders.workspace) {
      return;
    }

    monaco.editor.setModelMarkers(
      model,
      'ruff',
      MonacoProviders.workspace.check(model.getValue()).map((d: Diagnostic) => {
        const isUnnecessary = d.code === 'F401' || d.code === 'F841';
        return {
          startLineNumber: d.location.row,
          startColumn: d.location.column,
          endLineNumber: d.end_location.row,
          endColumn: d.end_location.column,
          message: `${d.code}: ${d.message}`,
          severity: isUnnecessary
            ? monaco.MarkerSeverity.Warning
            : monaco.MarkerSeverity.Error,
          tags: isUnnecessary ? [monaco.MarkerTag.Unnecessary] : [],
        };
      })
    );
  }, 0);

  static initRuffPromise?: Promise<void>;

  /**
   * Loads and initializes Ruff.
   * Subsequent calls will return the same promise.
   */
  static async initRuff(): Promise<void> {
    if (MonacoProviders.initRuffPromise) {
      return MonacoProviders.initRuffPromise;
    }

    log.debug('Initializing Ruff');

    MonacoProviders.initRuffPromise = init().then(() => {
      MonacoProviders.workspace = new Workspace({
        preview: true,
        builtins: [],
        'target-version': 'py38',
        'line-length': 88,
        'indent-width': 4,
        lint: {
          'allowed-confusables': [],
          'dummy-variable-rgx': '^(_+|(_+[a-zA-Z0-9_]*[a-zA-Z0-9]+?))$',
          'extend-select': [],
          'extend-fixable': [],
          'flake8-implicit-str-concat': {
            'allow-multiline': false,
          },
          external: [],
          ignore: ['ISC003'],
          select: [
            'F',
            'E1',
            'E2',
            'E9',
            'E711',
            'W291',
            'W293',
            'W605',
            'I002',
            'B002',
            'B015',
            'B016',
            'B018',
            'B020',
            'B023',
            'B032',
            'B035',
            'B909',
            'COM818',
            'ISC',
            'PLE',
            'RUF001',
            'RUF021',
            'RUF027',
            'PLR1704',
          ],
        },
        format: {
          'indent-style': 'space',
          'quote-style': 'double',
        },
      });
    });

    return MonacoProviders.initRuffPromise;
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
    if (!MonacoProviders.workspace) {
      return {
        actions: [],
        dispose: () => {
          /* no-op */
        },
      };
    }

    const diagnostics = (
      MonacoProviders.workspace.check(model.getValue()) as Diagnostic[]
    ).filter(
      d =>
        d.location.row === range.startLineNumber &&
        d.location.column >= range.startColumn &&
        d.location.column <= range.endColumn
    );

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

    const disableActions: monaco.languages.CodeAction[] = diagnostics
      .map(d => {
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
            title: `Disable ${d.code} for this line`,
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
          {
            title: `Disable ${d.code} for this file`,
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
                    text: `# ruff: noqa: ${d.code}\n`,
                  },
                },
              ],
            },
          },
        ];
      })
      .flat();

    return {
      actions: [...fixActions, ...disableActions],
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
    if (!MonacoProviders.workspace) {
      return;
    }

    return [
      {
        range: model.getFullModelRange(),
        text: MonacoProviders.workspace.format(model.getValue()),
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
    const { language, session, model } = this.props;

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

    if (language === 'python') {
      if (MonacoProviders.workspace == null) {
        MonacoProviders.initRuff().then(() => {
          MonacoProviders.lintPython(model);
        });
      } else {
        MonacoProviders.lintPython(model);
      }

      const throttledLint = throttle(
        (m: monaco.editor.ITextModel) => MonacoProviders.lintPython(m),
        250
      );

      model.onDidChangeContent(() => {
        throttledLint(model);
      });
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
