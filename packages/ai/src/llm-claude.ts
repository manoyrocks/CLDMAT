// Server-side Claude adapter for the opt-in coach LLM mode (ADR-0005, OQ-11).
// Runs ONLY inside the backend proxy that holds the API key. The app never imports this file.
import Anthropic from '@anthropic-ai/sdk';
import type { LlmClient } from './coach';

export const CLAUDE_MODEL = 'claude-opus-5';

export class ClaudeLlm implements LlmClient {
  constructor(private readonly client: Anthropic = new Anthropic()) {}

  async complete(system: string, user: string): Promise<string> {
    const response = await this.client.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      // Server-side refusal fallbacks, routed by refusal category.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages: [{ role: 'user', content: user }],
    });
    if (response.stop_reason === 'refusal') throw new Error('model refused');
    // The coach post-check validates this text; any failure falls back to extractive mode.
    return response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n');
  }
}
