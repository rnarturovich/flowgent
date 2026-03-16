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
[![Made by Wronce](https://img.shields.io/badge/Made%20by-Wronce.com-black)](https://wronce.com)

<br />

**Created by [Rafael Nikogosian](https://instagram.com/rn.arturovich) · Founder of [Wronce.com](https://wronce.com) · [@rn.arturovich](https://instagram.com/rn.arturovich)**

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

> Built by **[Rafael Nikogosian](https://instagram.com/rn.arturovich)**, Founder of [Wronce.com](https://wronce.com) — a web studio and digital agency based in Los Angeles, specializing in web development, SEO, SaaS products, and AI automation.

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
git clone https://github.com/rnarturovich/flowgent.git
cd flowgent
npm install
cp .env.example .env
npm run build
npm link
```

### Generate your first workflow

```bash
flowgent gen "Every day at 9am, fetch top 5 posts from Hacker News and post them to Slack"
flowgent gen --platform make "When a Stripe payment fails, send a recovery email via Gmail"
flowgent interactive
```

---

## 📋 Examples

| Prompt | Platform |
|--------|----------|
| `"RSS feed → summarize with AI → post to LinkedIn every morning"` | n8n |
| `"GitHub issue created → categorize with AI → assign to team member → Slack thread"` | n8n |
| `"New Airtable row → generate product description with AI → publish to Shopify"` | make |
| `"Every hour check competitor prices → store in Postgres → alert if drop >10%"` | n8n |
| `"Customer emails Zendesk → AI draft reply → human approval → auto-send"` | make |

See [`workflows/examples/`](workflows/examples/) for ready-to-import blueprints.

---

## 🎛️ CLI Reference

```
flowgent <command> [options]

Commands:
  generate, gen    Generate a workflow from a prompt
  interactive, i   Launch interactive guided mode

Options:
  -p, --platform <n8n|make>   Target platform (default: n8n)
  -o, --output <path>         Output directory (default: ./output)
  --stdout                    Print JSON to stdout
  -v, --verbose               Show detailed logs
```

---

## 🐳 Docker / Self-Hosted

```bash
cd docker
docker build -t flowgent ..
docker run --rm -e ANTHROPIC_API_KEY=your_key \
  -v $(pwd)/output:/app/output \
  flowgent gen "Shopify order → email customer"

# With bundled n8n
docker compose --profile with-n8n up -d
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

console.log(result.workflow);  // Ready-to-import JSON
console.log(result.warnings);  // AI-flagged issues
```

---

## 📁 Project Structure

```
flowgent/
├── src/
│   ├── cli/index.ts              # CLI entry point
│   ├── core/generator.ts         # AI generation engine
│   ├── core/types.ts             # TypeScript interfaces
│   ├── prompts/workflow-builder.ts
│   └── utils/display.ts + output.ts
├── workflows/examples/           # Ready-to-use blueprints
├── docker/                       # Dockerfile + compose
├── docs/                         # Guides
└── tests/
```

---

## 🧪 Tests

```bash
npm test
node validate.js   # Zero-dependency validation suite (35 tests)
```

---

## 🤝 Contributing

PRs are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

Areas to contribute:
- Additional platforms (Zapier, Pipedream, Activepieces)
- More example workflows
- Web UI

---

## 📄 License

MIT © [Rafael Nikogosian](https://instagram.com/rn.arturovich)

---

<div align="center">

### Built by [Rafael Nikogosian](https://instagram.com/rn.arturovich)

**Founder & Developer · [Wronce.com](https://wronce.com)**  
Web Studio & Digital Agency · Los Angeles, CA  
AI Automation · SaaS Development · SEO · Web Development

<br />

[![Website](https://img.shields.io/badge/🌐%20Website-wronce.com-000000?style=for-the-badge)](https://wronce.com)
[![Instagram](https://img.shields.io/badge/📸%20Instagram-@rn.arturovich-E4405F?style=for-the-badge)](https://instagram.com/rn.arturovich)
[![GitHub](https://img.shields.io/badge/💻%20GitHub-rnarturovich-181717?style=for-the-badge)](https://github.com/rnarturovich)

<br />

*If FlowGent saves you time, drop a ⭐ — it helps others discover this tool.*

</div>
