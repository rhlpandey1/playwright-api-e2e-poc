# Playwright API & E2E Automation — Interview Questions and Answers

This guide contains practical interview answers with realistic examples based on the `playwright-api-e2e-poc` project. Examples use TypeScript, Playwright Test, and the Restful Booker demo API where appropriate.

> **Important project note:** The current combined API + UI test creates and verifies a booking through the API, then checks a separate public demo UI. It does **not** prove that the created booking is displayed in that UI. A genuine business E2E test needs an application whose UI and API share the same backend.

## 1. What is `APIRequestContext`?

**Answer**

`APIRequestContext` is Playwright's API client context. It provides methods such as `get`, `post`, `put`, `patch`, and `delete` to send HTTP requests and inspect responses.

**Realistic example**

```ts
import { APIRequestContext, expect } from '@playwright/test';

async function createBooking(request: APIRequestContext) {
  const response = await request.post('/booking', {
    data: {
      firstname: 'Rahul',
      lastname: 'Automation',
      totalprice: 150,
      depositpaid: true,
      bookingdates: {
        checkin: '2026-11-01',
        checkout: '2026-11-05',
      },
      additionalneeds: 'Breakfast',
    },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  return body.bookingid as number;
}
```

Here, `request` is an existing API context passed into the helper. The helper does not create the context itself.

## 2. What is the difference between the `request` fixture and `APIRequestContext`?

**Answer**

The built-in `request` fixture is supplied by Playwright Test. Its value is an `APIRequestContext`. `APIRequestContext` is the type; `request` is the fixture variable.

**Realistic example**

```ts
import { test, expect } from '@playwright/test';

test('Get bookings', async ({ request }) => {
  const response = await request.get('/booking');
  expect(response.status()).toBe(200);
});
```

The test runner creates and supplies the context. In a reusable helper, we can type the parameter as `APIRequestContext`:

```ts
async function getBookings(request: APIRequestContext) {
  return request.get('/booking');
}
```

Manual creation is a different option:

```ts
import { request as apiRequest } from '@playwright/test';

const api = await apiRequest.newContext({
  baseURL: 'https://restful-booker.herokuapp.com',
});

try {
  const response = await api.get('/booking');
  expect(response.status()).toBe(200);
} finally {
  await api.dispose();
}
```

## 3. What is the difference between `Browser`, `BrowserContext`, and `Page`?

**Answer**

- `Browser`: the browser process/instance.
- `BrowserContext`: an isolated browser session with its own cookies and storage.
- `Page`: a tab or page within a context.

**Realistic example**

```ts
import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch({ headless: true });

try {
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await adminPage.goto('https://example.com');

  const customerContext = await browser.newContext();
  const customerPage = await customerContext.newPage();
  await customerPage.goto('https://example.org');

  await expect(adminPage).toHaveTitle(/Example Domain/);
  await expect(customerPage).toHaveTitle(/Example Domain/);
} finally {
  await browser.close();
}
```

In most Playwright Test specs, use the built-in `page` fixture. Playwright manages the browser context and page lifecycle for you.

## 4. Why use fixtures instead of creating test data in every test?

**Answer**

Fixtures centralize setup, reuse, and teardown. They reduce duplication and make dependencies explicit. A fixture can create a booking before a test and delete it afterward.

**Realistic example**

```ts
import { test as base, expect } from '@playwright/test';
import { createBooking, getAuthToken } from '../utils/api-helper';

type ApiFixtures = {
  bookingId: number;
  authToken: string;
};

export const test = base.extend<ApiFixtures>({
  authToken: async ({ request }, use) => {
    const token = await getAuthToken(request);
    await use(token);
  },

  bookingId: async ({ request, authToken }, use) => {
    const id = await createBooking(request);
    await use(id);

    const response = await request.delete(`/booking/${id}`, {
      headers: { Cookie: `token=${authToken}` },
    });

    expect(response.status()).toBe(201);
  },
});

export { expect };
```

`bookingId` depends on `authToken`, so Playwright resolves authentication before setting up the booking fixture. Confirm the API's actual deletion status in your environment; adjust the expected status if its documented contract differs.

## 5. What does `await use(value)` do in a custom fixture?

**Answer**

Code before `await use(value)` is setup. The value is made available to the test while it runs. Code after `await use(value)` is teardown.

**Realistic example**

```ts
bookingId: async ({ request }, use) => {
  const id = await createBooking(request); // setup
  await use(id);                           // test uses id
  await deleteBooking(request, id);        // teardown
}
```

If the test fails, Playwright still runs fixture teardown during normal test cleanup. Teardown itself can fail and should be asserted and reported.

## 6. Why is authentication needed for deleting a booking?

**Answer**

Some APIs protect update and delete operations. The test must authenticate and send the credential in the format expected by the API, such as a cookie or authorization header.

**Realistic example**

```ts
const tokenResponse = await request.post('/auth', {
  data: { username: 'admin', password: 'password123' },
});

expect(tokenResponse.status()).toBe(200);
const { token } = await tokenResponse.json();

const deleteResponse = await request.delete(`/booking/${bookingId}`, {
  headers: { Cookie: `token=${token}` },
});

expect(deleteResponse.status()).toBe(201);
```

