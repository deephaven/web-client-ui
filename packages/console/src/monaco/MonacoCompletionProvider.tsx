/**
 * Completion provider for a code session
 */
import { PureComponent } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import Log from '@deephaven/log';
import { IdeSession } from '@deephaven/jsapi-shim';

const log = Log.module('MonacoCompletionProvider');

interface MonacoCompletionProviderProps {
  model: monaco.editor.ITextModel;
  session: IdeSession;
  language: string;
}

/**
 * Registers a completion provider with monaco for the language and session provided.
 */
class MonacoCompletionProvider extends PureComponent<
  MonacoCompletionProviderProps,
  Record<string, never>
> {
  constructor(props: MonacoCompletionProviderProps) {
    super(props);

    this.handleCompletionRequest = this.handleCompletionRequest.bind(this);
  }

  componentDidMount(): void {
    const { language } = this.props;
    this.registeredCompletionProvider = monaco.languages.registerCompletionItemProvider(
      language ?? '',
      {
        provideCompletionItems: this.handleCompletionRequest,
        triggerCharacters: ['"', '.', "'", '(', '[', '{', ','],
      }
    );
  }

  componentWillUnmount(): void {
    this.registeredCompletionProvider?.dispose();
  }

  registeredCompletionProvider?: monaco.IDisposable;

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
      },
      // Yes, the Monaco API Position is different than the Position received by the LSP
      // Why? I do not know.
      position: {
        line: position.lineNumber - 1,
        character: position.column - 1,
      },
      context,
    };

    const completionItems = session.getCompletionItems(params);

    log.debug('Completion items received: ', params, completionItems);

    const monacoCompletionItems = completionItems
      .then(items => {
        // Annoying that the LSP protocol returns completion items with a range that's slightly different than what Monaco expects
        // Need to remap the items here
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

          const { start, end } = textEdit.range;

          // Monaco expects the columns/ranges to start at 1.
          const range = {
            startLineNumber: start.line + 1,
            startColumn: start.character + 1,
            endLineNumber: end.line + 1,
            endColumn: end.character + 1,
          };
          return {
            label,
            kind,
            detail,
            documentation,
            sortText,
            filterText,
            insertText: textEdit.text,
            // We are basically guessing that LSP's insertTextFormat===2 is
            // semantically equivalent to monaco's insertTextRules===4.
            // Why microsoft is using almost-but-not-LSP apis is beyond me....
            insertTextRules: insertTextFormat === 2 ? 4 : insertTextFormat,
            range,
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

  render(): null {
    return null;
  }
}

export default MonacoCompletionProvider;
