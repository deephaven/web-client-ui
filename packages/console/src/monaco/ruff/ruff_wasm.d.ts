/* tslint:disable */
/* eslint-disable */
/**
*/
export function run(): void;

export interface Diagnostic {
    code: string;
    message: string;
    location: {
        row: number;
        column: number;
    };
    end_location: {
        row: number;
        column: number;
    };
    fix: {
        message: string | null;
        edits: {
            content: string | null;
            location: {
                row: number;
                column: number;
            };
            end_location: {
                row: number;
                column: number;
            };
        }[];
    } | null;
};


/**
*/
export class Workspace {
  free(): void;
/**
* @returns {string}
*/
  static version(): string;
/**
* @param {any} options
*/
  constructor(options: any);
/**
* @returns {any}
*/
  static defaultSettings(): any;
/**
* @param {string} contents
* @returns {any}
*/
  check(contents: string): any;
/**
* @param {string} contents
* @returns {string}
*/
  format(contents: string): string;
/**
* @param {string} contents
* @returns {string}
*/
  format_ir(contents: string): string;
/**
* @param {string} contents
* @returns {string}
*/
  comments(contents: string): string;
/**
* Parses the content and returns its AST
* @param {string} contents
* @returns {string}
*/
  parse(contents: string): string;
/**
* @param {string} contents
* @returns {string}
*/
  tokens(contents: string): string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly run: () => void;
  readonly __wbg_workspace_free: (a: number) => void;
  readonly workspace_version: (a: number) => void;
  readonly workspace_new: (a: number, b: number) => void;
  readonly workspace_defaultSettings: (a: number) => void;
  readonly workspace_check: (a: number, b: number, c: number, d: number) => void;
  readonly workspace_format: (a: number, b: number, c: number, d: number) => void;
  readonly workspace_format_ir: (a: number, b: number, c: number, d: number) => void;
  readonly workspace_comments: (a: number, b: number, c: number, d: number) => void;
  readonly workspace_parse: (a: number, b: number, c: number, d: number) => void;
  readonly workspace_tokens: (a: number, b: number, c: number, d: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
