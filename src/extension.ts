import * as vscode from 'vscode';
import { upscalePrompt, openSettings } from './llmService';
import { CONFIG, STORAGE_KEYS, HistoryEntry } from './constants';

let extensionContext: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
  extensionContext = context;

  // Register all commands
  context.subscriptions.push(
    vscode.commands.registerCommand('gigo.upscalePrompt', executeUpscale),
    vscode.commands.registerCommand('gigo.upscaleClipboard', executeUpscaleClipboard),
    vscode.commands.registerCommand('gigo.restoreOriginal', executeRestoreOriginal)
  );
}

export function deactivate() {
  // Nothing to clean up
}

// ============================================================================
// History Management
// ============================================================================

/**
 * Gets the history size from settings.
 */
function getHistorySize(): number {
  const config = vscode.workspace.getConfiguration(CONFIG.SECTION);
  return config.get<number>(CONFIG.HISTORY_SIZE) ?? 5;
}

/**
 * Retrieves the history from globalState.
 */
function getHistory(): HistoryEntry[] {
  return extensionContext.globalState.get<HistoryEntry[]>(STORAGE_KEYS.HISTORY, []);
}

/**
 * Adds an entry to the history, trimming to max size.
 */
async function addToHistory(original: string, upscaled: string): Promise<void> {
  const history = getHistory();
  const maxSize = getHistorySize();

  const entry: HistoryEntry = {
    original,
    upscaled,
    timestamp: Date.now(),
  };

  // Add to front, trim to max size
  history.unshift(entry);
  if (history.length > maxSize) {
    history.length = maxSize;
  }

  await extensionContext.globalState.update(STORAGE_KEYS.HISTORY, history);
}

/**
 * Formats a timestamp for display.
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Creates a preview string (truncated if needed).
 */
function preview(text: string, maxLength = 50): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= maxLength) {
    return oneLine;
  }
  return oneLine.slice(0, maxLength - 3) + '...';
}

// ============================================================================
// Command: Upscale Prompt (selection or input box)
// ============================================================================

async function executeUpscale(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  const selection = editor?.selection;
  const selectedText = editor?.document.getText(selection);

  let inputText: string;
  let hasSelection = false;

  if (selectedText && selectedText.trim().length > 0) {
    inputText = selectedText;
    hasSelection = true;
  } else {
    const userInput = await vscode.window.showInputBox({
      title: 'GIGO: Upscale Prompt',
      prompt: 'Enter your lazy prompt to upscale',
      placeHolder: 'e.g., "add auth to the api"',
      ignoreFocusOut: true,
    });

    if (!userInput || userInput.trim().length === 0) {
      return;
    }

    inputText = userInput;
  }

  await performUpscale(inputText, hasSelection ? { editor: editor!, selection: selection! } : undefined);
}

// ============================================================================
// Command: Upscale from Clipboard
// ============================================================================

async function executeUpscaleClipboard(): Promise<void> {
  const clipboardText = await vscode.env.clipboard.readText();

  if (!clipboardText || clipboardText.trim().length === 0) {
    vscode.window.showWarningMessage('GIGO: Clipboard is empty');
    return;
  }

  await performUpscale(clipboardText, undefined, true);
}

// ============================================================================
// Command: Restore Original
// ============================================================================

async function executeRestoreOriginal(): Promise<void> {
  const history = getHistory();

  if (history.length === 0) {
    vscode.window.showInformationMessage('GIGO: No history available');
    return;
  }

  const items: vscode.QuickPickItem[] = history.map((entry, index) => ({
    label: preview(entry.original, 60),
    description: formatTimestamp(entry.timestamp),
    detail: `Upscaled to: ${preview(entry.upscaled, 80)}`,
    picked: index === 0,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    title: 'GIGO: Restore Original Prompt',
    placeHolder: 'Select a prompt to restore',
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (!selected) {
    return;
  }

  const index = items.indexOf(selected);
  const entry = history[index];

  const editor = vscode.window.activeTextEditor;
  const selection = editor?.selection;

  if (editor && selection && !selection.isEmpty) {
    // Replace selection with original
    await editor.edit((editBuilder) => {
      editBuilder.replace(selection, entry.original);
    });

    vscode.window.showInformationMessage('GIGO: Original restored');
  } else if (editor && selection) {
    // No selection but editor is open - insert at cursor
    await editor.edit((editBuilder) => {
      editBuilder.insert(selection.active, entry.original);
    });

    vscode.window.showInformationMessage('GIGO: Original inserted at cursor');
  } else {
    // No editor - copy to clipboard as fallback
    await vscode.env.clipboard.writeText(entry.original);

    const action = await vscode.window.showInformationMessage(
      'GIGO: Original copied to clipboard (no editor open)',
      'View Both'
    );

    if (action === 'View Both') {
      const content = `# Original Prompt\n\n${entry.original}\n\n---\n\n# Upscaled Version\n\n${entry.upscaled}`;
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'markdown',
      });
      await vscode.window.showTextDocument(doc);
    }
  }
}

// ============================================================================
// Core Upscale Logic
// ============================================================================

interface EditorContext {
  editor: vscode.TextEditor;
  selection: vscode.Selection;
}

async function performUpscale(
  inputText: string,
  editorContext?: EditorContext,
  isClipboardMode = false
): Promise<void> {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'GIGO: Upscaling prompt...',
      cancellable: true,
    },
    async (progress, token) => {
      const result = await upscalePrompt(inputText, token);

      if (token.isCancellationRequested) {
        return;
      }

      if (!result.success) {
        const action = await vscode.window.showErrorMessage(
          `GIGO: ${result.error}`,
          'Open Settings',
          'Dismiss'
        );

        if (action === 'Open Settings') {
          await openSettings();
        }
        return;
      }

      const upscaledText = result.text;

      // Save to history
      await addToHistory(inputText, upscaledText);

      if (editorContext) {
        // Replace selection in editor
        await editorContext.editor.edit((editBuilder) => {
          editBuilder.replace(editorContext.selection, upscaledText);
        });

        vscode.window.showInformationMessage(
          `GIGO: Prompt upscaled via ${result.source}`,
          'Restore Original'
        ).then((action) => {
          if (action === 'Restore Original') {
            vscode.commands.executeCommand('gigo.restoreOriginal');
          }
        });
      } else if (isClipboardMode) {
        // Clipboard mode: write back to clipboard
        await vscode.env.clipboard.writeText(upscaledText);

        const action = await vscode.window.showInformationMessage(
          `GIGO: Upscaled prompt written to clipboard (via ${result.source})`,
          'View Original',
          'View Both'
        );

        if (action === 'View Original') {
          await vscode.env.clipboard.writeText(inputText);
          vscode.window.showInformationMessage('GIGO: Original restored to clipboard');
        } else if (action === 'View Both') {
          const content = `# Original Prompt\n\n${inputText}\n\n---\n\n# Upscaled Version\n\n${upscaledText}`;
          const doc = await vscode.workspace.openTextDocument({
            content,
            language: 'markdown',
          });
          await vscode.window.showTextDocument(doc);
        }
      } else {
        // Input box mode: copy to clipboard
        await vscode.env.clipboard.writeText(upscaledText);

        const action = await vscode.window.showInformationMessage(
          `GIGO: Upscaled prompt copied to clipboard (via ${result.source})`,
          'View Full Text'
        );

        if (action === 'View Full Text') {
          const doc = await vscode.workspace.openTextDocument({
            content: upscaledText,
            language: 'markdown',
          });
          await vscode.window.showTextDocument(doc);
        }
      }
    }
  );
}