Only use demo credentials for the public demo service. For a real application, load credentials from environment variables or a CI secret store; never commit real secrets.

## 7. What is the difference between normal assertions and JSON Schema validation?

**Answer**

Normal assertions check selected conditions or values. JSON Schema validation checks a response against a reusable contract: required fields, data types, nested structures, and other constraints.

**Realistic example**

A field-level assertion:

```ts
expect(booking.firstname).toBe('Rahul');
expect(typeof booking.totalprice).toBe('number');
```

A schema-based assertion using AJV:

```ts
import Ajv from 'ajv';
import bookingSchema from '../schemas/booking.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(bookingSchema);
const valid = validate(booking);

expect(valid, JSON.stringify(validate.errors, null, 2)).toBe(true);
```

A schema is especially useful when many tests should enforce the same response contract.

## 8. How does the JSON Schema `required` keyword work?

**Answer**

`required` lists the properties that must be present. `properties` defines validation rules for properties when they are present; listing a property under `properties` does not automatically make it mandatory.

**Realistic example**

```json
{
  "type": "object",
  "required": ["firstname", "lastname"],
  "properties": {
    "firstname": { "type": "string" },
    "lastname": { "type": "string" },
    "additionalneeds": { "type": "string" }
  }
}
```

If `firstname` is absent, validation fails. If `additionalneeds` is absent, this schema still passes because that field is optional. To require it, add `"additionalneeds"` to `required`.

## 9. Is a response-time assertion a performance test?

**Answer**

A simple elapsed-time assertion is a basic performance guard, not a load test. It includes network latency, client-side overhead, and server processing. A proper performance test measures behavior under load, throughput, latency distributions, and resource use.

**Realistic example**

```ts
test('Booking lookup responds within the agreed threshold', async ({ request, bookingId }) => {
  const start = Date.now();
  const response = await request.get(`/booking/${bookingId}`);
  const elapsedMs = Date.now() - start;

  expect(response.status()).toBe(200);
  expect(elapsedMs).toBeLessThan(2000);

  console.log(`Elapsed request time: ${elapsedMs} ms`);
});
```

The `2000` ms threshold is only an example. In a real project, base it on an agreed SLA and run measurements in a controlled environment.

## 10. What is the difference between workers and shards?

**Answer**

Workers are OS processes that run tests concurrently within a Playwright invocation. Shards partition the suite into separate invocations that can run as separate CI jobs or machines.

**Realistic example**

```bash
# More workers in one invocation
npx playwright test --workers=4

# Two separate partitions
npx playwright test --shard=1/2
npx playwright test --shard=2/2
```

If the two shard commands run concurrently in separate CI jobs, they can reduce wall-clock time. Running them one after the other on one laptop does not automatically speed up the overall suite.

## 11. Does one shard always run in one Kubernetes pod?

**Answer**

No. A shard is a logical partition, not an execution environment. A CI job may run on a hosted runner or in a Kubernetes pod. The pod can run one or more Playwright workers, depending on the job configuration and resource limits.

**Realistic example**

A pipeline might use four CI jobs, one per shard. Each job could run in one Kubernetes pod with two workers. That is four shards and up to eight Playwright workers in total. Another team could run the same shards on hosted CI runners without Kubernetes.

## 12. How do you choose the number of workers and shards?

**Answer**

Start with a baseline and measure. Consider total wall-clock duration, slowest-shard duration, CPU/memory, application load, flakiness, and CI cost. More concurrency is useful only while it improves throughput without harming stability.

**Realistic example**

In this POC, the observed times were:
- One worker: 15.4 seconds
- Two workers: 8.9 seconds
- Four workers: 9.6 seconds

Two workers were faster in that run. This can happen due to startup overhead, network variability, or resource contention. These results are a useful local observation, not a universal rule.

## 13. How does Playwright retry configuration work?

**Answer**

The `retries` setting controls how many extra attempts are allowed after a test fails. A test that fails on the initial attempt and passes on a retry can be reported as flaky. Retries help reveal intermittent problems but should not hide genuine defects.

**Realistic example**

```ts
// playwright.config.ts
retries: process.env.CI ? 2 : 0,
```

A deliberately retry-aware demo test:

```ts
test('Demonstrate a retry', async ({}, testInfo) => {
  console.log(`Attempt: ${testInfo.retry}`);
  expect(testInfo.retry).toBeGreaterThan(0);
});
```

Run it with:

```bash
npx playwright test tests/retry-demo.spec.ts --retries=1
```

It fails on the first attempt and passes on the retry. Do not leave this intentionally failing test in the normal suite unless the demonstration is deliberate.

## 14. What does `fullyParallel: true` mean?

**Answer**

It allows Playwright to schedule tests independently for parallel execution, including tests within the same spec file. Parallel execution can reveal hidden test-order dependencies, so tests must use isolated data and avoid depending on shared mutable state.

**Realistic example**

```ts
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,
});
```

If two tests update the same fixed booking ID, they may interfere with one another. A better approach is for each test to create its own booking and clean it up.

## 15. How does GitHub Actions execute the suite?

