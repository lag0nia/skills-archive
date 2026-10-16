None of the three guides passes the key's §4.7 rule. Each has a short fix list in the findings file. I changed nothing in the package.

| Guide | Critical | Major | Facts preserved | Comprehension | Verdict |
| --- | --- | --- | --- | --- | --- |
| Bitcoin Authorization And Recovery | 0 | 0 | 13/15 (86.7%) | 6 of 8 | Fails the 90% fact threshold only |
| Base USDC Settlement And Funding | 0 | 2 | 14/15 (93.3%) | 6 of 8, plus 2 partial | Fails on two Majors |
| Base Observation And Fallback Review | 0 | 1 | 11/15 (73.3%) | about 6 of 8 | Fails the 90% fact threshold, plus one Major |

**Bitcoin guide.**
- B-12 is weakened. Line 24 says only "two-step acceptance". It never says the first confirmation allows only local preparation, that an isolated worker freezes the exact bytes, that the second confirmation is bound to those bytes, or that plaintext is cleared on failure. Nothing is said for Y. Owners: SR-004 and SR-009 "## Owns". Because of this, comprehension question Q-B6 fails.
- B-13 is weakened. The rule for when every fee estimator is down is missing. Owner: IFACE-007 "## Preconditions And Validation" (route enters `fee-estimation-blocked`).
- Both flagged conflicts (12 vs 18 packages, and the no-qualifying-tier fee case) are presented with both sides and "not decided".
- Seven Minor wording issues, such as "valid at T" instead of "after median time passes T".
- Adding those two sentences brings it to 15/15 and a pass.

**Base guide.**
- Major A: the guide never says the fallback applies only to loans created after the production-activation gate. The callout at line 60 says the risk remains "for many loans", but SEC-024 says every loan without an activated H(S), which today is every loan. INV-025 and FLOW-005 carry the same gate.
- Major B: line 77 adopts SEL-009's single upgrade key for the public mainnet beta, with the 2-of-3 Safe and seven-day timelock only afterwards. INV-020, SR-003 and STATE-019 say 2-of-3 Safe with timelock for V1, and STATE-019 forbids a unilateral upgrade key. The guide does not flag this inconsistency. It also drops INV-020's rule that upgrades preserve fixed recipients, lifecycle authority and originating-loan identity.
- Six Minor issues.

**Observation guide.**
- O-9 is weakened: it omits that a lost or compromised S cannot be rotated without a new escrow (IFACE-017).
- O-12 is weakened: the Bitcoin finalization checks at line 48 omit the activation gate, the event binding, the retained package and the fixed outputs. The key (§4.5) requires the full list in this guide.
- O-13 is missing: the four lookup results, "empty is not proof of withholding", and that the product sees only public metadata (SR-007, IFACE-017 ACT-002).
- O-14 is weakened: it omits that an outage is recovered by replaying the same S, the incident path, and that there is no replacement secret (SR-007 "### When the path fails").
- Major C: the figure step "Only for a loan created after activation" leaves "activation" unexplained, so it reads as the Bitcoin escrow activation rather than the fallback's production gate.
- Seven Minor issues, including merging the five-minute dual-outage alert with the immediate alert on provider conflict.

**Migration check.**
- No fact now exists only in a guide or nowhere. Every narrative section removed from the three domain records and from the architecture overview still has a canonical owner.
- One changed meaning was introduced into a technical record. The Base `domain.md` "## Choices And Rationale" (line 39) now carries the single-beta-key governance. Before the migration it said 2-of-3 Safe with seven-day timelock. This is the source of Major B, and the record needs repair or an explicit conflict flag.

**Answer key.** It should list the SEL-009 vs INV-020/STATE-019 governance inconsistency, and the SEL-014 split between the dual-outage alert and the conflict alert. Many of its owner citations point to domain sections the migration removed. The other notes on the key are in §5 of the findings file.

Files are in /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval:
- responses/t8-review-b.md (the findings)
- snap-t8/bitrise21/loan-system/design/technical-design/system-model/domains/base-usdc-settlement-and-funding/domain.md (the record with the changed meaning)
