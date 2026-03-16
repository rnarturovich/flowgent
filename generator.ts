import Anthropic from '@anthropic-ai/sdk';
import { GenerationResult, GenerateOptions, N8nWorkflow, MakeScenario } from './types.js';
import { buildSystemPrompt, buildUserPrompt } from '../prompts/workflow-builder.js';

const MODEL = 'claude-opus-4-5';

export class WorkflowGenerator {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
    });
  }

  async generate(options: GenerateOptions): Promise<GenerationResult> {
    const { platform, prompt, verbose } = options;

    if (verbose) {
      console.log(`\n[FlowGent] Connecting to Claude AI...`);
      console.log(`[FlowGent] Platform: ${platform}`);
      console.log(`[FlowGent] Prompt: "${prompt}"\n`);
    }

    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 8096,
      system: buildSystemPrompt(platform),
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(prompt),
        },
      ],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    const parsed = this.parseResponse(rawContent.text, platform);
    return parsed;
  }

  private parseResponse(raw: string, platform: 'n8n' | 'make'): GenerationResult {
    // Strip possible markdown code fences
    const cleaned = raw
      .replace(/^```json\n?/i, '')
      .replace(/^```\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    let parsed: {
      suggestedName: string;
      description: string;
      estimatedComplexity: 'simple' | 'moderate' | 'complex';
      warnings: string[];
      workflow: N8nWorkflow | MakeScenario;
    };

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(
        `Failed to parse Claude response as JSON.\n\nRaw response:\n${raw.slice(0, 500)}...`
      );
    }

    if (!parsed.workflow) {
      throw new Error('Claude response missing "workflow" key.');
    }

    const nodeCount = this.countNodes(parsed.workflow, platform);

    return {
      platform,
      workflow: parsed.workflow,
      description: parsed.description ?? 'AI-generated workflow',
      nodeCount,
      estimatedComplexity: parsed.estimatedComplexity ?? 'moderate',
      warnings: parsed.warnings ?? [],
      suggestedName: parsed.suggestedName ?? 'flowgent-workflow',
    };
  }

  private countNodes(workflow: N8nWorkflow | MakeScenario, platform: 'n8n' | 'make'): number {
    if (platform === 'n8n') {
      const n8nWf = workflow as N8nWorkflow;
      return Array.isArray(n8nWf.nodes) ? n8nWf.nodes.length : 0;
    } else {
      const makeWf = workflow as MakeScenario;
      return Array.isArray(makeWf.flow) ? makeWf.flow.length : 0;
    }
  }
}
