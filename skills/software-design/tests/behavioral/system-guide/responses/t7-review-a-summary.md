All three guides fail the key's pass rule. Loan Terms comes closest. I changed nothing in the package; the full findings are in /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/responses/t7-review-a.md.

The key's source copy (t0) is identical to the pre-migration copy, so I checked every claim against the snap-t7 records directly.

| Guide | Critical | Major | Facts preserved | Questions answered fully | Verdict |
|---|---|---|---|---|---|
| Architecture | 0 | 2 | 12/15 (80%) | 6/8 | FAIL |
| Loan Terms And Commitments | 0 | 1 | 11/15 (73%) | 7/8 | FAIL |
| Participant Access And Loan Operations | 1 | 2 | 10/15 (67%), one partly contradicted | 6/8 | FAIL |

**Architecture guide**
- **Major, AR-1:** it presents "payment account as recipient for a new loan" as an open conflict, and says the architecture record calls it "never a term-bound recipient". That is wrong. The architecture record's "Purpose And Binding" section allows it with fresh approval, and IFACE-022, INV-023 and SR-003 settle the rule. The guide also drops the condition that the participant must be authorized for that role. The error comes from a bullet the migration added to the loan-terms domain record.
- **Major, AR-2:** "the participant's own 12-word recovery phrase restores Bitcoin key material" comes from SEL-005, a build selection that does not define behavior. The system-model owners (SR-004, STATE-004, INV-024) say password loss blocks reconstruction, new signing and cooperative settlement. The guide does not flag this tension.
- It carries all three conflicts the key requires and the claim ladder.
- There are 12 minor defects; three of them weaken facts A-3, A-12 and A-14.

**Loan Terms guide**
- **Major, LT-1:** the same invented payment-account conflict, at lines 66 and 84.
- The approval conflict is carried well, and the ticket attributions check out.
- It fails only on the 90% preservation threshold. Four facts are weakened: L-4, L-8, L-9 and L-14.
  - L-4: the rule that a concurrent or stale selection loses is missing.
  - L-8: it says the offer is consumed on acceptance, without "finalized".
  - L-9: the payment-account rule (LT-1).
  - L-14: "a narrative or diagram cannot supply a missing approval" is missing.

**Participant Access guide**
- **Critical, PA-1:** line 34 says both participants approve the final terms, as if settled. It omits the other side of the approval conflict (architecture record, IFACE-003, SEL-012, SCOPE-011) and has no conflict note.
- **Major, PA-2:** the callout at line 76 says a passing test, healthy process, seeded fixture or demo receipt "shows only that the local profile works". VA-001's Limitations, STATE-020 and the claim ladder say the opposite: verification does not prove a runnable demo. This partly contradicts fact P-14.
- **Major, PA-3:** the local demo is described in the present tense. The guide never says its recorded status is "Planned — unverified" (VA-003, no existing evidence) and "Blocked" (the LOCAL_DEMO_RUNTIME_NOT_IMPLEMENTED stop).
- There are 8 minor defects, including a missing email-confirmation step, missing handoff-code bindings, and a missing statement that a participant transfer cannot advance loan state.

**What the migration removed**
- `system-model/architecture.md` still says "no second lender approval" twice, and the file no longer notes that this is disputed. Its "unresolved, no new behavior chosen" statement now exists only in the guide.
- "A narrative or diagram cannot supply a missing approval" now has no owner anywhere.
- The settled payment-account rule in the loan-terms domain record was replaced by an overstated "unresolved conflict" bullet. That bullet also points to the wrong FLOW-001 section ("Preconditions"; the text is in "Failure And Reroute").
- The participant domain record lost its rationale section. Its concise rationale now exists only in the guide, with fragments in build records and tickets.
- Statements that a visual or a local design check proves nothing no longer have an owner.

**The answer key**
- Several of its owner sections cite narrative text the migration moved, so they no longer exist in snap-t7.
- It misses two real conflicts in the records: whether there is an on-chain pause role, and where H(S) and the offer/reservation identity sit.
- It does not mention SEL-005.
- Its settled reading of L-9 is correct; the migrated record is wrong.