**Answer**

The workflow checks out code, installs Node.js and dependencies, installs the required browser, runs Playwright, and uploads reports or failure artifacts. A matrix can run shards as separate jobs.

**Realistic example**

```yaml
strategy:
  fail-fast: false
  matrix:
    shard: [1, 2]

steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-node@v4
    with:
      node-version: 22
      cache: npm

  - run: npm ci
  - run: npx playwright install --with-deps chromium
  - run: npx playwright test --shard=${{ matrix.shard }}/2
```

This is a minimal illustration of the sharding concept. The complete workflow should also upload reports using unique artifact names for each shard.

## 16. Why use `npm ci` in CI?

**Answer**

`npm ci` installs dependencies based on the lockfile and fails if `package.json` and the lockfile are inconsistent. It supports reproducible CI installs and does not update the lockfile.

**Realistic example**

```bash
npm ci
npx playwright test
```

Commit both `package.json` and `package-lock.json`. If a dependency changes, update the lockfile intentionally and commit it with the change.

## 17. How would you make this POC production-ready?

**Answer**

I would strengthen configuration, security, data isolation, contract validation, observability, and CI reporting. I would also verify that the end-to-end workflow uses a UI and API connected to the same backend.

**Realistic example**

For a production order service, I would:
1. Set the API base URL per environment.
2. Store credentials in CI secrets.
3. Create unique order data per test.
4. Validate API response schemas and error cases.
5. Verify the created order in the actual UI.
6. Clean up test data safely.
7. Aggregate reports across shards.
8. Track flaky-test rates and total pipeline duration.

## 18. Does the current combined test prove that an API-created booking appears in the UI?

**Answer**

No. The current combined test validates a booking through the Restful Booker API and then checks page content on a separate public demo UI. These checks run in one test, but they do not verify that the API-created booking appears on that UI.

**Realistic example**

A genuine order E2E test would:
1. Create an order with `POST /orders`.
2. Capture the returned `orderId`.
3. Open the actual order-management UI connected to that backend.
4. Search for that exact `orderId`.
5. Assert the customer, total, and status shown in the UI.
6. Verify the order via API if appropriate.
7. Clean up the order if the test environment supports safe deletion.

The critical point is that the UI and API must share the same backend or data store.

## 19. How would you debug a test that passes locally but fails in CI?

**Answer**

I would inspect the failing assertion, CI logs, trace, browser and dependency versions, environment variables, network behavior, timeouts, and concurrency. I would reproduce the failure under CI-like conditions before changing the test.

**Realistic example**

If a test passes locally but times out in CI:
1. Inspect the Playwright trace and HTML report.
2. Confirm the API URL and credentials are set correctly.
3. Check whether the runner can reach the external service.
4. Review worker count and shared test data.
5. Determine whether the timeout reflects a slow dependency or an incorrect locator.
6. Fix the underlying cause rather than simply increasing every timeout.

Useful commands:

```bash
npx playwright show-report
npx playwright test --debug
npx playwright test --trace on
```

## 20. How should secrets and environment-specific configuration be handled?

**Answer**

Keep non-sensitive environment configuration in environment variables. Store credentials and tokens in a CI secret store or an approved secret manager. Never commit real credentials or print them in logs.

**Realistic example**

In `playwright.config.ts`:

```ts
use: {
  baseURL: process.env.API_BASE_URL
    ?? 'https://restful-booker.herokuapp.com',
},
```

In PowerShell:

```powershell
$env:API_BASE_URL="https://restful-booker.herokuapp.com"
npx playwright test
```

In GitHub Actions, configure a repository secret and pass it to the step or job through the `env` property. Access it using `${{ secrets.SECRET_NAME }}`. Do not place the secret's actual value in the YAML file.

## 21. How would you explain the architecture of this POC in an interview?

**Answer**

I would explain the responsibilities by layer:

- **Specs:** describe scenarios and assertions.
- **Helpers:** encapsulate reusable API operations.
- **Fixtures:** provide test data, authentication, and lifecycle management.
- **Schemas:** define response contracts.
- **Playwright config:** controls base URL, retries, workers, reporting, and tracing.
- **GitHub Actions:** installs dependencies, executes tests, shards the suite, and stores artifacts.

**Realistic example**

A booking test requests `bookingId` from the fixture. The fixture uses `createBooking()` from the helper. The test reads the booking, validates its response against the schema, and the fixture cleans up the record afterward. CI executes the spec and retains the report if it fails.

## 22. How would you summarize this project in an interview?

**Answer**

Describe what you implemented, why you chose those patterns, and what you learned. Be precise about what is demonstrated and what remains a limitation.

**Example summary**

"I built a Playwright and TypeScript automation POC that covers API CRUD operations, authentication, reusable helpers and fixtures, schema validation, response-time assertions, retries, parallel execution, and CI execution through GitHub Actions. I also configured sharding to distribute the suite across concurrent jobs. Through the POC, I compared worker counts and observed that increasing concurrency does not always improve runtime. One limitation is that my current combined API/UI test uses a separate public demo UI, so I would connect both layers to the same application backend before claiming full business E2E coverage."
