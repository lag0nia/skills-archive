# Design Discussion Examples

Worked examples for one fictional service. They show how to order questions, compare designs and test a proposal against scenarios. They are not a required architecture, wording or number of options, and the service's facts are invented.

Contents: Situation; A Question Round with a Dependent Question; Comparing Designs; Scenario Checks; Clarifying a Term.

## Situation

A photo-sharing service generates thumbnails inside the upload request: `uploads/handler.js` stores the original, calls `images/resize.js` for three sizes, stores the thumbnails and only then responds. Large uploads time out, and a failed resize fails the whole upload. The user asked: "Make uploads resilient. Plan it; don't implement yet." Deployment is defined in a separate infrastructure repository that the agent cannot read. No other consumer of thumbnails is known.

## A Question Round with a Dependent Question

The agent first establishes the facts it can find itself: the upload response is used by the web client and by a public API documented in `docs/api.md`; resizing is tested only through the handler; and `uploads/handler.js` has received three timeout fixes in a year. Then it asks one round, containing only the question whose prerequisites are settled:

> **Q1: Where should thumbnail generation run?**
>
> Uploads fail or time out because resizing happens inside the request. This decides the deployment shape and what the upload response can promise.
>
> - (a) A separate worker process. Resizing no longer shares the web process, so a large or failing image cannot slow or break uploads, and a failed resize can be retried on its own. Costs: a second long-running process to deploy and monitor, and a durable way to hand work to it, which would be a follow-up decision.
> - (b) A background task in the same process, started after responding, with a sweep at startup that regenerates thumbnails still missing after a restart. No new process or infrastructure. Costs: resizing still competes with request handling, and thumbnails pending at a restart arrive late rather than never.
> - (c) Keep resizing in the request and raise the timeout. The smallest change, but uploads still wait for resizing and still fail when it fails.
>
> Recommendation, provisional: (a), because it is the only option that isolates resizing from uploads. It assumes the host can run a second long-running process, which is defined in the infrastructure repository I cannot read. If it cannot, (b) still takes resizing out of the response time and is the fallback.
>
> Affects: Steps 2 to 5; which of them apply depends on the answer. If you choose (a), how work reaches the worker becomes a follow-up question.

Why the round looks like this:

- How work reaches a separate process is also a decision, but it exists only if (a) is chosen: (b) needs no handoff and (c) no worker. Asking it now would present its options as though (a) were settled, so it waits, and Q1's options carry no costs that belong to one particular handoff. The round mentions the branch in one line, with its assumption explicit.
- The recommendation is provisional because a fact it depends on is not available here; the question says which fact and what the fallback would be.
- Some work does not depend on Q1. The agent keeps investigating, for example which API clients read thumbnail URLs right after uploading, and plans Step 1, characterizing the current upload behavior, as ready. The user asked for a plan only, so nothing is executed: ready means specified well enough to execute, not permission. Under a request to plan and implement, the agent would carry out Step 1 while Q1 is open, without asking again.

The plan records the round. Steps that only some answers need say so in their readiness, so every answer leaves a coherent plan:

```markdown
## Questions and answers

- Q1: Where should thumbnail generation run? <options and recommendation as asked>
  - A: Open
  - Affects: Steps 2 to 5; which apply depends on the answer
- Q2: How does work reach the worker process?
  - A: Not asked yet: only needed if Q1 is (a)
  - Affects: Step 4

## Migration order

### Step 1: Characterize uploads
- Readiness: ready; needed under every answer to Q1

### Step 2: One resizing function
- Readiness: waiting on Q1, applies only if (a) or (b); after Step 1 is completed and verified

### Step 3: Thumbnails leave the request
- Readiness: waiting on Q1, applies only if (a) or (b); after Step 2 is completed and verified

### Step 4: Recovery and retries
- Readiness: waiting on Q1, applies only if (a) or (b): a worker handoff for (a), the startup sweep for (b); if (a), also waiting on Q2; after Step 3 is completed and verified

### Step 5: Raise the upload timeout
- Readiness: waiting on Q1, applies only if (c); after Step 1 is completed and verified
```

The user answers: "(a); the host can run a second process." The agent records the answer, its source and the confirmed assumption, marks Step 5 not applicable, and recomputes. Q2 can now be asked, and nothing else is open for this scope:

> **Q2: How does work reach the worker process?**
>
> The worker has to learn about new uploads, and a failed resize has to be retried.
>
> - (a) A jobs table in the existing database, polled by the worker. No new infrastructure; costs a table migration, a short polling delay and a small database load that grows with upload volume.
> - (b) A message broker. Immediate delivery and built-in retries, but a new service to run, secure and back up.
>
> Recommendation: (a). The metrics notes in the repository show a few hundred uploads a day, and no other consumer of upload events is confirmed. Reconsider if another part of the system needs those events.
>
> Affects: Step 4.

The plan now reads:

