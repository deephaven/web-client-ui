import $ from 'jquery';

export function getHashValue(key: string) {
  var matches = location.hash.match(new RegExp(key + '=([^&]*)'));
  return matches ? matches[1] : null;
}

export function getQueryStringParam(param: string) {
  if (window.location.hash) {
    return getHashValue(param);
  } else if (!window.location.search) {
    return null;
  }

  var keyValuePairs = window.location.search.substr(1).split('&'),
    params: Record<string, string> = {},
    pair,
    i;

  for (i = 0; i < keyValuePairs.length; i++) {
    pair = keyValuePairs[i].split('=');
    params[pair[0]] = pair[1];
  }

  return params[param] || null;
}

export function animFrame(fn: (time?: number) => void) {
  return window.requestAnimationFrame(fn);
}

export function removeFromArray<T>(item: T, array: T[]) {
  var index = array.indexOf(item);

  if (index === -1) {
    throw new Error("Can't remove item from array. Item is not in the array");
  }

  array.splice(index, 1);
}

export function getUniqueId() {
  return (Math.random() * 1000000000000000).toString(36).replace('.', '');
}

/**
 * A basic XSS filter. It is ultimately up to the
 * implementing developer to make sure their particular
 * applications and usecases are save from cross site scripting attacks
 *
 * @param input
 * @param keepTags
 *
 * @returns filtered input
 */
export function filterXss(input: string, keepTags: boolean) {
  var output = input
    .replace(/javascript/gi, 'j&#97;vascript')
    .replace(/expression/gi, 'expr&#101;ssion')
    .replace(/onload/gi, 'onlo&#97;d')
    .replace(/script/gi, '&#115;cript')
    .replace(/onerror/gi, 'on&#101;rror');

  if (keepTags === true) {
    return output;
  } else {
    return output.replace(/>/g, '&gt;').replace(/</g, '&lt;');
  }
}

/**
 * Removes html tags from a string
 *
 * @param input
 *
 * @returns input without tags
 */
export function stripTags(input: string) {
  return $.trim(input.replace(/(<([^>]+)>)/gi, ''));
}
