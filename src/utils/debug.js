// utils/debug.js
const DEBUG = import.meta.env.DEV; // alleen in development

export const debugLog = (...args) => {
  if (DEBUG) {
    console.log(...args);
  }
};

export const debugError = (...args) => {
  console.error(...args); // errors altijd loggen
};

export const debugWarn = (...args) => {
  if (DEBUG) {
    console.warn(...args);
  }
};

export const debugInfo = (...args) => {
  if (DEBUG) {
    console.info(...args);
  }
}; 