# Handoff Sequence

**Current order group:** `3`

Finish every slice in group `N` before starting group `N+1`. Slices inside one group may proceed in parallel. Keep every slice in this table and schedule runnable independent work before unrelated blockers.

| Order group | Delivery slice | Repository | Build Units | Requires | State |
| ---: | --- | --- | --- | --- | --- |
| 1 | `[repo-001-foundation](./repo-001-foundation.md)` | `REPO-001` | `BU-001`, `BU-002` | `None.` | `Implemented` |
| 2 | `[repo-003-shared-contracts](./repo-003-shared-contracts.md)` | `REPO-003` | `BU-003` | `repo-001-foundation` | `Implemented` |
| 3 | `repo-002-core-service` | `REPO-002` | `BU-005` | `repo-003-shared-contracts` | `Next` |
| 4 | `repo-004-supporting-tool` | `REPO-004` | `BU-004` | `repo-001-foundation` | `Blocked — <exact reason>` |
| 5 | `repo-002-client-web` | `REPO-002` | `BU-006` | `repo-002-core-service`, `repo-004-supporting-tool` | `Waiting` |

`Blocked` means the slice has its own unresolved problem. `Waiting` means the slice has no known local blocker and is held only by earlier groups. Default to one slice per repository. Split a repository only when a proper Build Unit subset can become ready earlier as an independently buildable and verifiable slice, and name every omitted Build Unit in a later slice. Give every slice a unique repository-prefixed slug.
