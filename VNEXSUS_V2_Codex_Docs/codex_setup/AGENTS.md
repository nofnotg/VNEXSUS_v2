# VNEXSUS Codex Global / Project Instructions

## Core priority
Always prioritize the domain core first:
1. date-event extraction
2. evidence linkage
3. structured slot JSON
4. investigator/general-user outputs
5. auth/billing/admin
6. UI polish

## Non-negotiable rules
- Do not send full OCR text directly to an LLM to generate the final report in one step.
- Do not treat `insuranceJoinDate` as OCR-derived data. It is always user-provided case metadata.
- Do not confirm a core medical event without evidence.
- Do not put business logic in routes.
- Do not recreate internal HTTP self-calls between app routes.
- Do not build UI-first and retrofit the core later.

## Output discipline
Before implementation, always output:
- document understanding summary
- in-scope / out-of-scope
- system boundaries
- initial folder structure
- initial DB schema
- environment variables
- epic order
- top 5 risks

## Engineering style
- thin routes, thick services
- domain-driven module boundaries
- structured JSON first, rendering second
- evidence as a first-class contract
- deterministic validation before narrative generation

## Reporting format for each phase
- goal
- files created/changed
- code summary
- tests run
- run instructions
- remaining risks
- next step