```markdown
## Questions and answers

- Q1: Where should thumbnail generation run? <options and recommendation as asked>
  - A: (a), a separate worker process. The user confirmed that the host can run a second process.
  - Affects: Steps 2 to 5; Step 5 not applicable
- Q2: How does work reach the worker process? <options and recommendation as asked>
  - A: Open
  - Affects: Step 4

## Migration order

### Step 1: Characterize uploads
- Readiness: ready

### Step 2: One resizing function
- Readiness: after Step 1 is completed and verified

### Step 3: Thumbnails leave the request
- Readiness: after Step 2 is completed and verified

### Step 4: Recovery and retries
- Readiness: waiting on Q2; after Step 3 is completed and verified

### Step 5: Raise the upload timeout
- Not applicable: Q1 was answered (a)
```

The answer to Q1 changes which steps apply, not what has been done. Steps 2 and 3 no longer wait on Q1 but are still not ready: Step 2 waits for Step 1 and Step 3 for Step 2, and none of them has been executed, because the request was to plan. Step 4 waits on Q2 as well as Step 3. Had the user chosen (b), Q2 and Step 5 would have been marked not applicable, and Step 4 would plan the startup sweep. Had they chosen (c), Q2 and Steps 2 to 4 would have been marked not applicable, leaving Steps 1 and 5. The agent does not ask for confirmation of the plan as a whole, or about hypothetical branches such as a future video feature nobody has mentioned.

## Comparing Designs

Suppose the user also accepts (a) for Q2: a separate worker fed by a jobs table. The interface between the upload handler and thumbnail generation is now consequential: the handler, the public API and the worker all depend on it. Every design must keep the documented response fields, allow a failed resize to be retried, and be testable without a running worker. The caller scenario used for both designs is the upload handler right after it stores an original.

Design A, request by identifier (sketch, not an approved contract):

```js
// uploads/handler.js
const photo = await photos.store(file);
await thumbnails.request(photo.id);
return { id: photo.id, thumbnails: thumbnails.urlsFor(photo.id) };

// thumbnails/index.js
request(photoId)   // records one job per photo; calling it twice is harmless
urlsFor(photoId)   // URLs that serve a placeholder until each size exists
```

It hides the size list, storage keys, job records and retries. The job store is passed in when the module is created: the database table in production, an in-memory store in tests. The resize library runs locally, so tests use it directly.

Design B, caller-specified work (sketch, not an approved contract):

```js
await thumbnails.enqueue({ photoId: photo.id, source: photo.storageKey,
                           sizes: [160, 640, 1280], format: "webp" });
```

It hides the job records and retries; callers choose sizes, format and source key. Dependencies are handled as in A.

| | A: request by identifier | B: caller-specified work |
| --- | --- | --- |
| What callers must know | a photo identifier | sizes, format and storage keys |
| Changing a size | one place, inside `thumbnails/` | every caller that enqueues |
| Backfill after adding a size | call `request` for existing photos | each caller works out the new jobs |
| Testing | through `request` and `urlsFor` with an in-memory job store | the same, plus each caller's size choices |
| Compatibility | response fields kept; placeholders until images exist | the same |
| Uncertainty | whether placeholders are acceptable to API clients (see Scenario Checks) | the same |

Recommendation: A. The size policy is one fact and belongs to thumbnail generation, not to each caller; B's flexibility serves no confirmed need. A hybrid that adds optional sizes to A would reintroduce B's scattering without a caller that needs it, so none is proposed.

Two designs were enough here. A third, publishing an "upload completed" event for any subscriber, was not drawn because no second consumer is confirmed; it becomes worth comparing if one appears.

## Scenario Checks

Design A, walked through the scenarios that could break it and compared with the current code:

| Scenario | Current code | Design A | Result |
| --- | --- | --- | --- |
| One size fails to resize | the upload fails | the job is retried; a placeholder is served meanwhile | improvement within the objective |
| The photo is deleted before its job runs | thumbnails are deleted in the same request | the job would recreate thumbnails for a deleted photo | design gap: the worker skips deleted photos; added to Step 4 |
| An API client reads thumbnail URLs right after uploading | real images | placeholders for a few seconds | conflicts with `docs/api.md`, which promises ready images |
| The worker restarts mid-job | not applicable | the job resumes from its record | acceptable |

The third row is a behavior change, not a detail: the code and the documentation agree that thumbnails exist when the upload returns. The agent does not redefine that silently. It asks whether API clients may receive placeholders (a desired change, announced to API consumers) or whether API uploads should keep waiting for thumbnails while the web client does not. Had the code and the documentation disagreed, it would first establish whether the code had a defect, recorded as a bug observation, or the documentation was stale, raised as a documentation question.

## Clarifying a Term

In this service, "photo" means the stored original in `storage/` and also the album entry, with caption and visibility, in `albums/`. That ambiguity matters to the design: "skip deleted photos" must say whether the original was removed or the album entry was hidden, because hidden entries can be restored from the trash and still need thumbnails. The agent states in the plan that the worker skips photos whose original has been deleted, using the words "original" and "album entry" that `docs/architecture.md` already uses. It creates no glossary and does not define routine terms such as job, worker or queue.
