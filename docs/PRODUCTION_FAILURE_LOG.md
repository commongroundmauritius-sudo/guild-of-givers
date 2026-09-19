# Production Failure Log

This document records production-validation failures, evidence, attempted fixes, and the review required before the next code change.



## 2026-09-19 — PR #115 production validation

### Rule introduced
Before changing production code for a recurring CI failure:
1. Record the exact failing run, job, test, selector, and observed behavior.
2. Identify whether the failure is application behavior, test behavior, CI/environment behavior, or an interaction.
3. Review the current implementation and the complete signup/test path.
4. State a falsifiable root-cause hypothesis.
5. Make the smallest targeted change only after that review.
6. Re-run the same production gate and append the new evidence here.
7. Do not mark the issue fixed until the complete journey passes.

### Failure history

| # | Area | Evidence | Classification | Action |
|---|---|---|---|---|
| 1 | Cookie banner | Compliance E2E found the banner still visible after Reject Optional. DOM showed the `region` remained mounted without hidden state. | Application/UI implementation | Reworked cookie consent, then ultimately removed the optional consent UI entirely. |
| 2 | Cookie preferences | Compliance E2E could not find the Cookie Preferences dialog after opening preferences. | Application/UI implementation | Removed the optional consent/preferences system and replaced tests with absence-of-optional-tracking checks. |
| 3 | Signup heading | Signup E2E initially used a generic `h2` locator and matched `Monthly Contribution` when the test expected `Your details`. | Test selector | Changed the assertion to the accessible heading name `Your details`. |
| 4 | Signup step transition | After selector correction, the signup journey still failed at the first transition: the test could not observe `Your details` after clicking Start. | **Unresolved; requires root-cause review** | Do not assume selector/timing. Inspect signup state transition, hydration, route/runtime behavior, browser console/errors, and trace evidence. |
| 5 | Signup start button after attempted mitigation | Commit `b5c072f40cea6044912b99d8e6c9feea52d0b2b3` added an `isClientReady` gate and renamed the initial button to `Loading…` until a client effect runs. CI then failed because `getByRole(button, {name: "Start my monthly impact"})` found no element for 10 seconds. | **New regression introduced by attempted mitigation** | Revert/replace this mitigation only after reviewing the actual hydration/state behavior. The evidence does not prove that client readiness was the root cause. |

### Latest verified CI evidence

Commit under test: `b5c072f40cea6044912b99d8e6c9feea52d0b2b3`

Production validation run: `35402228245`

Validation job: `105784391365`

Security Audit: **passed**

Production validation: **failed**

All of the following passed before the signup gate:
- formatting
- lint
- production build
- production worker output validation
- test build
- test worker output validation
- Playwright browser installation
- preview startup
- admin E2E
- auth E2E
- compliance/cookie E2E (3/3)

Signup failure:
```
expect(locator).toBeEnabled() failed

Locator: getByRole('button', { name: 'Start my monthly impact' })
Expected: enabled
Timeout: 10000ms
Error: element(s) not found
```

The failure occurred at line 10 of `tests/e2e-signup-journey.spec.ts`, before the click.

### Current implementation under review

`src/routes/signup.tsx` currently initializes:
- `step` to `0` for normal signup;
- `amount` to `450`;
- `isClientReady` to `false`;
- a `useEffect` that sets `isClientReady(true)` and captures attribution/local storage;
- the Start button renders **Loading…** while `isClientReady === false`;
- the Start button calls `setStep(1)` when clicked.

The current test expects the accessible button name **Start my monthly impact** before clicking.

### Review conclusion before next code change

The latest failure **does not establish that the signup application is broken because of hydration**. The attempted readiness gate created a new observable failure: the expected button is absent while the client-ready effect has not been observed by Playwright.

The previous failure also did not prove that hydration was the root cause; it only proved that clicking the original Start button did not result in the expected Details heading within the test.

Therefore the next change must **not** be another timing/selector tweak.

### Required investigation before next code change

1. Inspect the exact signup component state transition and all code that can change `step`.
2. Inspect the rendered HTML/trace at the failing point.
3. Check browser console/runtime errors during `/signup`.
4. Check whether React hydration completes on this route.
5. Check whether an authentication redirect/effect changes the page state.
6. Check whether `useSearch({ from: "/signup" })` or route search parsing differs in the production worker.
7. Reproduce the transition with a diagnostic Playwright test that records:
   - URL,
   - visible headings,
   - button text,
   - React-visible DOM state,
   - browser console errors,
   - page errors,
   - network failures.
8. Only after that evidence is collected, choose the smallest application or test change.

### Do not declare fixed

The signup journey remains **RED** until this complete sequence passes in production validation:

**Amount → Details → Payment → Account → Done**

No merge should occur while this gate is red.


### 2026-09-19 diagnostic result — signup transition

The diagnostic run confirmed:
- URL remained `/signup`.
- The DOM remained on **Monthly Contribution**.
- The Start button was visible and enabled.
- No application/page JavaScript exception was captured.
- The only console errors were repeated **404 resource** responses.
- The same result occurred on retry.

This rules out the previously suspected button-disabled state and makes a client exception less likely. The next investigation must determine whether the click event itself fires and whether the React state update is being interrupted/re-rendered. The next test change therefore waits up to 5 seconds for the Details heading before collecting diagnostics, so the evidence distinguishes a transient render from a persistent state-transition failure.

### 2026-09-19 — control-test adjustment

Commit `ef6bda00404c91e68d19426c8d41bf0f7b798ac2` changes only the diagnostic test timing: it waits up to 5 seconds for the Details heading before throwing diagnostics. No signup application code was changed.


### 2026-09-19 — Root cause confirmed: production worker was not serving client assets

The latest diagnostic run identified the failed resources exactly:

- `/assets/index-BzHBiVog.js`
- `/assets/signup-DKEB08k1.js`
- `/assets/createServerFn-2LzDjJ8A.js`
- `/assets/validators-BqsJtm68.js`
- `/assets/arrow-left-CQ3I954W.js`
- `/assets/index-qy_pPuS9.js`
- `/assets/styles-ZuFrns6P.css`
- `/assets/logo-B2qccutl.png`
- `/favicon.svg`

All returned HTTP 404 from the production preview.

This explains the signup behavior: the server-rendered HTML is present, but the client JavaScript bundle containing React event handlers is not being served. Therefore the button is visible but its React `onClick` cannot execute.

The existing custom worker build generated `dist/client/_worker.js` and a Wrangler config with `main: "_worker.js"`, but retained the Pages-only `pages_build_output_dir` configuration and did not configure Workers Static Assets. Current Cloudflare documentation states that a Worker with a `main` entry point needs an `assets.directory` configuration to serve static assets. citeturn0search0turn0search1

### Corrective action

The build-worker script is being changed so the generated Worker config:
- removes `pages_build_output_dir`;
- keeps `main: "_worker.js"`;
- configures `assets.directory: "."` because the generated Wrangler config lives inside `dist/client`;
- creates `.assetsignore` so the Worker/config files are not exposed as static assets.

This is an infrastructure fix, not a signup-flow workaround.

### Validation required

The next production validation must prove:
1. the generated asset URLs return HTTP 200;
2. the signup React bundle loads;
3. Amount → Details transition works;
4. the complete signup journey passes;
5. all existing production gates remain green.
