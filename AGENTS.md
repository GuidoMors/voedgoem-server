# Contributor instructions

- Read [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) and the relevant [requirements](./REQUIREMENTS.md) before implementation.
- When adding a game, complete the cross-repository [new-game checklist](../voedgoem/README.md#adding-a-game): discover and apply its favicon, theme its hub bar and statistics tab/modal, register statistics, and verify its results path.
- The game registry is generated. Follow [README.md](./README.md), not historical instructions to edit a shared registry manually.
- Keep server validation, per-viewer hidden information, read-only display accounts, and exclusion of bot results intact.
- Preserve unrelated work. Use additive migrations; a request for local migration does not authorize remote changes. Do not commit or deploy without explicit approval.
