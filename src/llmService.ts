import * as vscode from 'vscode';
import {
  SYSTEM_PROMPT,
  CONFIG,
  DEFAULT_MODELS,
  API_ENDPOINTS,
  ApiProvider,
} from './constants';

/**
 * Result type for upscale operations.
 */
export type UpscaleResult =
  | { success: true; text: string; source: 'vscode.lm' | 'openai' | 'anthropic' }
  | { success: false; error: string };

/**
 * Gets the effective system prompt (custom from settings or default).
 */
export function getEffectiveSystemPrompt(): string {
  const config = vscode.workspace.getConfiguration(CONFIG.SECTION);
  const customPrompt = config.get<string>(CONFIG.SYSTEM_PROMPT);
  return customPrompt && customPrompt.trim() ? customPrompt.trim() : SYSTEM_PROMPT;
}

/**
 * Attempts to upscale the given prompt using available LLM services.
 * Priority: vscode.lm API > External API (OpenAI/Anthropic)
 */
export async function upscalePrompt(
  input: string,
  cancellationToken?: vscode.CancellationToken
): Promise<UpscaleResult> {
  const systemPrompt = getEffectiveSystemPrompt();

  // Priority 1: Try vscode.lm API
  const vscodeLmResult = await tryVscodeLm(input, systemPrompt, cancellationToken);
  if (vscodeLmResult.success) {
    return vscodeLmResult;
  }

  // Priority 2: Try external API
  const externalResult = await tryExternalApi(input, systemPrompt);
  if (externalResult.success) {
    return externalResult;
  }

  // Both failed
  return {
    success: false,
    error: `vscode.lm: ${vscodeLmResult.error}\nExternal API: ${externalResult.error}`,
  };
}

/**
 * Attempts to use the vscode.lm API for text generation.
 */
async function tryVscodeLm(
  input: string,
  systemPrompt: string,
  cancellationToken?: vscode.CancellationToken
): Promise<UpscaleResult> {
  try {
    // Check if vscode.lm API is available
    if (!vscode.lm || typeof vscode.lm.selectChatModels !== 'function') {
      return { success: false, error: 'vscode.lm API not available' };
    }

    // Try to get available models - prefer gpt-4o family, fall back to any available
    let models = await vscode.lm.selectChatModels({ family: 'gpt-4o' });
    
    if (models.length === 0) {
      // Try without family filter
      models = await vscode.lm.selectChatModels({});
    }

    if (models.length === 0) {
      return { success: false, error: 'No language models available via vscode.lm' };
    }

    const model = models[0];
    
    // Build the messages
    const messages = [
      vscode.LanguageModelChatMessage.User(`${systemPrompt}\n\n---\n\nUser's prompt to upscale:\n${input}`),
    ];

    // Send the request
    const response = await model.sendRequest(
      messages,
      {},
      cancellationToken ?? new vscode.CancellationTokenSource().token
    );

    // Collect the streamed response
    let result = '';
    for await (const chunk of response.text) {
      result += chunk;
    }

    if (!result.trim()) {
      return { success: false, error: 'Empty response from vscode.lm' };
    }

    return { success: true, text: result.trim(), source: 'vscode.lm' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `vscode.lm error: ${message}` };
  }
}

/**
 * Attempts to use external API (OpenAI or Anthropic) for text generation.
 */
async function tryExternalApi(input: string, systemPrompt: string): Promise<UpscaleResult> {
  const config = vscode.workspace.getConfiguration(CONFIG.SECTION);
  const apiKey = config.get<string>(CONFIG.API_KEY);
  const provider = config.get<ApiProvider>(CONFIG.API_PROVIDER) ?? 'openai';
  const customModel = config.get<string>(CONFIG.MODEL);
  const model = customModel || DEFAULT_MODELS[provider];

  if (!apiKey) {
    return {
      success: false,
      error: 'No API key configured. Set gigo.apiKey in settings.',
    };
  }

  try {
    if (provider === 'openai') {
      return await callOpenAI(apiKey, model, input, systemPrompt);
    } else {
      return await callAnthropic(apiKey, model, input, systemPrompt);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `${provider} API error: ${message}` };
  }
}

/**
 * Calls the OpenAI Chat Completions API.
 */
async function callOpenAI(
  apiKey: string,
  model: string,
  input: string,
  systemPrompt: string
): Promise<UpscaleResult> {
  const response = await fetch(API_ENDPOINTS.openai, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  return { success: true, text: content.trim(), source: 'openai' };
}

/**
 * Calls the Anthropic Messages API.
 */
async function callAnthropic(
  apiKey: string,
  model: string,
  input: string,
  systemPrompt: string
): Promise<UpscaleResult> {
  const response = await fetch(API_ENDPOINTS.anthropic, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: input }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const textBlock = data.content?.find((block) => block.type === 'text');
  if (!textBlock?.text) {
    throw new Error('No text content in Anthropic response');
  }

  return { success: true, text: textBlock.text.trim(), source: 'anthropic' };
}

/**
 * Opens VS Code settings to the GIGO configuration section.
 */
export function openSettings(): Thenable<void> {
  return vscode.commands.executeCommand(
    'workbench.action.openSettings',
    '@ext:gigo.gigo'
  ) as Thenable<void>;
}
