# Follow-ups from security audit fixes (template side)

Issues noticed while implementing and reviewing the plan; none were in
scope. Review, delete what does not matter, then `/plan-steps FOLLOW-UPS.md`.

- `.github/workflows/deploy.yml:69-83` (step `Check the GitHub environment is configured`) — only `SERVER_SSH` and `SSH_KNOWN_HOSTS` are tested for empty; an unset `ENV_FILE` writes an empty `envs/<env>/.env` and the deploy goes ahead with it, and an unset `SSH_PRIVATE_KEY` surfaces as an opaque SSH failure — the deploy does not fail closed for those two, and `README.md:91-95` ("a missing setup is one clear error instead of an SSH failure") is not true for them (step 2)
- `.github/workflows/ci.yml:16-19,34-35`, `.github/workflows/deploy.yml:27,64,67` — every action is now pinned to a commit SHA and the repo has no `.github/dependabot.yml` (`github-actions` ecosystem), so the pins never move; they already sit on old majors (`checkout` v5.1.0, `setup-buildx-action` v3.12.0, `build-push-action` v6.19.2) — the workflows stop receiving security fixes unless something bumps them (step 2)
- GitHub repository settings (manual, not a code step) — the audit's finding 12 is still open: no ruleset on `main` and no "require actions to be pinned to a full-length commit SHA"; the plan's Decisions left it as a manual task for the user and `PLAN.md` is deleted, so this bullet is the only record — without it nothing stops a tag pin from coming back (steps 2, 3)
