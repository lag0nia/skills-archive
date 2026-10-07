#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const skillPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "SKILL.md");
const evidenceReferencePath = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "references", "delivery-evidence.md");
const evidenceTemplateRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "assets", "templates", "delivery-evidence");

test("execution consumes the current Software Design handoff and canonical source lanes", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /build\/workflow\/handoffs\//);
  assert.match(skill, /build\/units\//);
  assert.match(skill, /build\/repositories\//);
  assert.match(skill, /`CONS-xxx` constraints/);
  assert.match(skill, /`SEL-xxx` selections/);
  assert.match(skill, /`VA-xxx` capabilities/);
  assert.match(skill, /`system-model\/` Domains, System Responsibilities, flows, and contracts/);
});

test("execution revalidates the workpack and current Stage 9 snapshot before changes", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /scripts\/validate-workpack\.mjs/);
  assert.match(skill, /--software-design-skill <active-software-design-skill-directory>/);
  assert.match(skill, /complete current Stage 9 readiness validation and Build Unit reconciliation/);
  assert.match(skill, /not merely compare two copied strings or pass a snapshot-only check/);
  assert.match(skill, /Stop if the handoff is stale or no longer ready/);
  assert.match(skill, /require an exact match with its current `\*\*Snapshot ID:\*\*`/);
});

test("execution consumes exact Stage 9 obligations and repository agent guidance", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /exact `INPUT-NNN`, `INT-NNN`, `PSEAM-NNN`, and structured `INV\/SEC-xxx\.VO-NNN` obligation coverage/);
  assert.match(skill, /every mapped `INPUT-NNN` acquisition, production, bootstrap, or lifecycle obligation/);
  assert.match(skill, /every mapped `INT-NNN` \/ `IFACE-xxx\.ACT-NNN` proof obligation/);
  assert.match(skill, /every `PSEAM-NNN` handling\/proof route/);
  assert.match(skill, /Preserve the exact evidence classes required by Stage 9/);
  assert.match(skill, /For `high`-risk interactions, collect the mapped positive, rejection\/denial, and failure\/recovery evidence/);
  assert.match(skill, /do not impose that three-case matrix on ordinary-risk interactions/);
  assert.match(skill, /structured `INV\/SEC-xxx\.VO-NNN` obligation coverage/);
  assert.match(skill, /tracked repository `assurance\/coverage\.yaml`/);
  assert.match(skill, /leave the manifest\/result ready for the blueprint-wide assurance report/);
  assert.match(skill, /derived `agent-guidance\.md`/);
  assert.match(skill, /repository-root `AGENTS\.md`/);
});

test("execution completes bounded environment preflight and consolidates failures before source edits", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /complete `Execution Environment Preflight`/);
  for (const category of ["disk capacity", "toolchains", "local immutable artifacts\/images", "services\/ports", "browsers\/devices", "external access"]) {
    assert.match(skill, new RegExp(category));
  }
  assert.match(skill, /Complete every safe independent check even when another fails/);
  assert.match(skill, /Group failures by root cause and report them together/);
  assert.match(skill, /workpack missing this required section needs a bounded Delivery Planning correction before source edits/);
});

test("execution does not substitute producer-only checks for consumer fitness", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /real consumer seam when `consumer-fitness` is claimed/);
  assert.match(skill, /Producer-local tests, mocks, an internal method, a health endpoint, a contract declaration, or file existence alone cannot satisfy/);
});


test("execution preserves later-lifecycle gate prohibitions and reports unresolved gates", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /Confirm .* every `LGATE-NNN`/);
  assert.match(skill, /Treat every unsatisfied `LGATE-NNN` as a hard prohibition/);
  assert.match(skill, /must not perform or claim the guarded later-lifecycle outcome/);
  assert.match(skill, /every unsatisfied `LGATE-NNN`, its prohibited action or claim/);
});

test("execution remediates recoverable command failures before stopping", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /Before the first target-repository verification command, read and activate every exact runtime or toolchain pin/);
  assert.match(skill, /continue in the same execution turn; do not stop or return control unless the pinned toolchain is unavailable or verification still fails after rerunning under it/);
  assert.match(skill, /nonzero required command as diagnostic evidence, not automatically as a blocker/);
  assert.match(skill, /continue automatically when it passes/);
  assert.match(skill, /still cannot run or pass after applicable safe, scope-preserving remediation/);
  assert.match(skill, /exact runtime or toolchain pins/);
});

