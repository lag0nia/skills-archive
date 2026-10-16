# How System Name works

One or two sentences: what the system does, for whom, and the outcome it aims to support.

<!-- Write for a reader who knows the product goal but not the blueprint, following references/guide-writing.md. Order sections by the reader's questions: rename, merge, split or reorder the headings below as this system needs. Restate technical owners faithfully and link them; keep identifiers and package paths in link destinations only. -->

## What the system is for

Who uses, operates or depends on the system, what they achieve, and the concepts needed to follow the rest.

## The domains and their roles

| Domain | Its role |
| --- | --- |
| [Domain Name](domains/domain-slug.md) | What it is responsible for and where its boundary lies. |

How the domains depend on each other, in a short paragraph.

## A case from start to finish

Follow one concrete case across the domains: who supplies each input, who decides or acts, what changes, and what proves the outcome.

## Identity, authority and sources of truth

What binds records, artifacts and participants to one subject; who may decide or change what; which fact counts as evidence of an outcome.

## When things go wrong

Failure paths and recovery, and what the system cannot guarantee.

## Current limitations

Summarize capability availability and exclusions without implementation or ticket history.

## Open questions

Consequential choices with their recorded reasons. Explain competing interpretations once here, with brief local qualifications beside affected behavior. Detailed source reconciliation stays in technical records.

The [technical architecture record](../system-model/architecture.md) holds the exact boundaries and sources of truth.
