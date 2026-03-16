/**
 * FlowGent — Standalone Validation Suite
 * Runs with pure Node.js, zero external dependencies.
 * Tests: prompt builder logic, output utility, JSON structure, type shapes.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// ─── Colour helpers (no chalk) ──────────────────────────────────────────────
const c = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s) => `\x1b[2m${s}\x1b[0m`,
};

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ${c.green('✓')} ${c.dim(name)}`);
    passed++;
  } catch (err) {
    console.log(`  ${c.red('✗')} ${c.bold(name)}`);
    console.log(`    ${c.red(err.message)}`);
    failed++;
  }
}

function suite(name, fn) {
  console.log(`\n${c.cyan(c.bold(name))}`);
  fn();
}

// ─── Inline implementations (mirrors src/ logic, no imports) ────────────────

function sanitizeFilename(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
}

function saveWorkflow(result, outputDir) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const filename = sanitizeFilename(result.suggestedName) + '.json';
  const fullPath = path.join(outputDir, filename);
  const output = {
    _flowgent: {
      generatedAt: new Date().toISOString(),
      platform: result.platform,
      description: result.description,
      nodeCount: result.nodeCount,
      complexity: result.estimatedComplexity,
      warnings: result.warnings,
    },
    ...result.workflow,
  };
  fs.writeFileSync(fullPath, JSON.stringify(output, null, 2), 'utf-8');
  return fullPath;
}

function buildSystemPrompt(platform) {
  const guide = platform === 'n8n'
    ? 'N8N_GUIDE: nodes[], connections{}, active, settings'
    : 'MAKE_GUIDE: flow[], metadata{}';
  return `You are FlowGent, expert for ${platform}.\n${guide}\nRespond with JSON only.`;
}

function buildUserPrompt(userRequest) {
  return `Generate a complete automation workflow for: "${userRequest}"`;
}

function parseGenerationResponse(raw, platform) {
  const cleaned = raw
    .replace(/^```json\n?/i, '').replace(/^```\n?/i, '').replace(/\n?```$/i, '').trim();
  const parsed = JSON.parse(cleaned);
  if (!parsed.workflow) throw new Error('Missing "workflow" key');
  const nodeCount = platform === 'n8n'
    ? (parsed.workflow.nodes?.length ?? 0)
    : (parsed.workflow.flow?.length ?? 0);
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

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_N8N_RESPONSE = JSON.stringify({
  suggestedName: 'new-lead-to-slack',
  description: 'HubSpot new contact → Slack #sales',
  estimatedComplexity: 'simple',
  warnings: [],
  workflow: {
    name: 'New Lead → Slack',
    nodes: [
      { id: 'n1', name: 'HubSpot Trigger', type: 'n8n-nodes-base.hubspotTrigger',
        typeVersion: 1, position: [240, 300], parameters: { event: 'contact.creation' } },
      { id: 'n2', name: 'Send Slack Message', type: 'n8n-nodes-base.slack',
        typeVersion: 2, position: [460, 300], parameters: { channel: '#sales', text: '={{ $json.email }}' } },
    ],
    connections: {
      'HubSpot Trigger': { main: [[{ node: 'Send Slack Message', type: 'main', index: 0 }]] },
    },
    active: false,
    settings: { executionOrder: 'v1' },
  },
});

const MOCK_MAKE_RESPONSE = JSON.stringify({
  suggestedName: 'invoice-processor',
  description: 'Gmail invoice → Sheets → Slack',
  estimatedComplexity: 'moderate',
  warnings: ['Requires Gmail connection'],
  workflow: {
    name: 'Invoice Processor',
    flow: [
      { id: 1, module: 'google-email:TriggerNewEmail', version: 3,
        parameters: { label: 'INBOX' }, mapper: {}, metadata: { designer: { x: 0, y: 0 } } },
      { id: 2, module: 'google-sheets:ActionAddRow', version: 2,
        parameters: {}, mapper: {}, metadata: { designer: { x: 300, y: 0 } } },
    ],
    metadata: { instant: true, version: 1, scenario: { roundtrips: 1, maxErrors: 3, autoCommit: true } },
  },
});

const TMP = path.join(__dirname, 'validate-tmp');

// ─── Test Suites ─────────────────────────────────────────────────────────────

suite('1. Prompt Builder', () => {
  test('buildSystemPrompt(n8n) contains platform name', () => {
    const p = buildSystemPrompt('n8n');
    assert.ok(p.includes('n8n'), 'Should mention n8n');
  });

  test('buildSystemPrompt(make) contains platform name', () => {
    const p = buildSystemPrompt('make');
    assert.ok(p.includes('make'), 'Should mention make');
  });

  test('buildSystemPrompt instructs JSON-only response', () => {
    const p = buildSystemPrompt('n8n');
    assert.ok(p.toLowerCase().includes('json'), 'Should mention JSON');
  });

  test('buildUserPrompt wraps request in quotes', () => {
    const prompt = 'Send daily Slack digest';
    const result = buildUserPrompt(prompt);
    assert.ok(result.includes(`"${prompt}"`), 'Prompt should be quoted');
  });

  test('buildUserPrompt is non-empty string', () => {
    const result = buildUserPrompt('test');
    assert.ok(typeof result === 'string' && result.length > 0);
  });
});

suite('2. Response Parser — n8n', () => {
  test('parses valid n8n JSON response', () => {
    const result = parseGenerationResponse(MOCK_N8N_RESPONSE, 'n8n');
    assert.strictEqual(result.platform, 'n8n');
    assert.strictEqual(result.suggestedName, 'new-lead-to-slack');
  });

  test('counts nodes correctly', () => {
    const result = parseGenerationResponse(MOCK_N8N_RESPONSE, 'n8n');
    assert.strictEqual(result.nodeCount, 2);
  });

  test('complexity is valid enum value', () => {
    const result = parseGenerationResponse(MOCK_N8N_RESPONSE, 'n8n');
    assert.ok(['simple', 'moderate', 'complex'].includes(result.estimatedComplexity));
  });

  test('warnings is an array', () => {
    const result = parseGenerationResponse(MOCK_N8N_RESPONSE, 'n8n');
    assert.ok(Array.isArray(result.warnings));
  });

  test('workflow has nodes array', () => {
    const result = parseGenerationResponse(MOCK_N8N_RESPONSE, 'n8n');
    assert.ok(Array.isArray(result.workflow.nodes));
  });

  test('workflow has connections object', () => {
    const result = parseGenerationResponse(MOCK_N8N_RESPONSE, 'n8n');
    assert.strictEqual(typeof result.workflow.connections, 'object');
  });

  test('strips markdown code fences from response', () => {
    const fenced = '```json\n' + MOCK_N8N_RESPONSE + '\n```';
    const result = parseGenerationResponse(fenced, 'n8n');
    assert.strictEqual(result.platform, 'n8n');
  });
});

suite('3. Response Parser — Make.com', () => {
  test('parses valid Make.com JSON response', () => {
    const result = parseGenerationResponse(MOCK_MAKE_RESPONSE, 'make');
    assert.strictEqual(result.platform, 'make');
    assert.strictEqual(result.suggestedName, 'invoice-processor');
  });

  test('counts flow modules correctly', () => {
    const result = parseGenerationResponse(MOCK_MAKE_RESPONSE, 'make');
    assert.strictEqual(result.nodeCount, 2);
  });

  test('returns warnings array with content', () => {
    const result = parseGenerationResponse(MOCK_MAKE_RESPONSE, 'make');
    assert.ok(result.warnings.length > 0);
    assert.ok(result.warnings[0].includes('Gmail'));
  });

  test('throws on missing workflow key', () => {
    const bad = JSON.stringify({ suggestedName: 'x', description: 'y' });
    assert.throws(() => parseGenerationResponse(bad, 'make'), /workflow/i);
  });

  test('throws on invalid JSON', () => {
    assert.throws(() => parseGenerationResponse('not json at all', 'n8n'), /SyntaxError|JSON/i);
  });
});

suite('4. File Output Utility', () => {
  const result = parseGenerationResponse(MOCK_N8N_RESPONSE, 'n8n');

  test('saves file to disk', () => {
    const p = saveWorkflow(result, TMP);
    assert.ok(fs.existsSync(p), `File should exist at ${p}`);
  });

  test('saved file is valid JSON', () => {
    const p = saveWorkflow(result, TMP);
    const content = JSON.parse(fs.readFileSync(p, 'utf-8'));
    assert.ok(content !== null);
  });

  test('saved file includes _flowgent metadata', () => {
    const p = saveWorkflow(result, TMP);
    const content = JSON.parse(fs.readFileSync(p, 'utf-8'));
    assert.ok(content._flowgent, 'Should have _flowgent block');
    assert.strictEqual(content._flowgent.platform, 'n8n');
    assert.strictEqual(content._flowgent.nodeCount, 2);
  });

  test('saved file includes original workflow nodes', () => {
    const p = saveWorkflow(result, TMP);
    const content = JSON.parse(fs.readFileSync(p, 'utf-8'));
    assert.ok(Array.isArray(content.nodes));
    assert.strictEqual(content.nodes.length, 2);
  });

  test('creates nested output directory if missing', () => {
    const nested = path.join(TMP, 'nested', 'deep');
    saveWorkflow(result, nested);
    assert.ok(fs.existsSync(nested));
  });

  test('filename is sanitized (no spaces or special chars)', () => {
    const messy = { ...result, suggestedName: 'My Weird  Workflow!! 2024' };
    const p = saveWorkflow(messy, TMP);
    const filename = path.basename(p);
    assert.match(filename, /^[a-z0-9-]+\.json$/);
  });
});

suite('5. Filename Sanitizer', () => {
  test('lowercases the name', () => {
    assert.strictEqual(sanitizeFilename('HELLO'), 'hello');
  });
  test('replaces spaces with dashes', () => {
    assert.strictEqual(sanitizeFilename('hello world'), 'hello-world');
  });
  test('removes special characters', () => {
    assert.strictEqual(sanitizeFilename('hello!!world'), 'hello-world');
  });
  test('trims leading/trailing dashes', () => {
    assert.strictEqual(sanitizeFilename('--hello--'), 'hello');
  });
  test('truncates at 64 characters', () => {
    const long = 'a'.repeat(100);
    assert.strictEqual(sanitizeFilename(long).length, 64);
  });
  test('collapses multiple special chars to one dash', () => {
    assert.strictEqual(sanitizeFilename('hello   ---   world'), 'hello-world');
  });
});

suite('6. Example Workflow Files', () => {
  const examplesDir = path.join(__dirname, 'workflows', 'examples');

  test('examples directory exists', () => {
    assert.ok(fs.existsSync(examplesDir), 'workflows/examples/ should exist');
  });

  const files = fs.existsSync(examplesDir) ? fs.readdirSync(examplesDir) : [];

  test('at least 2 example workflows exist', () => {
    assert.ok(files.length >= 2, `Expected ≥2 examples, found ${files.length}`);
  });

  files.forEach((file) => {
    test(`${file} is valid JSON`, () => {
      const content = fs.readFileSync(path.join(examplesDir, file), 'utf-8');
      const parsed = JSON.parse(content);
      assert.ok(parsed._flowgent, `${file} should have _flowgent metadata`);
    });

    test(`${file} has correct platform suffix`, () => {
      assert.ok(
        file.endsWith('.n8n.json') || file.endsWith('.make.json'),
        `${file} should end with .n8n.json or .make.json`
      );
    });
  });
});

// ─── Cleanup ─────────────────────────────────────────────────────────────────
if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });

// ─── Summary ─────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n${'─'.repeat(50)}`);
if (failed === 0) {
  console.log(c.green(c.bold(`  ✓ All ${total} tests passed`)));
} else {
  console.log(c.red(c.bold(`  ✗ ${failed} failed`)) + c.dim(` / ${total} total`));
}
console.log(`${'─'.repeat(50)}\n`);
process.exit(failed > 0 ? 1 : 0);