test("execution preserves the bounded compatibility preflight and affected-slice isolation", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.doesNotMatch(skill, /delivery-readiness-compatibility-v\d/);
  assert.match(skill, /reconstruct the exact frozen inventory recorded by Stage 9/);
  assert.match(skill, /Run every safe independent probe even when another fails/);
  assert.match(skill, /Group all failures by canonical root cause/);
  assert.match(skill, /require zero new blockers/);
  assert.match(skill, /shipped export, built entrypoint, public route, artifact reader, application mount, or operator command/);
  assert.match(skill, /candidate-fixture or current-consumer preflight/);
  assert.match(skill, /contract-placement and fan-out classification/);
  assert.match(skill, /affected-slice disposition/);
  assert.match(skill, /Ready for Stage 9 refresh/);
  assert.match(skill, /Still blocked/);
});

test("execution enforces the bounded physical-realizability anti-backtracking contract", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /complete Physical Realizability Closure/);
  assert.match(skill, /Target Build Units and the handoff writable subset/);
  assert.match(skill, /protected changed interfaces, mechanically known direct consumers, required effectful commands, and directly affected implementation surfaces/);
  assert.match(skill, /concrete import, manifest, lock, generator, generated output, fixture, test, verifier, command-call, or exact-identity edge/);
  assert.match(skill, /Do not expand through speculation or indirect product relationships/);
  assert.match(skill, /protected `implemented-evolution` requires the recorded focused candidate to reach the real existing consumer/);
  assert.match(skill, /dependency\/manifest\/lockfile, generator\/generated output, identity\/freshness\/receipt verifier/);
  assert.match(skill, /build\/deploy\/regenerate\/migrate\/cross-repository command effect/);
  assert.match(skill, /must not silently start another expanding implementation loop/);
});

test("execution materializes one snapshot-scoped evidence summary and typed receipts", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  const reference = fs.readFileSync(evidenceReferencePath, "utf8");
  assert.match(skill, /## Completion Evidence Layout/);
  assert.match(skill, /Record every workpack AC and VE exactly once in `SUMMARY\.md`/);
  assert.match(skill, /Do not continue a repository-global VE number sequence or create one Markdown file per VE/);
  assert.match(skill, /New publication and consumer-install receipts use the current unversioned schemas/);
  assert.match(skill, /validate-delivery-evidence\.mjs/);
  assert.match(reference, /sha256-<full-64-character-digest>/);
  assert.match(reference, /Neither proves behavioral compatibility/);
  for (const name of [
    "README.md",
    "IMPLEMENTATION-DELIVERY-REPORT.md",
    "SUMMARY.md",
    "producer-publication-receipt.json",
    "consumer-install-receipt.json",
  ]) {
    assert.ok(fs.existsSync(path.join(evidenceTemplateRoot, name)), "missing evidence template " + name);
  }
});

test("execution does not fabricate completion evidence when implementation stops or has no impact", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  const reference = fs.readFileSync(evidenceReferencePath, "utf8");
  assert.match(skill, /If execution stops, leave the prior completion evidence unchanged/);
  assert.match(skill, /no-implementation-impact synchronization or receipt-only lifecycle action does not create an execution directory/);
  assert.match(reference, /do not create a `COMPLETE` summary/);
  assert.match(reference, /do not fabricate an execution summary/);
});

test("execution activation and continuation are runtime-neutral", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.doesNotMatch(skill, /\/goal|\bCodex\b|\bHermes\b/);
  assert.match(skill, /activation does not depend on a particular command, launcher, or automatic skill selection/);
  assert.match(skill, /## Host Goal Or Continuation Loop/);
  assert.match(skill, /It is not a scheduler, loop, runner, or acceptance engine/);
  assert.match(skill, /do not invent command names, APIs, or loop state/);
  assert.match(skill, /Mark the host goal complete only when `Completion` is satisfied/);
  assert.match(skill, /never transfer acceptance ownership away from the main agent/);
});
