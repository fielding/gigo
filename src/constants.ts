/**
 * System prompt for the LLM to transform lazy prompts into detailed specs.
 */
export const SYSTEM_PROMPT = `Rewrite the user's sloppy/lazy request into a clean, clear, well-specified version.

Rules:
- Output ONLY the rewritten request. Nothing else.
- Fix typos and grammar.
- Clarify vague intent.
- Keep output length proportional to input complexity. A short input gets a short (but clearer) output.
- For technical/coding requests: add relevant details like edge cases, error handling, or constraints.
- Do NOT write a "system prompt" or "persona description" - just rewrite the actual request.

Examples:
"yo whats up" → "Hello, how are you?"
"add auth" → "Implement JWT-based authentication with login/logout endpoints, token validation middleware, password hashing (bcrypt), and proper error responses (401 for invalid/expired tokens)."
"make it faster" → "Optimize performance. Profile to identify bottlenecks, consider caching frequently accessed data, reduce unnecessary database queries, and evaluate algorithm complexity."
"fix teh bug" → "Debug and fix the issue. Identify the root cause, add appropriate error handling, and include a test to prevent regression."

Rewrite this:`;

/**
 * Configuration keys for VS Code settings.
 */
export const CONFIG = {
  SECTION: 'gigo',
  API_KEY: 'apiKey',
  API_PROVIDER: 'apiProvider',
  MODEL: 'model',
  SYSTEM_PROMPT: 'systemPrompt',
  HISTORY_SIZE: 'historySize',
} as const;

/**
 * Storage keys for globalState.
 */
export const STORAGE_KEYS = {
  HISTORY: 'gigo.history',
} as const;

/**
 * History entry for storing original prompts.
 */
export interface HistoryEntry {
  original: string;
  upscaled: string;
  timestamp: number;
}

/**
 * Default models for each provider when none is specified.
 */
export const DEFAULT_MODELS = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
} as const;

/**
 * API endpoints for external providers.
 */
export const API_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
} as const;

export type ApiProvider = keyof typeof DEFAULT_MODELS;

