/**
 * Completion provider for a code session
 */
import { PureComponent } from 'react';
import * as monaco from 'monaco-editor';
import Log from '@deephaven/log';
import { DocumentRange, IdeSession, Position } from '@deephaven/jsapi-shim';

const log = Log.module('MonacoCompletionProvider');

interface MonacoProviderProps {
  model: monaco.editor.ITextModel;
  session: IdeSession;
  language: string;
}

/**
 * Registers a completion provider with monaco for the language and session provided.
 */
class MonacoProviders extends PureComponent<
  MonacoProviderProps,
  Record<string, never>
> {
  /**
   * Converts LSP CompletionItemKind to Monaco CompletionItemKind
   * https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#completionItemKind
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
  static lspToMonacoRange(range: DocumentRange): monaco.IRange {
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
  static monacoToLspPosition(position: monaco.IPosition): Position {
    // Monaco 1-indexes Position. LSP 0-indexes Position
    return {
      line: position.lineNumber - 1,
      character: position.column - 1,
    };
  }

  constructor(props: MonacoProviderProps) {
    super(props);

    this.handleCompletionRequest = this.handleCompletionRequest.bind(this);
    this.handleSignatureRequest = this.handleSignatureRequest.bind(this);
    this.handleHoverRequest = this.handleHoverRequest.bind(this);
  }

  componentDidMount(): void {
    const { language, session } = this.props;

    this.registeredCompletionProvider = monaco.languages.registerCompletionItemProvider(
      language,
      {
        provideCompletionItems: this.handleCompletionRequest,
        triggerCharacters: ['.', '"', "'", '/'],
      }
    );

    if (session.getSignatureHelp) {
      this.registeredSignatureProvider = monaco.languages.registerSignatureHelpProvider(
        language,
        {
          provideSignatureHelp: this.handleSignatureRequest,
          signatureHelpTriggerCharacters: ['(', ','],
        }
      );
    }

    if (session.getHover) {
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
    if (model !== propModel || !session.getSignatureHelp) {
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
    if (model !== propModel || !session.getHover) {
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
          contents: hoverContents ? [hoverContents] : [],
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
