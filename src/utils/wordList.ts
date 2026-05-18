// Common English words used for validation (2–8 letters)
// This set is intentionally broad to cover all puzzle words and common English vocabulary.
const WORD_SET = new Set<string>([]);

// Load words from the wordlist.txt file
async function loadWordSet() {
  try {
    // Use Vite's base URL which automatically handles both local dev and GitHub Pages
    const basePath = import.meta.env.BASE_URL || '/';
    const response = await fetch(`${basePath}wordlist.txt`);
    const text = await response.text();
    const words = text.split('\n').map(word => word.trim().toLowerCase());
    words.forEach(word => WORD_SET.add(word));
  } catch (error) {
    console.error('Failed to load wordlist:', error);
  }
}

// Initialize the word set
loadWordSet();

export function isValidWord(word: string): boolean {
  return WORD_SET.has(word.toLowerCase());
}
