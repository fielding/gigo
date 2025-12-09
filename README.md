# GIGO - Garbage In, Gold Out

A VS Code/Cursor extension that transforms lazy, typo-ridden prompts into highly technical specifications using LLM.

## Features

- **Upscale any prompt**: Select sloppy text and transform it into a detailed technical spec
- **Multiple input methods**: Use selected text, input box, or clipboard
- **Clipboard workflow**: Copy lazy prompt, upscale in-place, paste the gold
- **Undo/History**: Restore original prompts if the upscale isn't what you wanted
- **Custom system prompt**: Tweak the upscaling behavior to your preferences
- **Smart LLM fallback**: Automatically uses `vscode.lm` API when available, falls back to OpenAI/Anthropic

## Usage

### Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| `GIGO: Upscale Prompt` | `Cmd+Shift+G` | Upscale selected text or show input box |
| `GIGO: Upscale from Clipboard` | `Cmd+Shift+Alt+G` | Read clipboard, upscale, write back |
| `GIGO: Restore Original` | - | Browse history and restore an original prompt (replaces selection) |

### Workflow Examples

**Selection workflow:**
1. Select sloppy text in the editor
2. Press `Cmd+Shift+G`
3. Text is replaced with the upscaled version

**Clipboard workflow (best for Cursor chat):**
1. Type your lazy prompt in the chat box
2. Select all and copy (`Cmd+A`, `Cmd+C`)
3. Press `Cmd+Shift+Alt+G`
4. Paste (`Cmd+V`) - your upscaled prompt is ready

**Input box workflow:**
1. Press `Cmd+Shift+G` with no selection
2. Type your lazy prompt in the input box
3. Result is copied to clipboard

**Restore workflow:**
1. Upscale some text and realize it's not what you wanted
2. Select the upscaled text (or position cursor where you want to insert)
3. Run `GIGO: Restore Original` from Command Palette
4. Pick from history - the original replaces your selection (or inserts at cursor)

### Context Menu
Right-click on selected text and choose "GIGO: Upscale Prompt"

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `gigo.apiKey` | Your OpenAI or Anthropic API key | `""` |
| `gigo.apiProvider` | Which provider to use (`openai` or `anthropic`) | `"openai"` |
| `gigo.model` | Model identifier (e.g., `gpt-4o`, `claude-sonnet-4-20250514`) | Provider default |
| `gigo.systemPrompt` | Custom system prompt for upscaling | Built-in default |
| `gigo.historySize` | Number of originals to keep in history | `5` |

### Example Settings

```json
{
  "gigo.apiKey": "sk-...",
  "gigo.apiProvider": "openai",
  "gigo.model": "gpt-4o",
  "gigo.historySize": 10
}
```

### Custom System Prompt

You can override the built-in system prompt to customize how upscaling works:

```json
{
  "gigo.systemPrompt": "Rewrite this request as a detailed technical specification. Be concise but thorough. Include edge cases and error handling considerations."
}
```

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package for distribution
npm run package
```

Press `F5` in VS Code/Cursor to launch the Extension Development Host.

## LLM Priority

1. **vscode.lm API** - Uses the built-in Language Model API (Copilot/Cursor models)
2. **External API** - Falls back to configured OpenAI/Anthropic API

The extension will show an error with a link to settings if no LLM is available.

## Installation

### From VSIX

```bash
cursor --install-extension gigo-0.2.0.vsix
# or
code --install-extension gigo-0.2.0.vsix
```

Or in VS Code/Cursor: `Cmd+Shift+P` → "Extensions: Install from VSIX..."
