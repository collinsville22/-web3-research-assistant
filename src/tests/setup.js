// Test setup file to fix Node.js compatibility issues
// Fix for undici File reference issue in GitHub Actions
if (typeof globalThis.File === 'undefined') {
  globalThis.File = class File extends Blob {
    constructor(fileBits, fileName, options) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = Date.now();
      this.webkitRelativePath = '';
    }
  };
}

// Additional Web API polyfills if needed
if (typeof globalThis.FormData === 'undefined') {
  globalThis.FormData = class FormData {
    constructor() {
      this._data = new Map();
    }
    append(name, value) {
      this._data.set(name, value);
    }
  };
}