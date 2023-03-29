import { WritableStream as ponyfillWritableStream } from 'web-streams-polyfill/ponyfill';

// WritableStream is not supported in Firefox (also IE) yet. use ponyfillWritableStream instead
const WritableStream = window.WritableStream ?? ponyfillWritableStream;

export default WritableStream;
