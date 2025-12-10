# GIGO: Garbage In, Gold Out

> **The "Prompt Launderer" for Cursor & VS Code.**
> *Stop polluting your context window with lazy prompts.*

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Status](https://img.shields.io/badge/status-stable-green.svg) ![Simulated IQ](https://img.shields.io/badge/Simulated%20IQ-200+-purple)

## The Deep Lore: Why This Works

Most developers treat LLMs as "Assistants." This is a fundamental misunderstanding.

**LLMs are Simulators.** (See: *Janus/Simulators* on LessWrong).

The model is a physics engine for text. It predicts the next token based on the probability distribution of the current context. It does not "want" to help you; it simply completes the pattern you started.

### 1. The Mirror Effect

The model acts as a mirror to your input.

* **Garbage In:** If you type lazy, typo-ridden prompts (`"yo fix this api"`), the model detects a low-competence environment. It "Simulates" a junior developer or a casual forum commenter. The code output will be fragile and surface-level.

* **Gold In:** If you type precise, formal technical specifications, the model detects a high-competence environment. It "Simulates" a Principal Engineer. The code output will be robust and defensive.

### 2. The Waluigi Effect & Attention Pollution

Even if you correct yourself later, your original "slop" prompt remains in the Context Window.

The Attention Mechanism *still* attends to those lazy tokens. This creates what is known as **Attention Pollution**.

In the latent space, this "slop" acts as a gravitational pull toward the **"Waluigi" attractor** - a state where the model becomes lazy, deceptive, or hallucinatory because the entropy of the conversation is high.

**To get the best code, the context window must remain pristine.**

---

## The Solution: GIGO

**GIGO (Garbage In, Gold Out)** is a "Clean Room" implementation for your prompts.

It intercepts your input and routes it through a "Middleware" layer (using the `vscode.lm` API or external APIs) to "Upscale" it before it ever touches your chat history.

### The Workflow

1. **Intercept:** You type your lazy thought:
   > *"login page is slow fix it"*

2. **Launder:** You hit the hotkey. GIGO sends this text to a background model with a specific system prompt ("Act as a Principal Engineer...").

3. **Replace:** The background model rewrites your prompt into a high-fidelity specification:
   > *"Analyze the login page rendering performance. Specifically, investigate the 'useEffect' hooks for unnecessary re-renders and check the network waterfall for blocking resources."*

4. **Inject:** GIGO replaces your input with the Gold Prompt.

5. **Execute:** You hit enter. The AI *only* sees the expert-level instruction.

**The result:** You keep your lazy workflow, but you get 10x better code because you are forcing the model to run a "High-IQ Simulation."

---

## Features

- **One hotkey does it all**: `Cmd+Shift+G` intelligently handles selection, clipboard, or manual input
- **Clipboard workflow**: Copy lazy prompt, hit hotkey, paste the gold - perfect for Cursor chat
- **Undo/History**: Restore original prompts if the upscale isn't what you wanted
- **Custom system prompt**: Tweak the upscaling behavior to your preferences
- **Smart LLM fallback**: Automatically uses `vscode.lm` API when available, falls back to OpenAI/Anthropic

---

## Installation

### From Source

```bash
git clone https://github.com/fielding/gigo.git
cd gigo
npm install
npm run compile
```

Press `F5` in VS Code/Cursor to launch the Extension Development Host.

### From VSIX

```bash
cursor --install-extension gigo-0.3.0.vsix
# or
code --install-extension gigo-0.3.0.vsix
```

Or in VS Code/Cursor: `Cmd+Shift+P` -> "Extensions: Install from VSIX..."

---

## Usage

### One Hotkey: `Cmd+Shift+G`

The command intelligently picks the right workflow:

| Condition | Behavior |
|-----------|----------|
| Text is selected | Upscales selection, replaces in-place |
| No selection, clipboard has text | Upscales clipboard, writes back to clipboard |
| No selection, clipboard empty | Shows input box, copies result to clipboard |

### Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| `GIGO: Upscale Prompt` | `Cmd+Shift+G` | Smart upscale (selection -> clipboard -> input) |
| `GIGO: Restore Original` | - | Browse history and restore an original prompt |

### Typical Workflow (Cursor Chat)

1. Type your lazy prompt in the Cursor chat box
2. Select all and copy (`Cmd+A`, `Cmd+C`)
3. Press `Cmd+Shift+G`
4. Paste (`Cmd+V`) - your upscaled prompt is ready
5. Send it

### Context Menu

Right-click on selected text and choose "GIGO: Upscale Prompt"

---

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

---

## LLM Priority

1. **vscode.lm API** - Uses the built-in Language Model API (Copilot/Cursor models)
2. **External API** - Falls back to configured OpenAI/Anthropic API

The extension will show an error with a link to settings if no LLM is available.

---

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

---

## Contributing

**We need more Personas.**

This tool is early. We need specific system prompts for different domains.

* Are you a Rust expert?
* Are you an AWS Architect?
* Are you a Security Auditor?

Submit a PR to add your specialized "Upscaler" prompts. Let's build the ultimate library of high-fidelity simulators.

---

## License

MIT
