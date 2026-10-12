# Asivaro N-ATLAS TestBench

**A browser-based multilingual prompt-testing playground designed for N-ATLAS evaluation.**

- **Live demo:** https://asivaro-n-atlas-testbench-slcjjv.v2.appdeploy.ai/
- **Status:** deployed prototype; a successful live N-ATLAS request and external beta validation have not yet been confirmed.
- **Languages represented by starter tests:** Yoruba, Hausa, Igbo, and Nigerian-accented English.

## What it does

The TestBench provides reusable starter prompts and custom test creation, configurable HTTPS gateway settings, response review, latency and timestamp capture, local browser history, human ratings, and JSON export. It does not generate mock model answers: a live test needs an authorised compatible gateway and valid credentials.

## Project structure

- `src/App.tsx` — playground interface and client workflow.
- `src/index.css` — application styles.
- `backend/index.ts` — guarded POST route that forwards prompts to an OpenAI-compatible chat-completions endpoint.
- `backend/realtime.ts` and `backend/realtime-subscribers.ts` — AppDeploy real-time support.
- `docs/TECHNICAL.md` — architecture, safeguards, and current limitations.
- `tests/tests.json` — defined user-interface and gateway error test scenarios.

## Runtime and setup

This source snapshot targets the AppDeploy runtime: the frontend imports `@appdeploy/client` and the backend route uses `@appdeploy/sdk`. AppDeploy provides the application API transport and route hosting. A plain local Vite server alone does not host the backend route, so standalone local execution requires a compatible implementation of that API transport and backend route.

For the intended AppDeploy environment, use Node.js 20 or newer where applicable and the project scripts in `package.json`:

```bash
npm install
npm run dev
npm run build
```

Do not treat a successful frontend build or page load as a successful N-ATLAS integration test.

## Connecting an authorised gateway

1. Obtain the approved endpoint, authentication instructions, and model identifier from the authorised N-ATLAS access provider.
2. Enter the public HTTPS base URL and issued API key in the playground. The key is held in the current UI session and forwarded for the request; it is not intentionally saved in localStorage.
3. Run a test prompt and verify that the response, model identifier, and latency came from the live gateway.
4. Record request conditions, failures, and output review. Do not publish secrets, private prompts, or sensitive data in issues or screenshots.

The backend appends `/v1/chat/completions`, or `/chat/completions` when the supplied base URL already ends in `/v1`. The provider must support this OpenAI-compatible request format. Do not guess an endpoint or paste an API key into repository files.

## Current validation status

The web app is deployed. At the time this repository was prepared, no successful live N-ATLAS request or external developer beta test had been verified. The starter-language prompts have not been independently validated by fluent speakers. Do not describe the project as live-integrated, benchmark-validated, or externally beta-tested until supporting evidence exists.

## Safety and limitations

- Use only provider-authorised public HTTPS gateways.
- Do not enter confidential employer, customer, or industrial data into a public endpoint.
- This MVP is not intended for medical, industrial safety, or other high-consequence decisions.
- Model and endpoint availability depend on the authorised provider.
- N-ATLAS naming is used to describe the intended compatibility; this repository does not imply official endorsement or affiliation.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please submit reproducible findings, avoid including secrets or sensitive data, and label unverified behaviour clearly.

## Licence

This project is released under the MIT License. See [LICENSE](LICENSE).

## References

- [NAIC challenge page](https://ncair.nitda.gov.ng/naic/)
- [N-ATLAS model repository](https://huggingface.co/NCAIR1/N-ATLaS)
