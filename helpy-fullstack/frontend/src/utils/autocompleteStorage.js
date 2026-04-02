// Utility functions to manage autocomplete suggestions in localStorage

const MAX_SUGGESTIONS = 5; // Limit to 5 recent entries

/**
 * Get previous entries for a given field type
 * @param {string} fieldType - 'email' or 'userId'
 * @returns {string[]} Array of previous entries (max 5)
 */
export function getPreviousEntries(fieldType) {
  try {
    const key = `autocomplete_${fieldType}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const entries = JSON.parse(stored);
    return Array.isArray(entries) ? entries.slice(0, MAX_SUGGESTIONS) : [];
  } catch (e) {
    console.error('Error reading autocomplete entries:', e);
    return [];
  }
}

/**
 * Save a new entry for autocomplete
 * @param {string} fieldType - 'email' or 'userId'
 * @param {string} value - The value to save
 */
export function saveEntry(fieldType, value) {
  if (!value || !value.trim()) return;
  
  try {
    const key = `autocomplete_${fieldType}`;
    const current = getPreviousEntries(fieldType);
    
    // Remove if already exists (to avoid duplicates)
    const filtered = current.filter((entry) => entry.toLowerCase() !== value.trim().toLowerCase());
    
    // Add to beginning and limit to MAX_SUGGESTIONS
    const updated = [value.trim(), ...filtered].slice(0, MAX_SUGGESTIONS);
    
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving autocomplete entry:', e);
  }
}

/**
 * Filter suggestions based on input value
 * @param {string} fieldType - 'email' or 'userId'
 * @param {string} inputValue - Current input value
 * @returns {string[]} Filtered suggestions
 */
export function getFilteredSuggestions(fieldType, inputValue) {
  const entries = getPreviousEntries(fieldType);
  if (!inputValue) return entries;
  
  const lowerInput = inputValue.toLowerCase();
  return entries.filter((entry) => entry.toLowerCase().includes(lowerInput));
}
