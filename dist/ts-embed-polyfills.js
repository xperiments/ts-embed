// https://github.com/ttaubert/node-arraybuffer-slice
// (c) 2014 Tim Taubert <tim@timtaubert.de>
// arraybuffer-slice may be freely distributed under the MIT license.

(function (undefined) {
    "use strict";

    function clamp(val, length) {
        val = (val|0) || 0;

        if (val < 0) {
            return Math.max(val + length, 0);
        }

        return Math.min(val, length);
    }

    if (window.ArrayBuffer && !ArrayBuffer.prototype.slice) {
        ArrayBuffer.prototype.slice = function (from, to) {
            var length = this.byteLength;
            var begin = clamp(from, length);
            var end = length;

            if (to !== undefined) {
                end = clamp(to, length);
            }

            if (begin > end) {
                return new ArrayBuffer(0);
            }

            var num = end - begin;
            var target = new ArrayBuffer(num);
            var targetArray = new Uint8Array(target);

            var sourceArray = new Uint8Array(this, begin, num);
            targetArray.set(sourceArray);

            return target;
        };
    }
})();
// https://github.com/mozilla/pdf.js/blob/master/web/compatibility.js#L27-98
// Checking if the typed arrays are supported
// Support: IE<10, Android<4.0
(function checkTypedArrayCompatibility() {

  if (typeof Uint8Array !== 'undefined') {

    // Support: Android<4.1
    if (typeof Float64Array === 'undefined') {
      window.Float64Array = Float32Array;
    }
    return;
  }

  function subarray(start, end) {
    return new TypedArray(this.slice(start, end));
  }

  function setArrayOffset(array, offset) {
    if (arguments.length < 2) {
      offset = 0;
    }
    for (var i = 0, n = array.length; i < n; ++i, ++offset) {
      this[offset] = array[i] & 0xFF;
    }
  }

  function TypedArray(arg1) {
    var result, i, n;
    if (typeof arg1 === 'number') {
      result = [];
      for (i = 0; i < arg1; ++i) {
        result[i] = 0;
      }
    } else if ('slice' in arg1) {
      result = arg1.slice(0);
    } else {
      result = [];
      for (i = 0, n = arg1.length; i < n; ++i) {
        result[i] = arg1[i];
      }
    }

    result.subarray = subarray;
    result.buffer = result;
    result.byteLength = result.length;
    result.set = setArrayOffset;

    if (typeof arg1 === 'object' && arg1.buffer) {
      result.buffer = arg1.buffer;
    }
    return result;
  }

  window.Uint8Array = TypedArray;
  window.Int8Array = TypedArray;

  // we don't need support for set, byteLength for 32-bit array
  // so we can use the TypedArray as well
  window.Uint32Array = TypedArray;
  window.Int32Array = TypedArray;
  window.Uint16Array = TypedArray;
  window.Float32Array = TypedArray;
  window.Float64Array = TypedArray;
})();

// No XMLHttpRequest#response?
// Support: IE<11, Android <4.0
(function checkXMLHttpRequestResponseCompatibility() {
  var xhrPrototype = XMLHttpRequest.prototype;
  var xhr = new XMLHttpRequest();
  if (!('overrideMimeType' in xhr)) {
    // IE10 might have response, but not overrideMimeType
    // Support: IE10
    Object.defineProperty(xhrPrototype, 'overrideMimeType', {
      value: function xmlHttpRequestOverrideMimeType(mimeType) {}
    });
  }
  if ('responseType' in xhr) {
    return;
  }

  Object.defineProperty(xhrPrototype, 'responseType', {
    get: function xmlHttpRequestGetResponseType() {
      return this._responseType || 'text';
    },
    set: function xmlHttpRequestSetResponseType(value) {
      if (value === 'text' || value === 'arraybuffer') {
        this._responseType = value;
        if (value === 'arraybuffer' &&
            typeof this.overrideMimeType === 'function') {
          this.overrideMimeType('text/plain; charset=x-user-defined');
        }
      }
    }
  });

  // Support: IE9
  if (typeof VBArray !== 'undefined') {
    Object.defineProperty(xhrPrototype, 'response', {
      get: function xmlHttpRequestResponseGet() {
        if (this.responseType === 'arraybuffer') {
          return new Uint8Array(new VBArray(this.responseBody).toArray());
        } else {
          return this.responseText;
        }
      }
    });
    return;
  }

  Object.defineProperty(xhrPrototype, 'response', {
    get: function xmlHttpRequestResponseGet() {
      if (this.responseType !== 'arraybuffer') {
        return this.responseText;
      }
      var text = this.responseText;
      var i, n = text.length;
      var result = new Uint8Array(n);
      for (i = 0; i < n; ++i) {
        result[i] = text.charCodeAt(i) & 0xFF;
      }
      return result.buffer;
    }
  });
})();

// window.btoa (base64 encode function) ?
// Support: IE<10
(function checkWindowBtoaCompatibility() {
  if ('btoa' in window) {
    return;
  }

  var digits =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  window.btoa = function windowBtoa(chars) {
    var buffer = '';
    var i, n;
    for (i = 0, n = chars.length; i < n; i += 3) {
      var b1 = chars.charCodeAt(i) & 0xFF;
      var b2 = chars.charCodeAt(i + 1) & 0xFF;
      var b3 = chars.charCodeAt(i + 2) & 0xFF;
      var d1 = b1 >> 2, d2 = ((b1 & 3) << 4) | (b2 >> 4);
      var d3 = i + 1 < n ? ((b2 & 0xF) << 2) | (b3 >> 6) : 64;
      var d4 = i + 2 < n ? (b3 & 0x3F) : 64;
      buffer += (digits.charAt(d1) + digits.charAt(d2) +
                 digits.charAt(d3) + digits.charAt(d4));
    }
    return buffer;
  };
})();

// window.atob (base64 encode function)?
// Support: IE<10
(function checkWindowAtobCompatibility() {
  if ('atob' in window) {
    return;
  }

  // https://github.com/davidchambers/Base64.js
  var digits =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  window.atob = function (input) {
    input = input.replace(/=+$/, '');
    if (input.length % 4 === 1) {
      throw new Error('bad atob input');
    }
    for (
      // initialize result and counters
      var bc = 0, bs, buffer, idx = 0, output = '';
      // get next character
      buffer = input.charAt(idx++);
      // character found in table?
      // initialize bit storage and add its ascii value
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        // and if not first of each 4 characters,
        // convert the first 8 bits to one ascii character
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = digits.indexOf(buffer);
    }
    return output;
  };
})();

