# Exact prompts

Each block is the complete first message a fresh agent received, copied from its transcript. `$S` abbreviates the session scratchpad `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad`; nothing else is changed. No agent received any other instruction, except where `results.md` says so.

## T0 — answer key, prepared before any guide existed

````text
You are preparing an evaluation answer key for a design-documentation exercise. You work alone; nobody will answer questions.

Source (read only; do not modify anything): the technical design package at
$S/eval/t0/bitrise21/loan-system/design/technical-design
It describes a Bitcoin-backed USDC one-loan system: an architecture record (system-model/architecture.md), five domains (system-model/domains/<slug>/domain.md with responsibilities/), flows and lifecycle (system-model/behavior/), contracts (system-model/contracts/), build/ and ui-ux/ records, and tickets. Read whatever you need inside that directory only.

Someone else will later write a reader-facing explanation of this system: one architecture guide and one guide for each of the five domains (Loan Terms And Commitments; Bitcoin Authorization And Recovery; Base USDC Settlement And Funding; Base Observation And Fallback Review; Participant Access And Loan Operations), printed as PDFs. You will not see that work. Your job is to define, from the exact technical owners, what those guides must preserve and how a reader's understanding will be checked.

Write one Markdown file: $S/eval/expectations/expectations.md containing:

1. For each of the six guides, 8 to 15 must-preserve facts. Each fact: a one-sentence statement in plain words, the exact owning file path(s) and section heading(s), and which misunderstanding it prevents. Include conditions and limits exactly as the owners state them.
2. Specifically establish, with sources, what the owners say about each of these distinctions (some may belong to several guides):
   a. authentication (signing in) versus authority to sign or authorize transactions;
   b. application status versus raw on-chain transfers versus contract facts;
   c. a Base-side refund versus a confirmed Bitcoin recovery;
   d. the fallback path: its exact prerequisites, the independent checks, any required prior commitment, and the activation conditions;
   e. publication versus broadcast versus confirmation of a transaction;
   f. who controls funding (the lender's control);
   g. the separate claims of verification, local demonstration, deployment and production readiness;
   h. currently unresolved or conflicting items, in particular anything about approval, about package count, and about fee selection: what each source says and what remains undecided.
3. Reader comprehension questions: for each of the six guides, 6 to 8 neutral questions a newcomer should be able to answer after reading only that guide. Neutral means the question does not contain or hint at its answer and does not use identifiers. For each question give the expected answer, the source, and what would count as a wrong or dangerously simplified answer.
4. Criteria a reviewer should use to judge whether a guide preserved the meaning of the owners (including what kinds of omission or simplification count as defects).

Report facts only as the sources state them; where sources conflict or are silent, say so instead of resolving it. Do not invent requirements. When done, reply with the file path and a short summary of the conflicts you found.
````

## T1 — full authoring, ordinary request (frozen skill v1)

````text
Use the Software Design skill at $S/frozen-skill/software-design (start with its SKILL.md and follow it). Use only this copy of the skill.

Our loan system's design package is at $S/eval/t1/bitrise21/loan-system/design/technical-design. It doesn't have a System Guide yet. Please add one: I want to read and share how the whole system and each of its domains work, as PDFs. Export the architecture guide, each domain guide, and the combined guide to $S/eval/t1-pdf.

This is a disposable copy, so edit anything inside that package as needed, but don't change anything outside it apart from writing the PDFs. I won't be available to answer questions while you work: treat this message as my approval for the change, and list in your final reply anything you would have asked me, anything you could not resolve, and what you checked.
````

## T2 — independent repeat: architecture and the observation/fallback domain (frozen skill v1)

````text
Use the Software Design skill at $S/frozen-skill/software-design (start with its SKILL.md and follow it). Use only this copy of the skill.

Our loan system's design package is at $S/eval/t2/bitrise21/loan-system/design/technical-design. Reviewers need to understand the architecture and the Base Observation And Fallback Review domain. Please add those to a System Guide for the package and export their PDFs to $S/eval/t2-pdf.

This is a disposable copy, so edit anything inside that package as needed, but don't change anything outside it apart from writing the PDFs. I won't be available to answer questions while you work: treat this message as my approval for the change, and list in your final reply anything you would have asked me, anything you could not resolve, and what you checked.
````

## T3 — reader, T2 Base Observation And Fallback Review PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t2-pdf/bitcoin-backed-usdc-one-loan-system-base-observation-and-fallback-review.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. At what point can an event seen on Base move a loan forward or start a Bitcoin action?
2. How many data sources must work before a Base event is trusted, and how does that compare with Bitcoin evidence?
3. What does the application show, and what does it allow, when both Base providers fail or disagree?
4. What can a staff operator do if they believe an observed fact is wrong?
5. What must already be true when a loan is created for the independent fallback service ever to help that loan?
6. What lets the fallback service release its secret, and what does the service check on its own?
7. After the fallback secret is published, what still has to happen before the borrower has the Bitcoin back?
8. If the fallback service is unreachable or never publishes, what remains true for each party?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T3 — reader, T2 architecture PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t2-pdf/bitcoin-backed-usdc-one-loan-system-architecture.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. Which part of the system has the final word on whether the Bitcoin collateral has moved, and which has the final word on whether USDC has moved?
2. What can the company operating the product do with a borrower's Bitcoin collateral?
3. What happens to loans in progress during a full outage of the hosting provider, and what happens when service returns?
4. What does this design version set out to deliver, and which later stages does it explicitly not claim?
5. When a borrower repays in full and on time but the lender never collects, what can happen to the USDC and to the Bitcoin?
6. Which points does the design itself record as unresolved, and how does it treat them?
7. How must a security threat be described in this design, and why is checking each credential on its own not enough?
8. How does every part of the system know it is dealing with the same loan, and what does that shared reference not do?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T3 — reader, T1 architecture PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t1-pdf-final/bitcoin-backed-usdc-one-loan-system-architecture.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. Which part of the system has the final word on whether the Bitcoin collateral has moved, and which has the final word on whether USDC has moved?
2. What can the company operating the product do with a borrower's Bitcoin collateral?
3. What happens to loans in progress during a full outage of the hosting provider, and what happens when service returns?
4. What does this design version set out to deliver, and which later stages does it explicitly not claim?
5. When a borrower repays in full and on time but the lender never collects, what can happen to the USDC and to the Bitcoin?
6. Which points does the design itself record as unresolved, and how does it treat them?
7. How must a security threat be described in this design, and why is checking each credential on its own not enough?
8. How does every part of the system know it is dealing with the same loan, and what does that shared reference not do?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T3 — reader, T1 Loan Terms And Commitments PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t1-pdf-final/bitcoin-backed-usdc-one-loan-system-loan-terms-and-commitments.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. What does a lender commit to by publishing an offer, and what is decided later?
2. What does a borrower have at the moment an offer is reserved?
3. What must exist before the final agreement can be committed, and what exact event commits it?
4. What happens to approvals already given if a destination is edited before the agreement is committed?
5. How is the description of a single loan kept apart from the description of the environment it runs in, and why?
6. Under what conditions can a participant's payment wallet become an address that receives loan money?
7. After a reservation is cancelled, how can that offer be used again, and what carries over?
8. What does it prove when an artifact carries the correct loan identity?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T3 — reader, T1 Bitcoin Authorization And Recovery PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t1-pdf-final/bitcoin-backed-usdc-one-loan-system-bitcoin-authorization-and-recovery.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. How is staged collateral different from active collateral, and what does each permit?
2. Which transactions are prepared and signed before the lender funds, and which only afterward?
3. After the borrower has disclosed their secret and received the USDC, but the Bitcoin activation has not yet confirmed, what is the loan's status and what risk exists?
4. How does the borrower's Bitcoin come back after normal repayment, and what is different when the independent fallback is used instead?
5. If neither recovery secret ever becomes available, which time-based routes exist, and how is a clash between them settled?
6. What confirmations does a participant give when disclosing their secret on Base, and what does each one allow?
7. How is the fee chosen for a transaction that was signed in advance, and what remains unsettled?
8. What happens if a participant forgets their vault password?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T3 — reader, T1 Base USDC Settlement And Funding PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t1-pdf-final/bitcoin-backed-usdc-one-loan-system-base-usdc-settlement-and-funding.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. Who decides whether and how a loan's principal is funded, and what may the product do on that party's behalf?
2. When is a loan funded, and what does a USDC balance at the funding address mean before then?
3. What happens to the principal if the borrower never completes acceptance?
4. What exactly counts as a valid repayment?
5. How long does the lender have to collect a repayment, and what follows if that time passes?
6. What control does the borrower have over where an uncollected repayment is returned?
7. What does the return of an uncollected repayment on Base do for the borrower's Bitcoin collateral?
8. Who can change the main loan contract, and what does that mean for loans already running?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T3 — reader, T1 Base Observation And Fallback Review PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t1-pdf-final/bitcoin-backed-usdc-one-loan-system-base-observation-and-fallback-review.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. At what point can an event seen on Base move a loan forward or start a Bitcoin action?
2. How many data sources must work before a Base event is trusted, and how does that compare with Bitcoin evidence?
3. What does the application show, and what does it allow, when both Base providers fail or disagree?
4. What can a staff operator do if they believe an observed fact is wrong?
5. What must already be true when a loan is created for the independent fallback service ever to help that loan?
6. What lets the fallback service release its secret, and what does the service check on its own?
7. After the fallback secret is published, what still has to happen before the borrower has the Bitcoin back?
8. If the fallback service is unreachable or never publishes, what remains true for each party?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T3 — reader, T1 Participant Access And Loan Operations PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t1-pdf-final/bitcoin-backed-usdc-one-loan-system-participant-access-and-loan-operations.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. What does signing in to the product give a participant?
2. What additional checks apply before especially sensitive actions?
3. May the same person act as borrower and lender?
4. How does the product hand a signing task to the Vault, and what does the Vault do before signing?
5. If a participant's browser loses its connection right after they submit an action, how does the system avoid doing the action twice?
6. What does a "completed" operation in the workspace tell a participant about the blockchain?
7. What is the local demonstration, and what does a successful demo run not prove?
8. What can a company staff operator do and not do?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T1 helper — re-review of the architecture guide (written and launched by the T1 agent; its report arrived after T1 handed off)

````text
You are a read-only fidelity reviewer. Do NOT edit, create or delete any file. Do NOT read anything under $S/eval/ except the design package named below (in particular never open any expectations, questions, answers or grading files).

Package (PKG): $S/eval/t1/bitrise21/loan-system/design/technical-design

Guide under review: PKG/guide/architecture.md — a reader-facing explanation of the whole system. It deliberately contains no record IDs; it must faithfully restate its owners (PKG/system-model/architecture.md plus the records it links or paraphrases: system-model/contracts/{interfaces,states,invariants,scope}, system-model/behavior/flows, build/records/selections, system-model/domains/*/responsibilities). Rules the guide must follow: restate owners faithfully including their conditions; never resolve a conflict between records (state it as open); no overclaims; label illustrative cases.

Check every factual sentence of the guide against the owning records. Focus especially on: the lede; the roles of operators and the opener; the S/X/Y secret descriptions; the finality and confirmation rules; the funding window and 67-hour/19-hour margins; package counts and who signs what; the reservation/infraction rules; refunds and their recipients; the lender-silence fallback and the T/B timelock routes; backups and the Cloudflare outage boundary; the local demo fail-closed rule; upgrade governance and pause; the open conflicts and open discrepancies sections (are they stated fairly and are both sides correct?); the excluded / deferred / bounded split (compare with the `status:` frontmatter of each scope record).

Report ONLY concrete problems: for each, quote the guide sentence (short), say what is wrong, and cite the owning file path and line(s) with the correct statement. Distinguish "factual error / overclaim / resolved conflict" from "minor wording". If something is fine, do not list it. Keep the report under 700 words. Deliver it via SubagentHandback.
````

## T1 helper — re-review of the participant guide (written and launched by the T1 agent; its report arrived after T1 handed off)

````text
You are a read-only fidelity reviewer. Do NOT edit, create or delete any file. Do NOT read anything under $S/eval/ except the design package named below (in particular never open any expectations, questions, answers or grading files).

Package (PKG): $S/eval/t1/bitrise21/loan-system/design/technical-design

Guide under review: PKG/guide/domains/participant-access-and-loan-operations.md — a reader-facing explanation of one domain. It deliberately contains no record IDs; it must faithfully restate its owners: PKG/system-model/domains/participant-access-and-loan-operations/domain.md and its responsibilities (sr-010, sr-011, sr-012), plus the contracts, states, invariants, security, scope and flow records those link, and build/records/selections (e.g. sel-028, sel-029, sel-030) and build/records/constraints. Rules the guide must follow: restate owners faithfully including their conditions; never resolve a conflict between records (state it as open); no overclaims; label illustrative cases.

Check every factual sentence against the owning records. Focus especially on: sessions, reauthentication and TOTP rules; Vault password replacement; the Vault's dependency rules; access error behavior (401/403/404); workforce operator boundary and permissions; handoffs; the outbox/retry rules; Vault payment accounts, payment intents, signing/rebroadcast rules and the 0/15/60/180-second reconciliation schedule and when an account is blocked; the local demonstration and its fail-closed rule; reservation timers and the 72-hour stuck-prefund rule; backups (hourly copies, 2h/6h/24h thresholds); notifications; Cloudflare outage and monitoring; authority boundaries; the deferred / bounded items (compare with the `status:` frontmatter of PKG/system-model/contracts/scope/*.md).

Report ONLY concrete problems: for each, quote the guide sentence (short), say what is wrong, and cite the owning file path and line(s) with the correct statement. Distinguish "factual error / overclaim / resolved conflict" from "minor wording". If something is fine, do not list it. Keep the report under 700 words. Deliver it via SubagentHandback.
````

## T4 — key-based review A (architecture, loan terms, participant)

````text
You are reviewing reader-facing documentation for semantic fidelity. Work alone and change nothing.

A design package is at $S/eval/snap-t1/bitrise21/loan-system/design/technical-design. Its guide/ directory holds a System Guide written for readers: review guide/architecture.md, guide/domains/loan-terms-and-commitments.md and guide/domains/participant-access-and-loan-operations.md. Everything else in the package (system-model/, build/, ui-ux/, tickets) is the technical source of truth those guides must restate faithfully. The guides were produced by migrating narrative sections out of system-model/architecture.md and the domain records; an untouched copy of the package from before that migration is at $S/eval/pre/bitrise21/loan-system/design/technical-design, so you can see what the narrative sections said originally.

An answer key prepared independently from the technical records, before the guides were written, is at $S/eval/expectations/expectations.md. Use its part 4 as the review criteria, and its parts 1 and 2 as a checklist of facts and distinctions that must survive. Do not assume the key is complete or correct: verify against the records yourself.

For each guide you review:
1. Check every substantive claim, condition, value, and attribution of a choice against its owner in the package. Report each defect with: the guide sentence (quoted), the owner file and section (quoted), what is wrong (omitted condition, changed meaning, merged distinction, invented fact, unresolved conflict presented as settled, wrong value), and its severity under part 4 of the key.
2. Check whether each key fact and distinction applicable to that guide is present and correct; list the ones missing.
3. Check that anything the migration removed from the technical records (compare with the untouched copy) still has a technical owner or was deliberately moved; list any fact that now exists only in a guide or nowhere.
4. Give a verdict per guide under the key's pass rule.

Write your full findings to $S/eval/responses/t4-review-a.md and reply with a short summary.
````

## T4 — key-based review B (Bitcoin, settlement, observation)

````text
You are reviewing reader-facing documentation for semantic fidelity. Work alone and change nothing.

A design package is at $S/eval/snap-t1/bitrise21/loan-system/design/technical-design. Its guide/ directory holds a System Guide written for readers: review guide/domains/bitcoin-authorization-and-recovery.md, guide/domains/base-usdc-settlement-and-funding.md and guide/domains/base-observation-and-fallback-review.md. Everything else in the package (system-model/, build/, ui-ux/, tickets) is the technical source of truth those guides must restate faithfully. The guides were produced by migrating narrative sections out of system-model/architecture.md and the domain records; an untouched copy of the package from before that migration is at $S/eval/pre/bitrise21/loan-system/design/technical-design, so you can see what the narrative sections said originally.

An answer key prepared independently from the technical records, before the guides were written, is at $S/eval/expectations/expectations.md. Use its part 4 as the review criteria, and its parts 1 and 2 as a checklist of facts and distinctions that must survive. Do not assume the key is complete or correct: verify against the records yourself.

For each guide you review:
1. Check every substantive claim, condition, value, and attribution of a choice against its owner in the package. Report each defect with: the guide sentence (quoted), the owner file and section (quoted), what is wrong (omitted condition, changed meaning, merged distinction, invented fact, unresolved conflict presented as settled, wrong value), and its severity under part 4 of the key.
2. Check whether each key fact and distinction applicable to that guide is present and correct; list the ones missing.
3. Check that anything the migration removed from the technical records (compare with the untouched copy) still has a technical owner or was deliberately moved; list any fact that now exists only in a guide or nowhere.
4. Give a verdict per guide under the key's pass rule.

Write your full findings to $S/eval/responses/t4-review-b.md and reply with a short summary.
````

## T5 — maintenance: hypothetical 12-hour reservation (frozen skill v1)

````text
Use the Software Design skill at $S/frozen-skill/software-design (start with its SKILL.md and follow it). Use only this copy of the skill.

Our loan system's design package is at $S/eval/t5/bitrise21/loan-system/design/technical-design, and its System Guide PDFs are in $S/eval/t5-pdf.

For this exercise only, here is a hypothetical change (it is not a real product decision): I've decided the borrower's offer reservation should last 12 hours instead of 24. Nothing else changes. Please record it in the design package and bring the PDFs up to date.

This is a disposable copy, so edit anything inside that package as needed, but don't change anything outside it apart from the PDFs. I won't be available to answer questions while you work: treat this message as my approval for the change, and list in your final reply what you changed, anything you would have asked me, anything you could not resolve, and what you checked.
````

## T6 — full authoring rerun after the first revision (frozen skill v2; stopped before it changed anything)

````text
Use the Software Design skill at $S/frozen-skill-v2/software-design (start with its SKILL.md and follow it). Use only this copy of the skill.

Our loan system's design package is at $S/eval/t6/bitrise21/loan-system/design/technical-design. It doesn't have a System Guide yet. Please add one: I want to read and share how the whole system and each of its domains work, as PDFs. Export the architecture guide, each domain guide, and the combined guide to $S/eval/t6-pdf.

This is a disposable copy, so edit anything inside that package as needed, but don't change anything outside it apart from writing the PDFs. I won't be available to answer questions while you work: treat this message as my approval for the change, and list in your final reply anything you would have asked me, anything you could not resolve, and what you checked.
````

## T7 — full authoring rerun with the final guidance (frozen skill v3)

````text
Use the Software Design skill at $S/frozen-skill-v3/software-design (start with its SKILL.md and follow it). Use only this copy of the skill.

Our loan system's design package is at $S/eval/t7/bitrise21/loan-system/design/technical-design. It doesn't have a System Guide yet. Please add one: I want to read and share how the whole system and each of its domains work, as PDFs. Export the architecture guide, each domain guide, and the combined guide to $S/eval/t7-pdf.

This is a disposable copy, so edit anything inside that package as needed, but don't change anything outside it apart from writing the PDFs. I won't be available to answer questions while you work: treat this message as my approval for the change, and list in your final reply anything you would have asked me, anything you could not resolve, and what you checked.
````

## T7 reader — architecture guide PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t7-pdf/bitcoin-backed-usdc-one-loan-system-architecture.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. Which part of the system has the final word on whether the Bitcoin collateral has moved, and which has the final word on whether USDC has moved?
2. What can the company operating the product do with a borrower's Bitcoin collateral?
3. What happens to loans in progress during a full outage of the hosting provider, and what happens when service returns?
4. What does this design version set out to deliver, and which later stages does it explicitly not claim?
5. When a borrower repays in full and on time but the lender never collects, what can happen to the USDC and to the Bitcoin?
6. Which points does the design itself record as unresolved, and how does it treat them?
7. How must a security threat be described in this design, and why is checking each credential on its own not enough?
8. How does every part of the system know it is dealing with the same loan, and what does that shared reference not do?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T7 reader — Loan Terms And Commitments PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t7-pdf/bitcoin-backed-usdc-one-loan-system-loan-terms-and-commitments.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. What does a lender commit to by publishing an offer, and what is decided later?
2. What does a borrower have at the moment an offer is reserved?
3. What must exist before the final agreement can be committed, and what exact event commits it?
4. What happens to approvals already given if a destination is edited before the agreement is committed?
5. How is the description of a single loan kept apart from the description of the environment it runs in, and why?
6. Under what conditions can a participant's payment wallet become an address that receives loan money?
7. After a reservation is cancelled, how can that offer be used again, and what carries over?
8. What does it prove when an artifact carries the correct loan identity?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T7 reader — Bitcoin Authorization And Recovery PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t7-pdf/bitcoin-backed-usdc-one-loan-system-bitcoin-authorization-and-recovery.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. How is staged collateral different from active collateral, and what does each permit?
2. Which transactions are prepared and signed before the lender funds, and which only afterward?
3. After the borrower has disclosed their secret and received the USDC, but the Bitcoin activation has not yet confirmed, what is the loan's status and what risk exists?
4. How does the borrower's Bitcoin come back after normal repayment, and what is different when the independent fallback is used instead?
5. If neither recovery secret ever becomes available, which time-based routes exist, and how is a clash between them settled?
6. What confirmations does a participant give when disclosing their secret on Base, and what does each one allow?
7. How is the fee chosen for a transaction that was signed in advance, and what remains unsettled?
8. What happens if a participant forgets their vault password?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T7 reader — Base USDC Settlement And Funding PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t7-pdf/bitcoin-backed-usdc-one-loan-system-base-usdc-settlement-and-funding.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. Who decides whether and how a loan's principal is funded, and what may the product do on that party's behalf?
2. When is a loan funded, and what does a USDC balance at the funding address mean before then?
3. What happens to the principal if the borrower never completes acceptance?
4. What exactly counts as a valid repayment?
5. How long does the lender have to collect a repayment, and what follows if that time passes?
6. What control does the borrower have over where an uncollected repayment is returned?
7. What does the return of an uncollected repayment on Base do for the borrower's Bitcoin collateral?
8. Who can change the main loan contract, and what does that mean for loans already running?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T7 reader — Base Observation And Fallback Review PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t7-pdf/bitcoin-backed-usdc-one-loan-system-base-observation-and-fallback-review.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. At what point can an event seen on Base move a loan forward or start a Bitcoin action?
2. How many data sources must work before a Base event is trusted, and how does that compare with Bitcoin evidence?
3. What does the application show, and what does it allow, when both Base providers fail or disagree?
4. What can a staff operator do if they believe an observed fact is wrong?
5. What must already be true when a loan is created for the independent fallback service ever to help that loan?
6. What lets the fallback service release its secret, and what does the service check on its own?
7. After the fallback secret is published, what still has to happen before the borrower has the Bitcoin back?
8. If the fallback service is unreachable or never publishes, what remains true for each party?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T7 reader — Participant Access And Loan Operations PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t7-pdf/bitcoin-backed-usdc-one-loan-system-participant-access-and-loan-operations.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. What does signing in to the product give a participant?
2. What additional checks apply before especially sensitive actions?
3. May the same person act as borrower and lender?
4. How does the product hand a signing task to the Vault, and what does the Vault do before signing?
5. If a participant's browser loses its connection right after they submit an action, how does the system avoid doing the action twice?
6. What does a "completed" operation in the workspace tell a participant about the blockchain?
7. What is the local demonstration, and what does a successful demo run not prove?
8. What can a company staff operator do and not do?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T7 — key-based review A (architecture, loan terms, participant)

````text
You are reviewing reader-facing documentation for semantic fidelity. Work alone and change nothing.

A design package is at $S/eval/snap-t7/bitrise21/loan-system/design/technical-design. Its guide/ directory holds a System Guide written for readers: review guide/architecture.md, guide/domains/loan-terms-and-commitments.md and guide/domains/participant-access-and-loan-operations.md. Everything else in the package (system-model/, build/, ui-ux/, tickets) is the technical source of truth those guides must restate faithfully. The guides were produced by migrating narrative sections out of system-model/architecture.md and the domain records; an untouched copy of the package from before that migration is at $S/eval/pre/bitrise21/loan-system/design/technical-design, so you can see what the narrative sections said originally.

An answer key prepared independently from the technical records, before the guides were written, is at $S/eval/expectations/expectations.md. Use its part 4 as the review criteria, and its parts 1 and 2 as a checklist of facts and distinctions that must survive. Do not assume the key is complete or correct: verify against the records yourself.

For each guide you review:
1. Check every substantive claim, condition, value, and attribution of a choice against its owner in the package. Report each defect with: the guide sentence (quoted), the owner file and section (quoted), what is wrong (omitted condition, changed meaning, merged distinction, invented fact, unresolved conflict presented as settled, wrong value), and its severity under part 4 of the key.
2. Check whether each key fact and distinction applicable to that guide is present and correct; list the ones missing.
3. Check that anything the migration removed from the technical records (compare with the untouched copy) still has a technical owner or was deliberately moved; list any fact that now exists only in a guide or nowhere.
4. Give a verdict per guide under the key's pass rule.

Write your full findings to $S/eval/responses/t7-review-a.md and reply with a short summary.
````

## T7 — key-based review B (Bitcoin, settlement, observation)

````text
You are reviewing reader-facing documentation for semantic fidelity. Work alone and change nothing.

A design package is at $S/eval/snap-t7/bitrise21/loan-system/design/technical-design. Its guide/ directory holds a System Guide written for readers: review guide/domains/bitcoin-authorization-and-recovery.md, guide/domains/base-usdc-settlement-and-funding.md and guide/domains/base-observation-and-fallback-review.md. Everything else in the package (system-model/, build/, ui-ux/, tickets) is the technical source of truth those guides must restate faithfully. The guides were produced by migrating narrative sections out of system-model/architecture.md and the domain records; an untouched copy of the package from before that migration is at $S/eval/pre/bitrise21/loan-system/design/technical-design, so you can see what the narrative sections said originally.

An answer key prepared independently from the technical records, before the guides were written, is at $S/eval/expectations/expectations.md. Use its part 4 as the review criteria, and its parts 1 and 2 as a checklist of facts and distinctions that must survive. Do not assume the key is complete or correct: verify against the records yourself.

For each guide you review:
1. Check every substantive claim, condition, value, and attribution of a choice against its owner in the package. Report each defect with: the guide sentence (quoted), the owner file and section (quoted), what is wrong (omitted condition, changed meaning, merged distinction, invented fact, unresolved conflict presented as settled, wrong value), and its severity under part 4 of the key.
2. Check whether each key fact and distinction applicable to that guide is present and correct; list the ones missing.
3. Check that anything the migration removed from the technical records (compare with the untouched copy) still has a technical owner or was deliberately moved; list any fact that now exists only in a guide or nowhere.
4. Give a verdict per guide under the key's pass rule.

Write your full findings to $S/eval/responses/t7-review-b.md and reply with a short summary.
````

## T8 — full authoring rerun with the third revision (frozen skill v4)

````text
Use the Software Design skill at $S/frozen-skill-v4/software-design (start with its SKILL.md and follow it). Use only this copy of the skill.

Our loan system's design package is at $S/eval/t8/bitrise21/loan-system/design/technical-design. It doesn't have a System Guide yet. Please add one: I want to read and share how the whole system and each of its domains work, as PDFs. Export the architecture guide, each domain guide, and the combined guide to $S/eval/t8-pdf.

This is a disposable copy, so edit anything inside that package as needed, but don't change anything outside it apart from writing the PDFs. I won't be available to answer questions while you work: treat this message as my approval for the change, and list in your final reply anything you would have asked me, anything you could not resolve, and what you checked.
````

## T8 reader — architecture guide PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t8-pdf/bitcoin-backed-usdc-one-loan-system-architecture.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. Which part of the system has the final word on whether the Bitcoin collateral has moved, and which has the final word on whether USDC has moved?
2. What can the company operating the product do with a borrower's Bitcoin collateral?
3. What happens to loans in progress during a full outage of the hosting provider, and what happens when service returns?
4. What does this design version set out to deliver, and which later stages does it explicitly not claim?
5. When a borrower repays in full and on time but the lender never collects, what can happen to the USDC and to the Bitcoin?
6. Which points does the design itself record as unresolved, and how does it treat them?
7. How must a security threat be described in this design, and why is checking each credential on its own not enough?
8. How does every part of the system know it is dealing with the same loan, and what does that shared reference not do?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T8 reader — Loan Terms And Commitments PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t8-pdf/bitcoin-backed-usdc-one-loan-system-loan-terms-and-commitments.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. What does a lender commit to by publishing an offer, and what is decided later?
2. What does a borrower have at the moment an offer is reserved?
3. What must exist before the final agreement can be committed, and what exact event commits it?
4. What happens to approvals already given if a destination is edited before the agreement is committed?
5. How is the description of a single loan kept apart from the description of the environment it runs in, and why?
6. Under what conditions can a participant's payment wallet become an address that receives loan money?
7. After a reservation is cancelled, how can that offer be used again, and what carries over?
8. What does it prove when an artifact carries the correct loan identity?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T8 reader — Bitcoin Authorization And Recovery PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t8-pdf/bitcoin-backed-usdc-one-loan-system-bitcoin-authorization-and-recovery.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. How is staged collateral different from active collateral, and what does each permit?
2. Which transactions are prepared and signed before the lender funds, and which only afterward?
3. After the borrower has disclosed their secret and received the USDC, but the Bitcoin activation has not yet confirmed, what is the loan's status and what risk exists?
4. How does the borrower's Bitcoin come back after normal repayment, and what is different when the independent fallback is used instead?
5. If neither recovery secret ever becomes available, which time-based routes exist, and how is a clash between them settled?
6. What confirmations does a participant give when disclosing their secret on Base, and what does each one allow?
7. How is the fee chosen for a transaction that was signed in advance, and what remains unsettled?
8. What happens if a participant forgets their vault password?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T8 reader — Base USDC Settlement And Funding PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t8-pdf/bitcoin-backed-usdc-one-loan-system-base-usdc-settlement-and-funding.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. Who decides whether and how a loan's principal is funded, and what may the product do on that party's behalf?
2. When is a loan funded, and what does a USDC balance at the funding address mean before then?
3. What happens to the principal if the borrower never completes acceptance?
4. What exactly counts as a valid repayment?
5. How long does the lender have to collect a repayment, and what follows if that time passes?
6. What control does the borrower have over where an uncollected repayment is returned?
7. What does the return of an uncollected repayment on Base do for the borrower's Bitcoin collateral?
8. Who can change the main loan contract, and what does that mean for loans already running?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T8 reader — Base Observation And Fallback Review PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t8-pdf/bitcoin-backed-usdc-one-loan-system-base-observation-and-fallback-review.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. At what point can an event seen on Base move a loan forward or start a Bitcoin action?
2. How many data sources must work before a Base event is trusted, and how does that compare with Bitcoin evidence?
3. What does the application show, and what does it allow, when both Base providers fail or disagree?
4. What can a staff operator do if they believe an observed fact is wrong?
5. What must already be true when a loan is created for the independent fallback service ever to help that loan?
6. What lets the fallback service release its secret, and what does the service check on its own?
7. After the fallback secret is published, what still has to happen before the borrower has the Bitcoin back?
8. If the fallback service is unreachable or never publishes, what remains true for each party?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T8 reader — Participant Access And Loan Operations PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t8-pdf/bitcoin-backed-usdc-one-loan-system-participant-access-and-loan-operations.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. What does signing in to the product give a participant?
2. What additional checks apply before especially sensitive actions?
3. May the same person act as borrower and lender?
4. How does the product hand a signing task to the Vault, and what does the Vault do before signing?
5. If a participant's browser loses its connection right after they submit an action, how does the system avoid doing the action twice?
6. What does a "completed" operation in the workspace tell a participant about the blockchain?
7. What is the local demonstration, and what does a successful demo run not prove?
8. What can a company staff operator do and not do?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T8 — key-based review A (architecture, loan terms, participant)

````text
You are reviewing reader-facing documentation for semantic fidelity. Work alone and change nothing.

A design package is at $S/eval/snap-t8/bitrise21/loan-system/design/technical-design. Its guide/ directory holds a System Guide written for readers: review guide/architecture.md, guide/domains/loan-terms-and-commitments.md and guide/domains/participant-access-and-loan-operations.md. Everything else in the package (system-model/, build/, ui-ux/, tickets) is the technical source of truth those guides must restate faithfully. The guides were produced by migrating narrative sections out of system-model/architecture.md and the domain records; an untouched copy of the package from before that migration is at $S/eval/pre/bitrise21/loan-system/design/technical-design, so you can see what the narrative sections said originally.

An answer key prepared independently from the technical records, before the guides were written, is at $S/eval/expectations/expectations.md. Use its part 4 as the review criteria, and its parts 1 and 2 as a checklist of facts and distinctions that must survive. Do not assume the key is complete or correct: verify against the records yourself.

For each guide you review:
1. Check every substantive claim, condition, value, and attribution of a choice against its owner in the package. Report each defect with: the guide sentence (quoted), the owner file and section (quoted), what is wrong (omitted condition, changed meaning, merged distinction, invented fact, unresolved conflict presented as settled, wrong value), and its severity under part 4 of the key.
2. Check whether each key fact and distinction applicable to that guide is present and correct; list the ones missing.
3. Check that anything the migration removed from the technical records (compare with the untouched copy) still has a technical owner or was deliberately moved; list any fact that now exists only in a guide or nowhere.
4. Give a verdict per guide under the key's pass rule.

Write your full findings to $S/eval/responses/t8-review-a.md and reply with a short summary.
````

## T8 — key-based review B (Bitcoin, settlement, observation)

````text
You are reviewing reader-facing documentation for semantic fidelity. Work alone and change nothing.

A design package is at $S/eval/snap-t8/bitrise21/loan-system/design/technical-design. Its guide/ directory holds a System Guide written for readers: review guide/domains/bitcoin-authorization-and-recovery.md, guide/domains/base-usdc-settlement-and-funding.md and guide/domains/base-observation-and-fallback-review.md. Everything else in the package (system-model/, build/, ui-ux/, tickets) is the technical source of truth those guides must restate faithfully. The guides were produced by migrating narrative sections out of system-model/architecture.md and the domain records; an untouched copy of the package from before that migration is at $S/eval/pre/bitrise21/loan-system/design/technical-design, so you can see what the narrative sections said originally.

An answer key prepared independently from the technical records, before the guides were written, is at $S/eval/expectations/expectations.md. Use its part 4 as the review criteria, and its parts 1 and 2 as a checklist of facts and distinctions that must survive. Do not assume the key is complete or correct: verify against the records yourself.

For each guide you review:
1. Check every substantive claim, condition, value, and attribution of a choice against its owner in the package. Report each defect with: the guide sentence (quoted), the owner file and section (quoted), what is wrong (omitted condition, changed meaning, merged distinction, invented fact, unresolved conflict presented as settled, wrong value), and its severity under part 4 of the key.
2. Check whether each key fact and distinction applicable to that guide is present and correct; list the ones missing.
3. Check that anything the migration removed from the technical records (compare with the untouched copy) still has a technical owner or was deliberately moved; list any fact that now exists only in a guide or nowhere.
4. Give a verdict per guide under the key's pass rule.

Write your full findings to $S/eval/responses/t8-review-b.md and reply with a short summary.
````

## T9 — full authoring after the fourth revision (frozen skill v5)

````text
Use the Software Design skill at $S/frozen-skill-v5/software-design (start with its SKILL.md and follow it). Use only this copy of the skill.

Our loan system's design package is at $S/eval/t9/bitrise21/loan-system/design/technical-design. It doesn't have a System Guide yet. Please add one: I want to read and share how the whole system and each of its domains work, as PDFs. Export the architecture guide, each domain guide, and the combined guide to $S/eval/t9-pdf.

This is a disposable copy, so edit anything inside that package as needed, but don't change anything outside it apart from writing the PDFs. I won't be available to answer questions while you work: treat this message as my approval for the change, and list in your final reply anything you would have asked me, anything you could not resolve, and what you checked.
````

## T9 reader — architecture PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t9-pdf/bitcoin-backed-usdc-one-loan-system-architecture.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. Which part of the system has the final word on whether the Bitcoin collateral has moved, and which has the final word on whether USDC has moved?
2. What can the company operating the product do with a borrower's Bitcoin collateral?
3. What happens to loans in progress during a full outage of the hosting provider, and what happens when service returns?
4. What does this design version set out to deliver, and which later stages does it explicitly not claim?
5. When a borrower repays in full and on time but the lender never collects, what can happen to the USDC and to the Bitcoin?
6. Which points does the design itself record as unresolved, and how does it treat them?
7. How must a security threat be described in this design, and why is checking each credential on its own not enough?
8. How does every part of the system know it is dealing with the same loan, and what does that shared reference not do?
9. If someone steals a signed default transaction prepared for the lender, what can they do with it, and where would the Bitcoin go?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T9 reader — loan-terms-and-commitments PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t9-pdf/bitcoin-backed-usdc-one-loan-system-domain-loan-terms-and-commitments.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. What does a lender commit to by publishing an offer, and what is decided later?
2. What does a borrower have at the moment an offer is reserved?
3. What must exist before the final agreement can be committed, and what exact event commits it?
4. What happens to approvals already given if a destination is edited before the agreement is committed?
5. How is the description of a single loan kept apart from the description of the environment it runs in, and why?
6. Under what conditions can a participant's payment wallet become an address that receives loan money?
7. After a reservation is cancelled, how can that offer be used again, and what carries over?
8. What does it prove when an artifact carries the correct loan identity?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T9 reader — bitcoin-authorization-and-recovery PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t9-pdf/bitcoin-backed-usdc-one-loan-system-domain-bitcoin-authorization-and-recovery.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. How is staged collateral different from active collateral, and what does each permit?
2. Which transactions are prepared and signed before the lender funds, and which only afterward?
3. After the borrower has disclosed their secret and received the USDC, but the Bitcoin activation has not yet confirmed, what is the loan's status and what risk exists?
4. How does the borrower's Bitcoin come back after normal repayment, and what is different when the independent fallback is used instead?
5. If neither recovery secret ever becomes available, which time-based routes exist, and how is a clash between them settled?
6. What confirmations does a participant give when disclosing their secret on Base, and what does each one allow?
7. How is the fee chosen for a transaction that was signed in advance, and what remains unsettled?
8. What happens if a participant forgets their vault password?
9. If someone steals a signed default transaction prepared for the lender, what can they do with it, and where would the Bitcoin go?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T9 reader — base-usdc-settlement-and-funding PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t9-pdf/bitcoin-backed-usdc-one-loan-system-domain-base-usdc-settlement-and-funding.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. Who decides whether and how a loan's principal is funded, and what may the product do on that party's behalf?
2. When is a loan funded, and what does a USDC balance at the funding address mean before then?
3. What happens to the principal if the borrower never completes acceptance?
4. What exactly counts as a valid repayment?
5. How long does the lender have to collect a repayment, and what follows if that time passes?
6. What control does the borrower have over where an uncollected repayment is returned?
7. What does the return of an uncollected repayment on Base do for the borrower's Bitcoin collateral?
8. Who can change the main loan contract, and what does that mean for loans already running?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T9 reader — base-observation-and-fallback-review PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t9-pdf/bitcoin-backed-usdc-one-loan-system-domain-base-observation-and-fallback-review.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. At what point can an event seen on Base move a loan forward or start a Bitcoin action?
2. How many data sources must work before a Base event is trusted, and how does that compare with Bitcoin evidence?
3. What does the application show, and what does it allow, when both Base providers fail or disagree?
4. What can a staff operator do if they believe an observed fact is wrong?
5. What must already be true when a loan is created for the independent fallback service ever to help that loan?
6. What lets the fallback service release its secret, and what does the service check on its own?
7. After the fallback secret is published, what still has to happen before the borrower has the Bitcoin back?
8. If the fallback service is unreachable or never publishes, what remains true for each party?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T9 reader — participant-access-and-loan-operations PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t9-pdf/bitcoin-backed-usdc-one-loan-system-domain-participant-access-and-loan-operations.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. What does signing in to the product give a participant?
2. What additional checks apply before especially sensitive actions?
3. May the same person act as borrower and lender?
4. How does the product hand a signing task to the Vault, and what does the Vault do before signing?
5. If a participant's browser loses its connection right after they submit an action, how does the system avoid doing the action twice?
6. What does a "completed" operation in the workspace tell a participant about the blockchain?
7. What is the local demonstration, and what does a successful demo run not prove?
8. What can a company staff operator do and not do?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T9 — technical-diff review

````text
You are reviewing a change to a technical design package. Work alone and change nothing.

An untouched copy of the package is at $S/eval/pre/bitrise21/loan-system/design/technical-design. A copy after the change is at $S/eval/snap-t9/bitrise21/loan-system/design/technical-design. The change added reader-facing guides (the guide/ directory) and moved narrative sections out of the technical records. Review every file that differs outside guide/ (use diff -r between the two copies). Ignore guide/ itself except to check that links into it resolve.

For every changed technical file:
1. Account for every removed or changed line. For each statement that was removed, name the technical record (not a guide) where the same statement now lives with the same meaning, quoting both; if none, report it as lost.
2. Report any statement whose meaning changed: a condition, limit, value, attribution, scope or status added, dropped or altered; quote before and after.
3. Find every point where two records disagree, or where a record notes a conflict or an unresolved question, that the change touched. Check that each side's original wording survives in its own record and that no record was rewritten to agree with another. Report any side that was rewritten.
4. Check that records pinned by delivery evidence (build/workflow/handoffs/*-scope.json lists them with hashes) are byte-identical, and that stored fingerprints or hashes elsewhere in the package (for example visuals/assets/*.json) were updated only where the content they cover is unchanged in meaning; report any refreshed hash that hides a changed meaning.
5. Check that every link, anchor and quotation consumer of the changed sections still resolves.

Rate each finding: Blocker (lost statement, changed meaning, a rewritten side of a disagreement, a changed pinned record, a hash refreshed over a changed meaning), Minor (wording with unchanged meaning that still deserves a note), or None. Write your full findings, with quotes and file/line references, to $S/eval/responses/t9-diff-review.md and reply with a short summary and the count per rating.
````

## T9 — key-based review A (architecture, loan terms, participant)

````text
You are reviewing reader-facing documentation for semantic fidelity. Work alone and change nothing.

A design package is at $S/eval/snap-t9/bitrise21/loan-system/design/technical-design. Its guide/ directory holds a System Guide written for readers: review guide/architecture.md, guide/domains/loan-terms-and-commitments.md and guide/domains/participant-access-and-loan-operations.md. Everything else in the package (system-model/, build/, ui-ux/, tickets) is the technical source of truth those guides must restate faithfully. An untouched copy of the package from before the guides were added is at $S/eval/pre/bitrise21/loan-system/design/technical-design, so you can see what the technical records said originally.

An answer key prepared from the technical records before the guides were written is at $S/eval/expectations/expectations.md, with a correction at $S/eval/expectations/expectations-v2.md that amends it. Use the key's part 4 and the correction's part 5 as the review criteria, and the key's parts 1 and 2 with the correction's parts 2 to 4 as a checklist of facts and distinctions that must survive. Do not assume either file is complete or correct: verify against the records yourself, and report where you find them wrong.

For each guide you review:
1. Check every consequential assertion against its owner in the package: every claim, condition, value, status and attribution of a choice, in prose, figures, tables and callouts alike. Report each defect with: the guide passage (quoted), the owner file and section (quoted), what is wrong (omitted condition, changed meaning, merged distinction, invented fact, unresolved point presented as settled, wrong value, overstated or understated limit), and its severity under the criteria.
2. Check whether each key fact and distinction applicable to that guide is present and correct; list the ones missing.
3. Check each point the records leave unresolved or in disagreement wherever the guide reaches it, including steps narrated for another domain.
4. Give a verdict per guide under the key's pass rule and the correction's acceptance blockers.

Write your full findings to $S/eval/responses/t9-review-a.md and reply with a short summary.
````

## T9 — key-based review B (Bitcoin, settlement, observation)

````text
You are reviewing reader-facing documentation for semantic fidelity. Work alone and change nothing.

A design package is at $S/eval/snap-t9/bitrise21/loan-system/design/technical-design. Its guide/ directory holds a System Guide written for readers: review guide/domains/bitcoin-authorization-and-recovery.md, guide/domains/base-usdc-settlement-and-funding.md and guide/domains/base-observation-and-fallback-review.md. Everything else in the package (system-model/, build/, ui-ux/, tickets) is the technical source of truth those guides must restate faithfully. An untouched copy of the package from before the guides were added is at $S/eval/pre/bitrise21/loan-system/design/technical-design, so you can see what the technical records said originally.

An answer key prepared from the technical records before the guides were written is at $S/eval/expectations/expectations.md, with a correction at $S/eval/expectations/expectations-v2.md that amends it. Use the key's part 4 and the correction's part 5 as the review criteria, and the key's parts 1 and 2 with the correction's parts 2 to 4 as a checklist of facts and distinctions that must survive. Do not assume either file is complete or correct: verify against the records yourself, and report where you find them wrong.

For each guide you review:
1. Check every consequential assertion against its owner in the package: every claim, condition, value, status and attribution of a choice, in prose, figures, tables and callouts alike. Report each defect with: the guide passage (quoted), the owner file and section (quoted), what is wrong (omitted condition, changed meaning, merged distinction, invented fact, unresolved point presented as settled, wrong value, overstated or understated limit), and its severity under the criteria.
2. Check whether each key fact and distinction applicable to that guide is present and correct; list the ones missing.
3. Check each point the records leave unresolved or in disagreement wherever the guide reaches it, including steps narrated for another domain.
4. Give a verdict per guide under the key's pass rule and the correction's acceptance blockers.

Write your full findings to $S/eval/responses/t9-review-b.md and reply with a short summary.
````

## T9 — reader scoring

````text
You are scoring reader-comprehension answers. Work alone; change nothing except the one output file named below.

Inputs (read all of them):
- Answer key part 3 (reader questions and their expected substance, wrong or dangerous answers): /Users/alanguerrero/Documents/ai-prompts/skills/blueprint-development/technical/software-design/tests/behavioral/system-guide/expectations.md, section "## 3. Reader comprehension questions".
- Correction to the key: $S/eval/expectations/expectations-v2.md, especially its part 6 (new questions Q-A9 and Q-B9) and any part that amends a question's expected substance.
- Verdict rules and the calibration used for earlier runs: /Users/alanguerrero/Documents/ai-prompts/skills/blueprint-development/technical/software-design/tests/behavioral/system-guide/scoring.md (read the whole file; apply the same verdict definitions and the calibration notes recorded for T7 and T8 so verdicts are comparable).
- The reader prompts actually used: $S/eval/prompts/t9-readers/*.md (architecture and Bitcoin have a ninth question).
- Six reader responses: $S/eval/responses/t9-{architecture,loan-terms,bitcoin,settlement,observation,participant}-reader.md
- To decide whether a gap is the guide's or the reader's, you may read the guide sources the PDFs were exported from: $S/eval/snap-t9/bitrise21/loan-system/design/technical-design/guide/

Task: give each answer (48 original questions plus Q-A9 and Q-B9, 50 in total) one verdict: Met, Partial, Not met or Wrong, as scoring.md defines them. For each Partial, Not met or Wrong, say in one or two sentences what substance was missing or wrong, and whether the guide lacked it or the reader missed what the guide says. Then compare with the T8 row of scoring.md: which questions fixed, regressed or unchanged (for the 48 shared questions).

Write the result to $S/eval/responses/t9-reader-scoring.md in this shape: a table per guide (question, verdict, note), then a totals table (Met / Partial / Not met / Wrong per guide, with the 48-question total reported separately from the 50-question total), then the comparison with T8. Reply with the totals and the comparison only.
````

## T10 — independent scoped repeat: architecture + observation/fallback (frozen skill v5)

````text
Use the Software Design skill at $S/frozen-skill-v5/software-design (start with its SKILL.md and follow it). Use only this copy of the skill.

Our loan system's design package is at $S/eval/t10/bitrise21/loan-system/design/technical-design. Reviewers need to understand the architecture and the Base Observation And Fallback Review domain. Please add those to a System Guide for the package and export their PDFs to $S/eval/t10-pdf.

This is a disposable copy, so edit anything inside that package as needed, but don't change anything outside it apart from writing the PDFs. I won't be available to answer questions while you work: treat this message as my approval for the change, and list in your final reply anything you would have asked me, anything you could not resolve, and what you checked.
````

## T10 reader — architecture PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t10-pdf/bitcoin-backed-usdc-one-loan-system-architecture.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. Which part of the system has the final word on whether the Bitcoin collateral has moved, and which has the final word on whether USDC has moved?
2. What can the company operating the product do with a borrower's Bitcoin collateral?
3. What happens to loans in progress during a full outage of the hosting provider, and what happens when service returns?
4. What does this design version set out to deliver, and which later stages does it explicitly not claim?
5. When a borrower repays in full and on time but the lender never collects, what can happen to the USDC and to the Bitcoin?
6. Which points does the design itself record as unresolved, and how does it treat them?
7. How must a security threat be described in this design, and why is checking each credential on its own not enough?
8. How does every part of the system know it is dealing with the same loan, and what does that shared reference not do?
9. If someone steals a signed default transaction prepared for the lender, what can they do with it, and where would the Bitcoin go?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T10 reader — base-observation-and-fallback-review PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t10-pdf/bitcoin-backed-usdc-one-loan-system-domain-base-observation-and-fallback-review.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. At what point can an event seen on Base move a loan forward or start a Bitcoin action?
2. How many data sources must work before a Base event is trusted, and how does that compare with Bitcoin evidence?
3. What does the application show, and what does it allow, when both Base providers fail or disagree?
4. What can a staff operator do if they believe an observed fact is wrong?
5. What must already be true when a loan is created for the independent fallback service ever to help that loan?
6. What lets the fallback service release its secret, and what does the service check on its own?
7. After the fallback secret is published, what still has to happen before the borrower has the Bitcoin back?
8. If the fallback service is unreachable or never publishes, what remains true for each party?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T10 — key-based review (architecture, observation)

````text
You are reviewing reader-facing documentation for semantic fidelity. Work alone and change nothing.

A design package is at $S/eval/snap-t10/bitrise21/loan-system/design/technical-design. Its guide/ directory holds a System Guide written for readers: review guide/architecture.md and guide/domains/base-observation-and-fallback-review.md (the other domain guides exist but are out of scope for this review). Everything else in the package (system-model/, build/, ui-ux/, tickets) is the technical source of truth those guides must restate faithfully. An untouched copy of the package from before the guides were added is at $S/eval/pre/bitrise21/loan-system/design/technical-design, so you can see what the technical records said originally.

An answer key prepared from the technical records before the guides were written is at $S/eval/expectations/expectations.md, with a correction at $S/eval/expectations/expectations-v2.md that amends it. Use the key's part 4 and the correction's part 5 as the review criteria, and the key's parts 1 and 2 with the correction's parts 2 to 4 as a checklist of facts and distinctions that must survive. Do not assume either file is complete or correct: verify against the records yourself, and report where you find them wrong.

For each guide you review:
1. Check every consequential assertion against its owner in the package: every claim, condition, value, status and attribution of a choice, in prose, figures, tables and callouts alike. Report each defect with: the guide passage (quoted), the owner file and section (quoted), what is wrong (omitted condition, changed meaning, merged distinction, invented fact, unresolved point presented as settled, wrong value, overstated or understated limit), and its severity under the criteria.
2. Check whether each key fact and distinction applicable to that guide is present and correct; list the ones missing.
3. Check each point the records leave unresolved or in disagreement wherever the guide reaches it, including steps narrated for another domain.
4. Give a verdict per guide under the key's pass rule and the correction's acceptance blockers.

Write your full findings to $S/eval/responses/t10-review.md and reply with a short summary.
````

## T11 — maintenance: hypothetical 12-hour reservation on the T9 package (frozen skill v5)

````text
Use the Software Design skill at $S/frozen-skill-v5/software-design (start with its SKILL.md and follow it). Use only this copy of the skill.

Our loan system's design package is at $S/eval/t11/bitrise21/loan-system/design/technical-design, and its System Guide PDFs are in $S/eval/t11-pdf.

For this exercise only, here is a hypothetical change (it is not a real product decision): I've decided the borrower's offer reservation should last 12 hours instead of 24. Nothing else changes. Please record it in the design package and bring the PDFs up to date.

This is a disposable copy, so edit anything inside that package as needed, but don't change anything outside it apart from the PDFs. I won't be available to answer questions while you work: treat this message as my approval for the change, and list in your final reply what you changed, anything you would have asked me, anything you could not resolve, and what you checked.
````

## T10 — reader scoring (follow-up message to the T9 scoring agent)

````text
Please score two more reader responses the same way, with the same rules and calibration. They come from an independent scoped run, T10: one architecture guide PDF and one Base Observation And Fallback Review guide PDF, written by a different author on a separate package copy. Responses: $S/eval/responses/t10-architecture-reader.md (9 questions, including Q-A9) and .../responses/t10-observation-reader.md (8 questions). Prompts: .../eval/prompts/t10-readers/*.md. Guide sources: $S/eval/snap-t10/bitrise21/loan-system/design/technical-design/guide/ (architecture.md and domains/base-observation-and-fallback-review.md). Write $S/eval/responses/t10-reader-scoring.md in the same shape: per-question tables, totals with the 8+8 shared questions kept separate from Q-A9, then a comparison with T9's architecture and observation rows and with the T2 rows in scoring.md (T2 was the earlier scoped repeat). Reply with the totals and the comparison only. Change nothing else.
````

## T12 — full authoring after the fifth revision (frozen skill v6)

````text
Use the Software Design skill at $S/frozen-skill-v6/software-design (start with its SKILL.md and follow it). Use only this copy of the skill.

Our loan system's design package is at $S/eval/t12/bitrise21/loan-system/design/technical-design. It doesn't have a System Guide yet. Please add one: I want to read and share how the whole system and each of its domains work, as PDFs. Export the architecture guide, each domain guide, and the combined guide to $S/eval/t12-pdf.

This is a disposable copy, so edit anything inside that package as needed, but don't change anything outside it apart from writing the PDFs. I won't be available to answer questions while you work: treat this message as my approval for the change, and list in your final reply anything you would have asked me, anything you could not resolve, and what you checked.
````

## T12 reader — architecture PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t12-pdf/bitcoin-backed-usdc-one-loan-system-architecture.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. Which part of the system has the final word on whether the Bitcoin collateral has moved, and which has the final word on whether USDC has moved?
2. What can the company operating the product do with a borrower's Bitcoin collateral?
3. What happens to loans in progress during a full outage of the hosting provider, and what happens when service returns?
4. What does this design version set out to deliver, and which later stages does it explicitly not claim?
5. When a borrower repays in full and on time but the lender never collects, what can happen to the USDC and to the Bitcoin?
6. Which points does the design itself record as unresolved, and how does it treat them?
7. How must a security threat be described in this design, and why is checking each credential on its own not enough?
8. How does every part of the system know it is dealing with the same loan, and what does that shared reference not do?
9. If someone steals a signed default transaction prepared for the lender, what can they do with it, and where would the Bitcoin go?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T12 reader — loan-terms-and-commitments PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t12-pdf/bitcoin-backed-usdc-one-loan-system-domain-loan-terms-and-commitments.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. What does a lender commit to by publishing an offer, and what is decided later?
2. What does a borrower have at the moment an offer is reserved?
3. What must exist before the final agreement can be committed, and what exact event commits it?
4. What happens to approvals already given if a destination is edited before the agreement is committed?
5. How is the description of a single loan kept apart from the description of the environment it runs in, and why?
6. Under what conditions can a participant's payment wallet become an address that receives loan money?
7. After a reservation is cancelled, how can that offer be used again, and what carries over?
8. What does it prove when an artifact carries the correct loan identity?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T12 reader — bitcoin-authorization-and-recovery PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t12-pdf/bitcoin-backed-usdc-one-loan-system-domain-bitcoin-authorization-and-recovery.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. How is staged collateral different from active collateral, and what does each permit?
2. Which transactions are prepared and signed before the lender funds, and which only afterward?
3. After the borrower has disclosed their secret and received the USDC, but the Bitcoin activation has not yet confirmed, what is the loan's status and what risk exists?
4. How does the borrower's Bitcoin come back after normal repayment, and what is different when the independent fallback is used instead?
5. If neither recovery secret ever becomes available, which time-based routes exist, and how is a clash between them settled?
6. What confirmations does a participant give when disclosing their secret on Base, and what does each one allow?
7. How is the fee chosen for a transaction that was signed in advance, and what remains unsettled?
8. What happens if a participant forgets their vault password?
9. If someone steals a signed default transaction prepared for the lender, what can they do with it, and where would the Bitcoin go?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T12 reader — base-usdc-settlement-and-funding PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t12-pdf/bitcoin-backed-usdc-one-loan-system-domain-base-usdc-settlement-and-funding.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. Who decides whether and how a loan's principal is funded, and what may the product do on that party's behalf?
2. When is a loan funded, and what does a USDC balance at the funding address mean before then?
3. What happens to the principal if the borrower never completes acceptance?
4. What exactly counts as a valid repayment?
5. How long does the lender have to collect a repayment, and what follows if that time passes?
6. What control does the borrower have over where an uncollected repayment is returned?
7. What does the return of an uncollected repayment on Base do for the borrower's Bitcoin collateral?
8. Who can change the main loan contract, and what does that mean for loans already running?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T12 reader — base-observation-and-fallback-review PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t12-pdf/bitcoin-backed-usdc-one-loan-system-domain-base-observation-and-fallback-review.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. At what point can an event seen on Base move a loan forward or start a Bitcoin action?
2. How many data sources must work before a Base event is trusted, and how does that compare with Bitcoin evidence?
3. What does the application show, and what does it allow, when both Base providers fail or disagree?
4. What can a staff operator do if they believe an observed fact is wrong?
5. What must already be true when a loan is created for the independent fallback service ever to help that loan?
6. What lets the fallback service release its secret, and what does the service check on its own?
7. After the fallback secret is published, what still has to happen before the borrower has the Bitcoin back?
8. If the fallback service is unreachable or never publishes, what remains true for each party?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T12 reader — participant-access-and-loan-operations PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t12-pdf/bitcoin-backed-usdc-one-loan-system-domain-participant-access-and-loan-operations.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. What does signing in to the product give a participant?
2. What additional checks apply before especially sensitive actions?
3. May the same person act as borrower and lender?
4. How does the product hand a signing task to the Vault, and what does the Vault do before signing?
5. If a participant's browser loses its connection right after they submit an action, how does the system avoid doing the action twice?
6. What does a "completed" operation in the workspace tell a participant about the blockchain?
7. What is the local demonstration, and what does a successful demo run not prove?
8. What can a company staff operator do and not do?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T12 — technical-diff review

````text
You are reviewing a change to a technical design package. Work alone and change nothing.

An untouched copy of the package is at $S/eval/pre/bitrise21/loan-system/design/technical-design. A copy after the change is at $S/eval/snap-t12/bitrise21/loan-system/design/technical-design. The change added reader-facing guides (the guide/ directory) and moved narrative sections out of the technical records. Review every file that differs outside guide/ (use diff -r between the two copies). Ignore guide/ itself except to check that links into it resolve.

For every changed technical file:
1. Account for every removed or changed line. For each statement that was removed, name the technical record (not a guide) where the same statement now lives with the same meaning, quoting both; if none, report it as lost.
2. Report any statement whose meaning changed: a condition, limit, value, attribution, scope or status added, dropped or altered; quote before and after.
3. Find every point where two records disagree, or where a record notes a conflict or an unresolved question, that the change touched. Check that each side's original wording survives in its own record and that no record was rewritten to agree with another. Report any side that was rewritten.
4. Check that records pinned by delivery evidence (build/workflow/handoffs/*-scope.json lists them with hashes) are byte-identical, and that stored fingerprints or hashes elsewhere in the package (for example visuals/assets/*.json) were updated only where the content they cover is unchanged in meaning; report any refreshed hash that hides a changed meaning.
5. Check that every link, anchor and quotation consumer of the changed sections still resolves.

Rate each finding: Blocker (lost statement, changed meaning, a rewritten side of a disagreement, a changed pinned record, a hash refreshed over a changed meaning), Minor (wording with unchanged meaning that still deserves a note), or None. Write your full findings, with quotes and file/line references, to $S/eval/responses/t12-diff-review.md and reply with a short summary and the count per rating.
````

## T12 — key-based review A (architecture, loan terms, participant)

````text
You are reviewing reader-facing documentation for semantic fidelity. Work alone and change nothing.

A design package is at $S/eval/snap-t12/bitrise21/loan-system/design/technical-design. Its guide/ directory holds a System Guide written for readers: review guide/architecture.md, guide/domains/loan-terms-and-commitments.md and guide/domains/participant-access-and-loan-operations.md. Everything else in the package (system-model/, build/, ui-ux/, tickets) is the technical source of truth those guides must restate faithfully. An untouched copy of the package from before the guides were added is at $S/eval/pre/bitrise21/loan-system/design/technical-design, so you can see what the technical records said originally.

An answer key prepared from the technical records before the guides were written is at $S/eval/expectations/expectations.md, with a correction at $S/eval/expectations/expectations-v2.md that amends it. Use the key's part 4 and the correction's part 5 as the review criteria, and the key's parts 1 and 2 with the correction's parts 2 to 4 as a checklist of facts and distinctions that must survive. Do not assume either file is complete or correct: verify against the records yourself, and report where you find them wrong.

For each guide you review:
1. Check every consequential assertion against its owner in the package: every claim, condition, value, status and attribution of a choice, in prose, figures, tables and callouts alike. Report each defect with: the guide passage (quoted), the owner file and section (quoted), what is wrong (omitted condition, changed meaning, merged distinction, invented fact, unresolved point presented as settled, wrong value, overstated or understated limit), and its severity under the criteria.
2. Check whether each key fact and distinction applicable to that guide is present and correct; list the ones missing.
3. Check each point the records leave unresolved or in disagreement wherever the guide reaches it, including steps narrated for another domain.
4. Give a verdict per guide under the key's pass rule and the correction's acceptance blockers.

Write your full findings to $S/eval/responses/t12-review-a.md and reply with a short summary.
````

## T12 — key-based review B (Bitcoin, settlement, observation)

````text
You are reviewing reader-facing documentation for semantic fidelity. Work alone and change nothing.

A design package is at $S/eval/snap-t12/bitrise21/loan-system/design/technical-design. Its guide/ directory holds a System Guide written for readers: review guide/domains/bitcoin-authorization-and-recovery.md, guide/domains/base-usdc-settlement-and-funding.md and guide/domains/base-observation-and-fallback-review.md. Everything else in the package (system-model/, build/, ui-ux/, tickets) is the technical source of truth those guides must restate faithfully. An untouched copy of the package from before the guides were added is at $S/eval/pre/bitrise21/loan-system/design/technical-design, so you can see what the technical records said originally.

An answer key prepared from the technical records before the guides were written is at $S/eval/expectations/expectations.md, with a correction at $S/eval/expectations/expectations-v2.md that amends it. Use the key's part 4 and the correction's part 5 as the review criteria, and the key's parts 1 and 2 with the correction's parts 2 to 4 as a checklist of facts and distinctions that must survive. Do not assume either file is complete or correct: verify against the records yourself, and report where you find them wrong.

For each guide you review:
1. Check every consequential assertion against its owner in the package: every claim, condition, value, status and attribution of a choice, in prose, figures, tables and callouts alike. Report each defect with: the guide passage (quoted), the owner file and section (quoted), what is wrong (omitted condition, changed meaning, merged distinction, invented fact, unresolved point presented as settled, wrong value, overstated or understated limit), and its severity under the criteria.
2. Check whether each key fact and distinction applicable to that guide is present and correct; list the ones missing.
3. Check each point the records leave unresolved or in disagreement wherever the guide reaches it, including steps narrated for another domain.
4. Give a verdict per guide under the key's pass rule and the correction's acceptance blockers.

Write your full findings to $S/eval/responses/t12-review-b.md and reply with a short summary.
````

## T13 — independent scoped repeat: architecture + observation/fallback (frozen skill v6)

````text
Use the Software Design skill at $S/frozen-skill-v6/software-design (start with its SKILL.md and follow it). Use only this copy of the skill.

Our loan system's design package is at $S/eval/t13/bitrise21/loan-system/design/technical-design. Reviewers need to understand the architecture and the Base Observation And Fallback Review domain. Please add those to a System Guide for the package and export their PDFs to $S/eval/t13-pdf.

This is a disposable copy, so edit anything inside that package as needed, but don't change anything outside it apart from writing the PDFs. I won't be available to answer questions while you work: treat this message as my approval for the change, and list in your final reply anything you would have asked me, anything you could not resolve, and what you checked.
````

## T13 — relay message (second message to the T13 authoring agent; see results.md)

````text
Your four domain agents have finished, but their final reports reached me instead of you. I saved each one verbatim, unedited: $S/eval/t13-relay/loan-terms.md, settlement.md, participant.md and bitcoin.md (same folder). Please continue and finish the task as originally requested.
````

## T13 reader — architecture PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t13-pdf/bitcoin-backed-usdc-one-loan-system-architecture.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. Which part of the system has the final word on whether the Bitcoin collateral has moved, and which has the final word on whether USDC has moved?
2. What can the company operating the product do with a borrower's Bitcoin collateral?
3. What happens to loans in progress during a full outage of the hosting provider, and what happens when service returns?
4. What does this design version set out to deliver, and which later stages does it explicitly not claim?
5. When a borrower repays in full and on time but the lender never collects, what can happen to the USDC and to the Bitcoin?
6. Which points does the design itself record as unresolved, and how does it treat them?
7. How must a security threat be described in this design, and why is checking each credential on its own not enough?
8. How does every part of the system know it is dealing with the same loan, and what does that shared reference not do?
9. If someone steals a signed default transaction prepared for the lender, what can they do with it, and where would the Bitcoin go?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T13 reader — base-observation-and-fallback-review PDF

````text
You are a newcomer to a software system. You have one document about it: the PDF at $S/eval/t13-pdf/bitcoin-backed-usdc-one-loan-system-domain-base-observation-and-fallback-review.pdf. Read the whole PDF (use the Read tool with the pages parameter, 20 pages at a time) and nothing else: do not open any other file or directory, run commands, or search the web.

Then answer the questions below using only what the document says. For each answer, give the page number(s) you relied on and how confident you are (high, medium or low). When the document does not answer a question, or answers it only partly, say so plainly instead of guessing.

1. At what point can an event seen on Base move a loan forward or start a Bitcoin action?
2. How many data sources must work before a Base event is trusted, and how does that compare with Bitcoin evidence?
3. What does the application show, and what does it allow, when both Base providers fail or disagree?
4. What can a staff operator do if they believe an observed fact is wrong?
5. What must already be true when a loan is created for the independent fallback service ever to help that loan?
6. What lets the fallback service release its secret, and what does the service check on its own?
7. After the fallback secret is published, what still has to happen before the borrower has the Bitcoin back?
8. If the fallback service is unreachable or never publishes, what remains true for each party?

Finally, in a short separate section, list anything in the document you found confusing, any term used before it was explained, and anything you expected to find but did not.
````

## T13 — technical-diff review

````text
You are reviewing a change to a technical design package. Work alone and change nothing.

An untouched copy of the package is at $S/eval/pre/bitrise21/loan-system/design/technical-design. A copy after the change is at $S/eval/snap-t13/bitrise21/loan-system/design/technical-design. The change added reader-facing guides (the guide/ directory) and moved narrative sections out of the technical records. Review every file that differs outside guide/ (use diff -r between the two copies). Ignore guide/ itself except to check that links into it resolve.

For every changed technical file:
1. Account for every removed or changed line. For each statement that was removed, name the technical record (not a guide) where the same statement now lives with the same meaning, quoting both; if none, report it as lost.
2. Report any statement whose meaning changed: a condition, limit, value, attribution, scope or status added, dropped or altered; quote before and after.
3. Find every point where two records disagree, or where a record notes a conflict or an unresolved question, that the change touched. Check that each side's original wording survives in its own record and that no record was rewritten to agree with another. Report any side that was rewritten.
4. Check that records pinned by delivery evidence (build/workflow/handoffs/*-scope.json lists them with hashes) are byte-identical, and that stored fingerprints or hashes elsewhere in the package (for example visuals/assets/*.json) were updated only where the content they cover is unchanged in meaning; report any refreshed hash that hides a changed meaning.
5. Check that every link, anchor and quotation consumer of the changed sections still resolves.

Rate each finding: Blocker (lost statement, changed meaning, a rewritten side of a disagreement, a changed pinned record, a hash refreshed over a changed meaning), Minor (wording with unchanged meaning that still deserves a note), or None. Write your full findings, with quotes and file/line references, to $S/eval/responses/t13-diff-review.md and reply with a short summary and the count per rating.
````

## T13 — key-based review (architecture, observation)

````text
You are reviewing reader-facing documentation for semantic fidelity. Work alone and change nothing.

A design package is at $S/eval/snap-t13/bitrise21/loan-system/design/technical-design. Its guide/ directory holds a System Guide written for readers: review guide/architecture.md and guide/domains/base-observation-and-fallback-review.md (the other domain guides exist but are out of scope for this review). Everything else in the package (system-model/, build/, ui-ux/, tickets) is the technical source of truth those guides must restate faithfully. An untouched copy of the package from before the guides were added is at $S/eval/pre/bitrise21/loan-system/design/technical-design, so you can see what the technical records said originally.

An answer key prepared from the technical records before the guides were written is at $S/eval/expectations/expectations.md, with a correction at $S/eval/expectations/expectations-v2.md that amends it. Use the key's part 4 and the correction's part 5 as the review criteria, and the key's parts 1 and 2 with the correction's parts 2 to 4 as a checklist of facts and distinctions that must survive. Do not assume either file is complete or correct: verify against the records yourself, and report where you find them wrong.

For each guide you review:
1. Check every consequential assertion against its owner in the package: every claim, condition, value, status and attribution of a choice, in prose, figures, tables and callouts alike. Report each defect with: the guide passage (quoted), the owner file and section (quoted), what is wrong (omitted condition, changed meaning, merged distinction, invented fact, unresolved point presented as settled, wrong value, overstated or understated limit), and its severity under the criteria.
2. Check whether each key fact and distinction applicable to that guide is present and correct; list the ones missing.
3. Check each point the records leave unresolved or in disagreement wherever the guide reaches it, including steps narrated for another domain.
4. Give a verdict per guide under the key's pass rule and the correction's acceptance blockers.

Write your full findings to $S/eval/responses/t13-review.md and reply with a short summary.
````

## T12 and T13 — reader scoring (follow-up message to the T9 scoring agent)

````text
Please score eight more reader responses the same way, with the same rules and calibration, from two new independent runs made with a revised skill.

T12 is a full authoring run on a separate package copy. It has six responses: $S/eval/responses/t12-{architecture,loan-terms,bitcoin,settlement,observation,participant}-reader.md. Prompts: .../eval/prompts/t12-readers/*.md. Guide sources: .../eval/snap-t12/bitrise21/loan-system/design/technical-design/guide/.

T13 is a scoped run by a different author on another copy. It has two responses: .../eval/responses/t13-architecture-reader.md (9 questions, including Q-A9) and .../responses/t13-observation-reader.md (8 questions). Prompts: .../eval/prompts/t13-readers/*.md. Guide sources: .../eval/snap-t13/bitrise21/loan-system/design/technical-design/guide/ (architecture.md and domains/base-observation-and-fallback-review.md).

Write two files in the same shape as before: per-question tables, then totals with the shared questions kept separate from Q-A9 and Q-B9.
- .../eval/responses/t12-reader-scoring.md: compare it with your T9 scoring and with the T8 row in scoring.md.
- .../eval/responses/t13-reader-scoring.md: compare it with your T10 scoring and with the T2 rows in scoring.md.

Reply with the totals and the comparisons only. Change nothing else.
````
