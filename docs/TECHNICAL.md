# Asivaro N-ATLAS TestBench — Technical Notes

## Status
This is a functional application scaffold for a configurable N-ATLAS-compatible gateway. It creates no mock model answers. A live run requires an authorised HTTPS gateway and valid API credentials. Until a real request succeeds, do not describe this build as live-integrated or benchmark-validated.

## Features
- Starter prompt tests for Yoruba, Hausa, Igbo and Nigerian-accented English.
- Create and delete custom prompt tests.
- Send prompts to a configured OpenAI-compatible N-ATLAS chat-completions endpoint.
- Capture response text, model identifier, latency and timestamp.
- Human ratings for accuracy, language quality and instruction following.
- JSON exports for test cases and run history.
- Test cases and run history stored in this browser's local storage.
- API key is not deliberately persisted in browser storage; it is forwarded with each request.

## API integration
The backend accepts a public HTTPS gateway base URL. It appends /v1/chat/completions, or /chat/completions when the provided base URL already ends in /v1. It sends a Bearer token and an OpenAI-compatible chat request. Confirm the official endpoint, authentication method and model identifier with NCAIR/ONDI before use.

## Limitations and safeguards
- Do not enter confidential employer or industrial data into a public model endpoint.
- Do not use this MVP to make medical, industrial safety or other high-consequence decisions.
- The backend blocks obvious local/private hostnames and private IP literals; use only a gateway supplied by an authorised provider.
- App code does not log the API key intentionally. The key is processed transiently by the backend. Review platform privacy and logging terms before use.
- Starter prompts are illustrative; have fluent speakers check the wording before making language-quality claims.
- No live model test or external beta test has yet been conducted by this scaffold.

## Attribution
“N-ATLaS is an initiative of the Federal Ministry of Communications, Innovation and Digital Economy, and powered by Awarri Technologies.”

## References
- Challenge: https://ncair.nitda.gov.ng/naic/
- Model access: https://huggingface.co/NCAIR1/N-ATLaS
- Challenge contact: naic@nitda.gov.ng
