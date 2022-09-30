import $ from 'jquery';

// export function extend(subClass, superClass) {
//   subClass.prototype = createObject(superClass.prototype);
//   subClass.prototype.contructor = subClass;
// }

// export function createObject(prototype) {
//   return Object.create(prototype);
// }

// export function objectKeys(object) {
//   var keys, key;

//   if (typeof Object.keys === 'function') {
//     return Object.keys(object);
//   } else {
//     keys = [];
//     for (key in object) {
//       keys.push(key);
//     }
//     return keys;
//   }
// }

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
    params: Record<string, unknown> = {},
    pair,
    i;

  for (i = 0; i < keyValuePairs.length; i++) {
    pair = keyValuePairs[i].split('=');
    params[pair[0]] = pair[1];
  }

  return params[param] || null;
}

// export function copy(target, source) {
//   for (var key in source) {
//     target[key] = source[key];
//   }
//   return target;
// }

export function animFrame(fn: FrameRequestCallback) {
  return window.requestAnimationFrame(fn);
}

// export function indexOf<T>(needle: T, haystack: T[]) {
//   if (!(haystack instanceof Array)) {
//     throw new Error('Haystack is not an Array');
//   }

//   if (haystack.indexOf) {
//     return haystack.indexOf(needle);
//   } else {
//     for (var i = 0; i < haystack.length; i++) {
//       if (haystack[i] === needle) {
//         return i;
//       }
//     }
//     return -1;
//   }
// }

// export function isFunction(obj: unknown) {
//   return typeof obj == 'function';
// }

// export function fnBind(
//   fn: Function,
//   context: unknown,
//   boundArgs: unknown[] = []
// ) {
//   if (Function.prototype.bind !== undefined) {
//     return Function.prototype.bind.apply(fn, [context, ...boundArgs]);
//   }

//   var bound = function () {
//     // Join the already applied arguments to the now called ones (after converting to an array again).
//     var args = (boundArgs || []).concat(
//       Array.prototype.slice.call(arguments, 0)
//     );

//     // If not being called as a constructor
//     if (!(this instanceof bound)) {
//       // return the result of the function called bound to target and partially applied.
//       return fn.apply(context, args);
//     }
//     // If being called as a constructor, apply the function bound to self.
//     fn.apply(this, args);
//   };
//   // Attach the prototype of the function to our newly created function.
//   bound.prototype = fn.prototype;
//   return bound;
// }

export function removeFromArray<T>(item: T, array: T[]) {
  var index = array.indexOf(item);

  if (index === -1) {
    throw new Error("Can't remove item from array. Item is not in the array");
  }

  array.splice(index, 1);
}

// export function now() {
//   return Date.now();
// }

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
