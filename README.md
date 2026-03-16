<div align="center">

```
███████╗██╗      ██████╗ ██╗    ██╗ ██████╗ ███████╗███╗   ██╗████████╗
██╔════╝██║     ██╔═══██╗██║    ██║██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
█████╗  ██║     ██║   ██║██║ █╗ ██║██║  ███╗█████╗  ██╔██╗ ██║   ██║   
██╔══╝  ██║     ██║   ██║██║███╗██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   
██║     ███████╗╚██████╔╝╚███╔███╔╝╚██████╔╝███████╗██║ ╚████║   ██║   
╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝  ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   
```

**AI-powered workflow generator for n8n & Make.com**  
*Describe your automation in plain English → get production-ready JSON in seconds*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)
[![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude%20AI-orange)](https://anthropic.com)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED)](docker/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

<br />

[Quick Start](#-quick-start) · [Examples](#-examples) · [CLI Reference](#-cli-reference) · [Docker](#-docker--self-hosted) · [Contributing](#-contributing)

</div>

---

## What is FlowGent?

**FlowGent** is an open-source CLI tool that converts natural language descriptions into complete, import-ready automation workflows for **n8n** and **Make.com** — powered by Claude AI.

Instead of dragging nodes for 30 minutes, you type one sentence:

```bash
flowgent gen "When a new Typeform submission arrives, enrich the lead with Clearbit, 
create a HubSpot contact, and notify the #sales Slack channel"
```

And get a fully-connected, production-ready workflow JSON — ready to import in seconds.

---

## ✨ Features

- 🧠 **Natural language → workflow JSON** — powered by Claude Opus
- ⚡ **n8n & Make.com** — both platforms supported out of the box
- 🎛️ **Interactive CLI** — guided prompts when you omit arguments
- 🐳 **Docker ready** — self-host with a single `docker compose up`
- 📁 **Example library** — copy-paste workflows for common use cases
- ⚠️ **Smart warnings** — flags missing credentials and potential issues
- 🔌 **Node.js SDK** — use as a library in your own projects

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### Install

```bash
# Clone the repo
git clone https://github.com/wronce/flowgent.git
cd flowgent

# Install dependencies
npm install

# Copy env template and add your key
cp .env.example .env
# Edit .env → set ANTHROPIC_API_KEY=your_key_here

# Build
npm run build

# Link globally (optional)
npm link
```

### Generate your first workflow

```bash
# Generate an n8n workflow
flowgent gen "Every day at 9am, fetch top 5 posts from Hacker News and post them to Slack"

# Generate a Make.com scenario
flowgent gen --platform make "When a Stripe payment fails, send a recovery email via Gmail and create a task in Asana"

# Interactive mode (guided)
flowgent interactive
```

---

## 📋 Examples

### Lead enrichment pipeline

```bash
flowgent gen "New Typeform lead → enrich with Clearbit → create HubSpot contact → Slack notification"
```

<details>
<summary>View generated workflow →</summary>

See [`workflows/examples/lead-enrich-pipeline.n8n.json`](workflows/examples/lead-enrich-pipeline.n8n.json)

</details>

---

### AI invoice processor (Make.com)

```bash
flowgent gen --platform make "Watch Gmail for invoices, extract vendor and amount with AI, log to Google Sheets, notify #finance on Slack"
```

<details>
<summary>View generated scenario →</summary>

See [`workflows/examples/invoice-processor.make.json`](workflows/examples/invoice-processor.make.json)

</details>

---

### More prompts to try

| Prompt | Platform |
|--------|----------|
| `"RSS feed → summarize with AI → post to LinkedIn every morning"` | n8n |
| `"GitHub issue created → categorize with AI → assign to team member → Slack thread"` | n8n |
| `"New Airtable row → generate product description with AI → publish to Shopify"` | make |
| `"Every hour check competitor prices → store in Postgres → alert if drop >10%"` | n8n |
| `"Customer emails Zendesk → AI draft reply → human approval → auto-send"` | make |

---

## 🎛️ CLI Reference

```
flowgent <command> [options]

Commands:
  generate, gen    Generate a workflow from a prompt
  interactive, i   Launch interactive guided mode

Options for `generate`:
  -p, --platform <n8n|make>   Target platform (default: n8n)
  -o, --output <path>         Output directory (default: ./output)
  --stdout                    Print JSON to stdout instead of saving
  -v, --verbose               Show detailed generation logs
  -V, --version               Show version number
  -h, --help                  Show help
```

### Examples

```bash
# Save to custom directory
flowgent gen --output ./my-workflows "Weekly report email from Airtable"

# Pipe to another tool
flowgent gen --stdout "Webhook → Slack" | jq '.nodes | length'

# Make.com scenario
flowgent gen --platform make "New Stripe subscription → welcome email → add to Mailchimp"
```

---

## 🐳 Docker / Self-Hosted

### Standalone

```bash
cd docker
docker build -t flowgent ..
docker run --rm -e ANTHROPIC_API_KEY=your_key \
  -v $(pwd)/output:/app/output \
  flowgent gen "Shopify order → pack slip PDF → email customer"
```

### With bundled n8n

```bash
cd docker
cp ../.env.example .env  # Fill in your keys
docker compose --profile with-n8n up -d

# Generate workflow
docker compose run --rm flowgent gen "Your automation here"
# Then open http://localhost:5678 → import the JSON from ./output/
```

---

## 📦 Use as a Library

```typescript
import { WorkflowGenerator } from 'flowgent';

const generator = new WorkflowGenerator(process.env.ANTHROPIC_API_KEY);

const result = await generator.generate({
  platform: 'n8n',
  prompt: 'New GitHub star → tweet thank you → log to Airtable',
});

console.log(result.workflow);   // Ready-to-import n8n JSON
console.log(result.nodeCount);  // e.g. 4
console.log(result.warnings);   // Any issues flagged by AI
```

---

## 📁 Project Structure

```
flowgent/
├── src/
│   ├── cli/
│   │   └── index.ts          # CLI entry point (Commander.js)
│   ├── core/
│   │   ├── generator.ts      # AI generation engine
│   │   └── types.ts          # TypeScript interfaces
│   ├── prompts/
│   │   └── workflow-builder.ts  # Claude system & user prompts
│   ├── utils/
│   │   ├── display.ts        # CLI output formatting
│   │   └── output.ts         # File saving utilities
│   └── index.ts              # Library entry point
├── workflows/
│   └── examples/             # Ready-to-use workflow blueprints
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── tests/
│   └── generator.test.ts
├── docs/
│   ├── PROMPTING_GUIDE.md
│   └── IMPORTING_WORKFLOWS.md
└── README.md
```

---

## 🧪 Running Tests

```bash
npm test

# With coverage
npm test -- --coverage
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
# Fork → clone → branch
git checkout -b feat/your-feature

# Make changes, add tests
npm test

# Submit PR
```

Areas we'd love help with:
- Additional platform support (Zapier, Pipedream, Activepieces)
- More example workflows in `workflows/examples/`
- Improved AI prompts for edge cases
- Web UI

---

## 📄 License

MIT © [Wronce](https://wronce.com)

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://wronce.com">Wronce</a> — Web Studio & Digital Agency, Los Angeles</sub>
</div>
