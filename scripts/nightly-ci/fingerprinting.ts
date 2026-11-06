/* eslint-disable no-control-regex */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import type { PlaywrightAttachment, PlaywrightError } from './triageTypes.ts';

// Matches any CSI escape sequence (colors, cursor movement, etc.), not just `m` (SGR/color).
// Playwright's expect() output is colorized with these; left in place they get embedded raw
// in the issue body and render as mangled glyphs (e.g. `<0x1b>[31m` -> `<20>[31m`) once GitHub
// re-encodes the markdown, so this must be stripped from anything we actually display, not
// just from the copy we hash for fingerprinting.
const ANSI_PATTERN = /\u001b\[[0-9;]*[a-zA-Z]/g;

export function stripAnsi(text = ''): string {
  return text.replace(ANSI_PATTERN, '');
}

// Strip anything that varies run-to-run (ids, line numbers, timestamps) so
// the same underlying bug hashes to the same fingerprint every time.
export function normalizeError(message = '', stackTop = ''): string {
  return (
    stripAnsi(`${message}\n${stackTop}`)
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        '<uuid>'
      )
      .replace(/:\d+:\d+/g, ':<line>:<col>')
      // generateId() in tests/utils.ts: 21+ chars of [0-9a-z] with at least one digit, possibly
      // embedded in text or prefixed with `_`, so the boundary is captured instead of using `\b`
      // (and lookbehind is lint-forbidden).
      .replace(/(^|[^0-9a-z])(?=[a-z]*\d)[0-9a-z]{21,}(?![0-9a-z])/g, '$1<id>')
      .replace(/\b\d{10,13}\b/g, '<timestamp>')
      .replace(/\b\d+(\.\d+)?m?s\b/g, '<duration>')
      .replace(/\b\d+\b/g, '<n>') // numbers
      .replace(/\s+/g, ' ')
      .trim()
  );
}

// first application/test-related frame in the stack trace
export function firstAppFrame(stack = ''): string {
  const line = stack
    .split('\n')
    .find(l => l.includes('/tests/') || l.includes('/src/'));
  return line !== undefined ? line.trim() : '';
}

// Hashes the normalized message + first app frame into a short, stable id for this failure.
export function fingerprint(error: PlaywrightError): string {
  const signature = normalizeError(error?.message, firstAppFrame(error?.stack));
  return createHash('sha256').update(signature).digest('hex').slice(0, 12);
}

// Playwright exposes the page's accessibility snapshot at failure time either on the
// error itself (1.60+ errorContext) or as an attached markdown file. Try both.
export function readAttachmentContext(
  a: PlaywrightAttachment
): string | undefined {
  if (!/error.?context/i.test(a.name ?? '')) return undefined;
  if (typeof a.body === 'string') {
    try {
      return Buffer.from(a.body, 'base64').toString('utf8');
    } catch {
      /* not base64-encoded */
    }
  }
  if (a.path !== undefined && existsSync(a.path)) {
    try {
      return readFileSync(a.path, 'utf8');
    } catch {
      /* unreadable from this runner */
    }
  }
  return undefined;
}

export function extractErrorContext(
  error: PlaywrightError | undefined,
  attachments: PlaywrightAttachment[] | undefined
): string {
  const direct = error?.errorContext;
  if (typeof direct === 'string' && direct.trim().length > 0) {
    return direct;
  }
  if (direct !== undefined && typeof direct === 'object') {
    const value = direct.value ?? direct.text ?? direct.body;
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  const fromAttachment = (attachments ?? [])
    .map(readAttachmentContext)
    .find(Boolean);
  return fromAttachment ?? '';
}
