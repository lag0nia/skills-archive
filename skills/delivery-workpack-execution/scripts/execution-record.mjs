#!/usr/bin/env node
import fs from 'node:fs';
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
export function validateReady(workpack, planningSkill, softwareDesignSkill) {
  if (!planningSkill || !softwareDesignSkill) throw new Error('Explicit --planning-skill and --software-design-skill paths are required.');
  const result = spawnSync(process.execPath, [path.join(planningSkill, 'scripts/validate-workpack.mjs'), '--workpack', workpack, '--software-design-skill', softwareDesignSkill], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error('Execution readiness failed:\n' + (result.stderr || result.error || result.stdout));
  return result.stdout;
}
export function startExecution({ workpack, repository, planningSkill, softwareDesignSkill }) {
  const before = executionIdentity(workpack);
  validateReady(workpack, planningSkill, softwareDesignSkill);
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
      if (!['--workpack', '--repository', '--planning-skill', '--software-design-skill', '--mode'].includes(key) || args[key]) throw new Error('Unknown or duplicate argument: ' + key);
      args[key] = process.argv[++i];
    }
    if (!args['--workpack'] || !args['--repository'] || !['start', 'check'].includes(args['--mode'])) throw new Error('Use --mode start|check --workpack <file> --repository <directory>; start also requires --planning-skill and --software-design-skill.');
    if (args['--mode'] === 'start') console.log(startExecution({ workpack: args['--workpack'], repository: args['--repository'], planningSkill: args['--planning-skill'], softwareDesignSkill: args['--software-design-skill'] }));
    else { checkExecutionRecord(args['--workpack'], args['--repository']); console.log('Execution-start workpack content and snapshot match.'); }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
