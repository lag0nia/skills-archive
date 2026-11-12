#!/usr/bin/env node
import fs from 'node:fs';
import { validationMode } from './lib/validation-mode.mjs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const contentIdentity = (bytes) => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
export function identityField(text, name) {
  const values = [...text.matchAll(new RegExp('^\\*\\*' + name + ':\\*\\*\\s*`?(sha256:[a-f0-9]{64})`?\\s*$', 'gm'))];
  const declarations = [...text.matchAll(new RegExp('^\\*\\*' + name + ':\\*\\*', 'gm'))];
  if (values.length !== 1 || declarations.length !== 1) throw new Error('Requires exactly one valid ' + name + ' identity.');
  return values[0][1];
}
export function executionIdentity(workpackPath) {
  const bytes = fs.readFileSync(workpackPath);
  return { snapshot: identityField(bytes.toString('utf8'), 'Software Design snapshot'), content: contentIdentity(bytes) };
}
export function summaryPath(repository, snapshot) {
  return path.join(repository, 'delivery-evidence', 'executions', snapshot.replace(':', '-'), 'SUMMARY.md');
}
export function checkExecutionRecord(workpackPath, repository, summary = fs.readFileSync(summaryPath(repository, executionIdentity(workpackPath).snapshot), 'utf8')) {
  const current = executionIdentity(workpackPath);
  if (identityField(summary, 'Executed snapshot') !== current.snapshot || identityField(summary, 'Executed workpack content') !== current.content) throw new Error('Workpack changed since execution start; preserve the prior record and reconcile before continuing.');
  const dates = [...summary.matchAll(/^\*\*Execution started:\*\*\s*`([^`]+)`\s*$/gm)];
  if (dates.length !== 1 || !Number.isFinite(Date.parse(dates[0][1]))) throw new Error('Missing or invalid execution-start record.');
  return current;
}
export function validateReady(workpack, softwareDesignSkill) {
  if (!softwareDesignSkill) throw new Error('An explicit --software-design-skill path is required.');
  const result = spawnSync(process.execPath, [path.join(softwareDesignSkill, 'scripts/validate-workpack.mjs'), '--validation-mode', 'execution', '--workpack', workpack], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error('Execution readiness failed:\n' + (result.stderr || result.error || result.stdout));
  // Successful validation may still emit non-blocking notices (for example
  // NON_BLOCKING_PACKAGE_MAINTENANCE); forward them so the caller can report them.
  if (result.stderr) process.stderr.write(result.stderr);
  return result.stdout;
}
export function startExecution({ workpack, repository, softwareDesignSkill, validationMode: requestedMode = "execution" }) {
  if (validationMode(requestedMode) !== "execution") throw new Error("Execution start supports only execution validation.");
  const before = executionIdentity(workpack);
  validateReady(workpack, softwareDesignSkill);
  const after = executionIdentity(workpack);
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Workpack changed during readiness validation.');
  const file = summaryPath(repository, before.snapshot);
  const history = path.join(repository, 'delivery-evidence/executions');
  if (fs.existsSync(history)) for (const entry of fs.readdirSync(history)) {
    const prior = path.join(history, entry, 'SUMMARY.md');
    if (fs.existsSync(prior) && /\*\*Outcome:\*\*\s*`IN_PROGRESS`/.test(fs.readFileSync(prior, 'utf8'))) throw new Error('An interrupted execution exists; check/resume or reconcile its retained record first.');
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const link = path.relative(path.dirname(file), path.resolve(workpack)).split(path.sep).join('/');
  fs.writeFileSync(file, `# Execution Summary\n\n**Workpack:** [WORKPACK.md](${link})\n\n**Executed snapshot:** \`${before.snapshot}\`\n\n**Executed workpack content:** \`${before.content}\`\n\n**Execution started:** \`${new Date().toISOString()}\`\n\n**Outcome:** \`IN_PROGRESS\`\n`, { flag: 'wx' });
  return file;
}
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = {};
    for (let i = 2; i < process.argv.length; i++) {
      const key = process.argv[i];
      if (!['--workpack', '--repository', '--software-design-skill', '--mode', '--validation-mode'].includes(key) || args[key]) throw new Error('Unknown or duplicate argument: ' + key);
      args[key] = process.argv[++i];
    }
    if (!args['--workpack'] || !args['--repository'] || !['start', 'check'].includes(args['--mode'])) throw new Error('Use --mode start|check --workpack <file> --repository <directory> --software-design-skill <directory>; start requires --software-design-skill, and check reruns readiness when it is given.');
    if (Object.hasOwn(args, '--validation-mode') && !args['--validation-mode']) throw new Error('Missing --validation-mode value.');
    if (validationMode(args['--validation-mode']) !== 'execution') throw new Error('Execution records support only --validation-mode execution.');
    if (args['--mode'] === 'start') console.log(startExecution({ workpack: args['--workpack'], repository: args['--repository'], softwareDesignSkill: args['--software-design-skill'] }));
    else {
      // Verify the start identity first: a changed workpack must be reconciled, not revalidated.
      checkExecutionRecord(args['--workpack'], args['--repository']);
      if (args['--software-design-skill']) validateReady(args['--workpack'], args['--software-design-skill']);
      console.log('Execution-start workpack content and snapshot match.' + (args['--software-design-skill'] ? ' Current execution readiness revalidated.' : ''));
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
