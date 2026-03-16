#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { config } from 'dotenv';
import { WorkflowGenerator } from '../core/generator.js';
import { saveWorkflow, printToStdout } from '../utils/output.js';
import { printBanner, printResult, printError } from '../utils/display.js';
import { Platform } from '../core/types.js';

config();

const program = new Command();

program
  .name('flowgent')
  .description('AI-powered workflow generator for n8n & Make.com')
  .version('1.0.0');

// ─── generate command ───────────────────────────────────────────────────────
program
  .command('generate')
  .alias('gen')
  .description('Generate a workflow from a natural language prompt')
  .option('-p, --platform <platform>', 'Target platform: n8n or make', 'n8n')
  .option('-o, --output <path>', 'Output directory for the JSON file', './output')
  .option('--stdout', 'Print workflow JSON to stdout instead of saving to file')
  .option('-v, --verbose', 'Show detailed logs')
  .argument('[prompt]', 'Natural language description of the automation')
  .action(async (promptArg: string | undefined, options: {
    platform: string;
    output: string;
    stdout: boolean;
    verbose: boolean;
  }) => {
    printBanner();

    // Validate platform
    if (!['n8n', 'make'].includes(options.platform)) {
      printError(`Invalid platform "${options.platform}". Use "n8n" or "make".`);
      process.exit(1);
    }

    // Validate API key
    if (!process.env.ANTHROPIC_API_KEY) {
      printError(
        'ANTHROPIC_API_KEY not found.\nSet it in your .env file or export it in your shell:\n  export ANTHROPIC_API_KEY=your_key_here'
      );
      process.exit(1);
    }

    // If no prompt arg, enter interactive mode
    let prompt = promptArg;
    let platform = options.platform as Platform;

    if (!prompt) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'platform',
          message: 'Which platform?',
          choices: [
            { name: 'n8n  (self-hosted, open-source)', value: 'n8n' },
            { name: 'Make.com  (cloud automation)', value: 'make' },
          ],
          default: 'n8n',
        },
        {
          type: 'input',
          name: 'prompt',
          message: 'Describe your automation:',
          validate: (input: string) =>
            input.trim().length > 10
              ? true
              : 'Please provide a more detailed description (>10 chars)',
        },
      ]);
      prompt = answers.prompt as string;
      platform = answers.platform as Platform;
    }

    const spinner = ora({
      text: chalk.cyan('Generating workflow with Claude AI...'),
      spinner: 'dots12',
      color: 'cyan',
    }).start();

    try {
      const generator = new WorkflowGenerator();
      const result = await generator.generate({
        platform,
        prompt: prompt!,
        verbose: options.verbose,
      });

      spinner.succeed(chalk.green('Workflow generated successfully!'));

      if (options.stdout) {
        printToStdout(result);
      } else {
        const savedPath = saveWorkflow(result, options.output);
        printResult(result, savedPath);
        console.log(
          chalk.dim(
            `  → Import into ${platform === 'n8n' ? 'n8n: Settings → Import Workflow' : 'Make.com: New Scenario → Import Blueprint'}\n`
          )
        );
      }
    } catch (err) {
      spinner.fail(chalk.red('Generation failed'));
      printError(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// ─── interactive command ─────────────────────────────────────────────────────
program
  .command('interactive')
  .alias('i')
  .description('Launch interactive mode (guided prompts)')
  .action(async () => {
    printBanner();
    console.log(chalk.cyan('  Interactive mode — press Ctrl+C to exit\n'));

    if (!process.env.ANTHROPIC_API_KEY) {
      printError('ANTHROPIC_API_KEY not set.');
      process.exit(1);
    }

    while (true) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'platform',
          message: 'Platform:',
          choices: ['n8n', 'make'],
        },
        {
          type: 'input',
          name: 'prompt',
          message: 'Describe your automation (or "exit"):',
          validate: (v: string) => v.trim().length > 0 || 'Cannot be empty',
        },
        {
          type: 'input',
          name: 'output',
          message: 'Output directory:',
          default: './output',
        },
      ]);

      if ((answers.prompt as string).toLowerCase() === 'exit') break;

      const spinner = ora({
        text: chalk.cyan('Generating...'),
        spinner: 'dots12',
        color: 'cyan',
      }).start();

      try {
        const generator = new WorkflowGenerator();
        const result = await generator.generate({
          platform: answers.platform as Platform,
          prompt: answers.prompt as string,
        });
        spinner.succeed(chalk.green('Done!'));
        const savedPath = saveWorkflow(result, answers.output as string);
        printResult(result, savedPath);
      } catch (err) {
        spinner.fail('Failed');
        printError(err instanceof Error ? err.message : String(err));
      }

      console.log(chalk.dim('\n─────────────────────────────────────────\n'));
    }
  });

program.parse(process.argv);
