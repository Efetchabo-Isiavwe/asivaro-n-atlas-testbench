# External Beta Test Plan — Asivaro N-ATLAS TestBench

## Purpose

Collect honest feedback from at least two developers who are not part of the core project team. This plan distinguishes interface/usability checks from live N-ATLaS integration tests. Do not report live integration as tested unless an authorised endpoint returns a real model response.

Demo: https://asivaro-n-atlas-testbench-slcjjv.v2.appdeploy.ai/
Repository: https://github.com/Efetchabo-Isiavwe/asivaro-n-atlas-testbench

## Safety and test status

- Do not share API keys in screenshots, issue comments, chat, email, or this repository.
- Do not enter confidential, personal, employer, industrial, medical, or otherwise sensitive data.
- An interface-only test does not establish model accuracy or a working N-ATLaS integration.
- Do not invent results. Record the observed behaviour, including failures.

## Phase A — Interface checks (can be done without API credentials)

1. Open the demo in a current desktop browser and note the browser and date.
2. Select each available starter language in turn: Yoruba, Hausa, Igbo, and Nigerian-accented English. Check that the selected test and prompt are understandable and editable where supported.
3. Try to run a test without entering a gateway URL or key. Confirm that the app displays a clear validation message and does not show a fabricated model answer.
4. Add a short custom prompt, save it, and confirm it appears in the test list.
5. Export the test cases as JSON and check that the downloaded file is valid JSON and contains the expected test entries.
6. Review the interface on a narrow/mobile viewport and report any broken layout or confusing controls.
7. Note one thing that worked well and one change that would improve the tool.

## Phase B — Live API check (only when authorised access is available)

1. Confirm that the endpoint URL, model identifier, and API key were supplied or approved by an authorised provider.
2. Enter the URL, model identifier, and key in the app. Do not record or share the key.
3. Run one harmless test prompt, such as: “In one sentence, introduce yourself in Yoruba.”
4. Record whether a real response appears, the displayed model identifier, latency, and any error message.
5. If a request succeeds, try one additional language. Do not infer language quality from a single output.
6. Clear sensitive material from any screenshots. Never count an unsuccessful request as a successful integration.

## Tester report template

Copy and complete this report separately for each tester.

- Tester name or preferred identifier:
- Role / developer background:
- Confirmed outside the core project team? (Yes/No):
- Test date and time (include time zone):
- Browser/device:
- Phase completed: (A — interface only / B — live API):
- Steps completed:
- Expected behaviour:
- Actual behaviour:
- Any error messages (redact keys and personal data):
- One thing that worked:
- One problem or improvement:
- Live N-ATLaS response observed? (Yes/No/Not attempted):
- May the project owner cite this feedback in an application? (Yes/No):
- Optional screenshot or sanitized JSON output:

## Summary guidance

Keep each completed report as evidence. A tester should personally complete the test and author their own report. Report the number of external testers truthfully. If only Phase A is completed, describe the feedback as interface/usability validation, not live model validation.
