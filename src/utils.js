/* ============================================================
   GroceryBill Pro — Shared Utilities
   ============================================================ */

/**
 * safeText — XSS-safe text encoder.
 * Use this whenever inserting user-supplied strings into innerHTML.
 * Converts special HTML characters to their entities.
 * @param {*} str - Any value; will be coerced to string.
 * @returns {string} HTML-entity-encoded string, safe for innerHTML.
 */
window.safeText = function safeText(str) {
  const div = document.createElement('div');
  div.textContent = String(str == null ? '' : str);
  return div.innerHTML;
};
