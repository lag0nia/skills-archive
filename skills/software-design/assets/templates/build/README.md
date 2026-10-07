# Build

Before Stage 8, this is a compact entry for the workflow and record links that actually exist. Once the first Build Unit exists, replace that entry with the guide below. This guide is where a human learns how the system is built; it must be understandable without opening tickets, Build Unit records, or Repository Build Designs.

## Construction At A Glance

Replace this example with every canonical Repository and Build Unit. Begin with a brief whole-system orientation and, when applicable, link the [Build Unit Dependency Map](../diagrams/build-unit-dependency-map.canvas). Do not add another navigation, workflow, record, visual-navigation, or readiness section after this guide.

Keep each linked heading in its canonical `REPO-xxx — Name` or `BU-xxx — Name` form. In the descriptive paragraphs, use Repository and Build Unit names instead of bare IDs. When the first cross-record mention in this guide needs traceability, append the canonical ID in parentheses—for example, `Public API (BU-002)`—then use the name alone thereafter.

### [REPO-001 — Repository Name](./repositories/repo-001-repository-name/README.md)

Explain what this repository contributes to the whole system, its workspace shape, why these Build Units share source control, and how their artifacts work together. Give the reader a useful mental model, not a link catalog.

#### [BU-001 — Build Unit Name](./units/bu-001-build-unit-name.md)

Explain what this Build Unit does and produces, where it lives, and the main input or output that connects it to the rest of the system.

Explain why it is independently buildable and testable, what its key dependencies are, and the authority or responsibility it deliberately does not own. Use as many short paragraphs as clarity requires.

Use `### External Or Unassigned Build Units` only when a canonical Build Unit has no first-party Repository. Give each of its Build Units the same `####` explanation and state its explicit disposition. Keep exact mappings, module trees, constraints, commands, verification obligations, ticket history, and readiness routing in their canonical records; do not make a reader open them merely to understand the basic construction model.
