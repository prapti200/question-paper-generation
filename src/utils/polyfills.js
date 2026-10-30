// Modern JavaScript Polyfills for PDF.js & Browser Compatibility

if (typeof Uint8Array !== 'undefined') {
  if (!Uint8Array.prototype.toHex) {
    Uint8Array.prototype.toHex = function () {
      let hex = '';
      for (let i = 0; i < this.length; i++) {
        const h = this[i].toString(16);
        hex += h.length === 1 ? '0' + h : h;
      }
      return hex;
    };
  }

  if (!Uint8Array.prototype.setFromHex) {
    Uint8Array.prototype.setFromHex = function (hexString) {
      if (typeof hexString !== 'string') {
        throw new TypeError('Argument is not a string');
      }
      if (hexString.length % 2 !== 0) {
        throw new SyntaxError('String should be an even number of characters');
      }
      const maxBytes = Math.min(this.length, hexString.length / 2);
      for (let i = 0; i < maxBytes; i++) {
        this[i] = parseInt(hexString.substr(i * 2, 2), 16);
      }
      return { read: maxBytes * 2, written: maxBytes };
    };
  }

  if (!Uint8Array.prototype.toBase64) {
    Uint8Array.prototype.toBase64 = function () {
      let binary = '';
      const len = this.length;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(this[i]);
      }
      return btoa(binary);
    };
  }

  if (!Uint8Array.prototype.setFromBase64) {
    Uint8Array.prototype.setFromBase64 = function (base64String) {
      const binary = atob(base64String);
      const len = Math.min(this.length, binary.length);
      for (let i = 0; i < len; i++) {
        this[i] = binary.charCodeAt(i);
      }
      return { read: base64String.length, written: len };
    };
  }
}

if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
