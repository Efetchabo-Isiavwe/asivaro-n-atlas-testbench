# Contributing

Thank you for your interest in improving Asivaro N-ATLAS TestBench.

## Before opening an issue or pull request

- Search existing issues and avoid duplicates.
- Describe the behaviour you observed and what you expected.
- For bugs, include browser, device, steps to reproduce, and sanitised error details.
- Never publish API keys, access tokens, credentials, private user data, or confidential prompts.
- Clearly distinguish interface-only testing from a successful live request to an authorised N-ATLAS endpoint.

## Development guidance

The project targets the AppDeploy runtime. The frontend uses `@appdeploy/client`; backend routes use `@appdeploy/sdk`. A standalone development setup needs compatible replacements for the API transport and route host.

Suggested review checklist:

1. Keep user-facing errors clear and avoid exposing credentials.
2. Validate inputs and restrict outbound gateway requests to authorised public HTTPS URLs.
3. Test empty or invalid inputs, gateway failures, and successful responses when an authorised test endpoint is available.
4. Check the responsive layout on desktop and mobile.
5. Verify that JSON exports contain the expected fields and do not contain API keys.
6. For language-related changes, document the language, prompt, evaluation method, and limitations. Do not claim language-quality gains without evidence from qualified reviewers.

## Pull requests

- Keep changes focused and explain the reason for the change.
- Update `docs/TECHNICAL.md` and the README when architecture, safeguards, setup, or status changes.
- Add or update test scenarios in `tests/tests.json` when relevant.
- Include test steps and results in the pull request description.
- Do not claim beta testing or live N-ATLAS integration unless it has actually happened and the evidence can be shared safely.

By contributing, you agree that your contribution is provided under the repository's MIT License.
