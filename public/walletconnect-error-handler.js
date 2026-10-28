// WalletConnect Error Handler - Loads before React bundle
// This script intercepts WalletConnect errors at the lowest level

(function() {
  'use strict';

  console.log('🔧 WalletConnect Error Handler loaded');

  // Benign, non-actionable errors from third-party libraries that otherwise
  // spam the console (e.g. as "Uncaught (in promise)"). libsodium is pulled in
  // transitively by @cardano-sdk/crypto; its background init rejects in this
  // build but is not needed for CIP-30 wallets (the extension signs).
  var SUPPRESSED_MESSAGES = [
    'No matching key',
    'libsodium was not correctly initialized',
  ];

  function isSuppressedMessage(message) {
    return (
      typeof message === 'string' &&
      SUPPRESSED_MESSAGES.some(function(part) {
        return message.includes(part);
      })
    );
  }

  // Override global error handling before any other scripts load.
  // stopImmediatePropagation prevents later listeners (e.g. the webpack-dev-server
  // error overlay) from firing, so the benign error is fully silenced in dev too.
  window.addEventListener('error', function(event) {
    var message = (event.error && event.error.message) || event.message;
    if (isSuppressedMessage(message)) {
      console.warn('🔧 Global error handler suppressed:', message);
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);

  // Override unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason;
    var message =
      reason && typeof reason === 'object' ? reason.message : reason;
    if (isSuppressedMessage(message)) {
      console.warn('🔧 Promise rejection handler suppressed:', message);
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);

  // Patch Error constructor at the earliest possible moment
  const OriginalError = window.Error;
  window.Error = function(message) {
    if (message && typeof message === 'string' && message.includes('No matching key')) {
      console.warn('🔧 Error constructor intercepted WalletConnect error:', message);
      // Return a harmless error-like object
      const harmlessError = {
        name: 'WalletConnectHandledError',
        message: 'WalletConnect cleanup handled',
        stack: '',
        toString: function() { return this.message; }
      };
      return harmlessError;
    }
    return new OriginalError(message);
  };

  // Preserve Error properties
  Object.setPrototypeOf(window.Error, OriginalError);
  window.Error.prototype = OriginalError.prototype;

  // Override console.error to suppress error display
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    if (isSuppressedMessage(message)) {
      console.warn('🔧 Console error suppressed:', ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };

  console.log('🔧 WalletConnect Error Handler initialized');
})();