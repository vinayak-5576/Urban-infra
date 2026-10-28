# Agent Rules for Urban Infrastructure Intelligence

You are working on a student engineering project. Follow these rules in every task:

1. **Inspect before changing.** List the relevant files and read them first. Do not overwrite or rewrite working modules; make the smallest change that meets the requirement.
2. **Work incrementally.** Do only what the current stage asks. Do not add features, services or dependencies that are not listed. Ask before adding a new dependency and explain why.
3. **Keep API contracts stable.** If a contract must change, update the OpenAPI schema, the frontend types and the docs in the same change, and say so.
4. **Validate all input.** Return structured errors with correct HTTP codes. Never trust client-supplied user ids, roles, or file types.
5. **Database changes go through reproducible schema & migrations.** Seed data must be reproducible from a script with a fixed random seed.
6. **Never commit secrets.** Read configuration from environment variables. Only `.env.example` with placeholders is committed.
7. **Write tests for critical logic** (state transitions, SLA calculations, permissions, scoring, linking). Run the relevant tests and the build after every stage and paste the real output.
8. **Label demo or synthetic data clearly** in data and UI (`is_demo = true`, `is_synthetic = true`). Never present synthetic results as real.
9. **Document setup and run commands** in README and update docs for anything you add.
10. **At the end, report honestly:** what is done, what was tested and the results, what is unfinished or fragile, and any assumptions. Record unfinished work in `docs/KNOWN_LIMITATIONS.md`. Do not claim something works unless you ran it.
