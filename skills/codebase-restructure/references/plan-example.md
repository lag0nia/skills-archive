# Plan Example: Step Readiness and a Material Decision

An illustrative excerpt, not a required architecture or wording. It shows how one plan keeps ready work moving while one decision is open, and how each explanation lives in one place.

Situation: in a small service, adding a notification channel means editing four places: the channel's own module, a `switch` in the dispatcher, the configuration schema and a hand-written list in the admin screen. Two of those copies have already drifted. The user asked to investigate and plan; no implementation yet. The confirmed need is one more channel next quarter; nobody has asked for third-party channel plugins, so none are designed.

```markdown
Status: Awaiting decision

## Questions and answers

- Q1: Channel settings would come from each channel's own declaration, which renames
  two environment variables (`SMS_KEY` becomes `NOTIFY_SMS_KEY`). The deployment
  scripts in this repository can be updated, but installations outside it may set
  the old names.
  - Options: (a) accept both names for one release, with a warning on the old one,
    then remove the old name; (b) keep the old names permanently as special cases;
    (c) rename at once.
  - Recommendation: (a). It keeps existing installations working, and the warning
    tells operators what to change. (b) keeps a special case in every future channel;
    (c) breaks installations that cannot be seen from here.
  - A: Open
  - Affects: Step 3

## Migration order

### Step 1: Characterize dispatch

- Readiness: ready
- Changes: tests in `tests/dispatch/` covering each existing channel through `dispatch()`
- Verify: the new tests run (expect 6) and pass against unchanged code

### Step 2: Channels declare themselves; dispatcher derives its table

- Readiness: after Step 1 is completed and verified
- Changes: each `channels/*.py` exports a descriptor; `dispatcher.py` builds its table
  from them; the `switch` is removed
- Verify: Step 1 tests pass; a search finds no channel names left in `dispatcher.py`;
  a throwaway test channel without settings needs only its own module

### Step 3: Configuration derived from channel declarations

- Readiness: after Step 2 is completed and verified; waiting on Q1
- Changes: the configuration schema reads the settings each descriptor from Step 2 declares
- Recovery: until the old names are removed, reverting this step restores the
  previous schema with no data migration
```

Notes on the reasoning:

- The plan status is `Awaiting decision` because part of it waits for the user. Only Step 1 is ready now; Step 2 becomes ready once Step 1 is done and verified, whatever happens to Q1. Readiness is not permission: whether any step may be executed depends on the request, not on the status.
- Step 3 has two conditions, and it is ready only when both are met. Answering Q1 while Step 2 is unfinished leaves Step 3 waiting for Step 2; finishing Step 2 while Q1 is open leaves it waiting on Q1.
- Step 3 refers to Q1 instead of repeating the explanation. Once answered, Q1 becomes context retained in the plan and is not asked again when the plan is revalidated or continued by another agent; it does not remove Step 3's other prerequisite.
- A step waiting on evidence would say what evidence and how to get it, for example "needs evidence: whether the external dashboard reads the admin list endpoint; check its access logs or ask its owner".
- Step 2's verification checks the architectural claim (one place to add a channel), not only that tests still pass.
