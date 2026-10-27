# Playwright API & E2E Automation Framework

A hands-on test automation POC using **Playwright, TypeScript, and Playwright Test**. The project demonstrates API testing, reusable fixtures, response validation, browser-based UI checks, parallel execution, test sharding, and GitHub Actions CI/CD.

## Key Features

- **API automation:** GET, POST, PUT, PATCH, and DELETE requests.
- **API assertions:** Validate HTTP status codes, response bodies, and headers.
- **Authentication:** Obtain and reuse authentication tokens.
- **Reusable utilities:** Centralized helpers for creating bookings and obtaining tokens.
- **Custom fixtures:** Manage test data setup and teardown.
- **Schema validation:** Validate response structures using JSON Schema and AJV.
- **Response-time checks:** Measure API request elapsed time and assert a threshold.
- **UI automation:** Browser navigation and UI assertions using Playwright locators.
- **Retries:** Demonstrate retry behavior and flaky-test detection.
- **Parallel execution:** Execute tests using multiple Playwright workers.
- **Test sharding:** Split the test suite across independent execution jobs.
- **CI/CD:** Execute tests through GitHub Actions and publish test artifacts.

## Technology Stack

- Playwright Test
- TypeScript
- Node.js and npm
- AJV for JSON Schema validation
- Restful Booker demo API
- GitHub Actions

## Project Structure

```text
playwright-api-e2e-poc/
├── .github/
│   └── workflows/
│       └── playwright.yml
├── fixtures/
│   └── api-fixtures.ts
├── schemas/
│   └── booking.schema.json
├── tests/
│   ├── fixtures.spec.ts
│   ├── api-ui-e2e.spec.ts
│   └── retry-demo.spec.ts
├── utils/
│   └── api-helper.ts
├── playwright.config.ts
├── package.json
├── package-lock.json
└── README.md
```

The structure above represents the intended organization. Adjust the test filenames to match the files currently present in the repository.

## Prerequisites

- Node.js and npm
- Git
- Visual Studio Code or another TypeScript editor

## Setup

Clone the repository:

```bash
git clone https://github.com/rhlpandey1/playwright-api-e2e-poc.git
cd playwright-api-e2e-poc
```

Install dependencies:

```bash
npm ci
```

Install the Chromium browser:

```bash
npx playwright install chromium
```

## Running Tests

Run the complete test suite:

```bash
npx playwright test
```

Run tests with a visible browser:

```bash
npx playwright test --headed
```

Run a specific spec:

```bash
npx playwright test tests/fixtures.spec.ts
```

Run tests using two workers:

```bash
npx playwright test --workers=2
```

Run tests sequentially:

```bash
npx playwright test --workers=1
```

## API Testing

The API tests use the Restful Booker demo API:

`https://restful-booker.herokuapp.com`

The framework demonstrates:

- Retrieving booking lists and individual bookings.
- Filtering bookings using query parameters.
- Creating bookings through POST requests.
- Updating bookings through PUT and PATCH requests.
- Deleting bookings.
- Authenticating and using the returned token.
- Validating response status codes, fields, and headers.
- Testing negative scenarios such as missing booking IDs.

The Playwright `request` fixture provides an API request context for tests. The API helpers accept an `APIRequestContext` parameter so they can be reused across multiple tests.

## Reusable Helpers and Fixtures

The API helper module centralizes reusable operations such as:

- `createBooking(request)`
- `getAuthToken(request)`

The custom fixture module provides test data and authentication values to tests.

Fixtures can perform setup before the test, expose data through `await use(value)`, and perform teardown after the test finishes.

Fixture dependencies can be declared explicitly. For example, a booking cleanup fixture can depend on an authentication fixture to obtain the token needed for deletion.

## JSON Schema Validation

AJV is used to validate API response structures against a JSON Schema.

Schema validation helps verify:

- Required fields are present.
- Fields have the expected data types.
- Nested objects have the expected structure.
- Unexpected response changes are detected when they violate the defined contract.

A field listed in `properties` is not necessarily mandatory. Required fields must also be listed in the schema's `required` array.

## Response-Time Validation

The framework demonstrates a basic elapsed-time assertion around an API request.

This is a lightweight check, not a load-testing solution. Response time can include network latency, client-side overhead, and server processing. Production performance tests should use defined SLAs and dedicated load-testing tools where appropriate.

## Playwright Execution Model

### Workers

Workers are separate OS processes that execute tests concurrently.

```bash
npx playwright test --workers=4
```

Increasing workers can reduce execution time, but it can also increase CPU, memory, and application load.

### Sharding

Sharding splits a test suite into independently executable partitions.

```bash
npx playwright test --shard=1/2
npx playwright test --shard=2/2
```

Shards are especially useful when executed concurrently as separate CI jobs.

A shard is not the same as a worker or a Kubernetes pod. The CI platform determines where shard jobs run, while the Playwright configuration controls the workers inside each job.

## Retries and Flaky Tests

Retries can help identify intermittent failures.

Example configuration:

```typescript
retries: process.env.CI ? 2 : 0,
workers: process.env.CI ? 1 : undefined,
```

This configuration allows two retries in CI and no retries locally.

A test that fails initially but passes on retry is reported as flaky. Retries should not be used to hide genuine application defects or unstable test design.

## GitHub Actions CI/CD

The GitHub Actions workflow automates the following steps:

1. Checks out the repository.
2. Sets up Node.js.
3. Installs dependencies using `npm ci`.
4. Installs the required Playwright browser.
5. Executes the test suite.
6. Uploads HTML reports and failure artifacts when configured.

The workflow can use a matrix strategy to execute multiple shards concurrently.

Repository workflow:

https://github.com/rhlpandey1/playwright-api-e2e-poc/actions

## Reports and Debugging

Show the HTML report:

```bash
npx playwright show-report
```

Useful debugging options include:

```bash
npx playwright test --debug
npx playwright test --trace on
```

Traces and test-result artifacts can help investigate failed assertions, browser interactions, and network requests.

## Environment Configuration

The API base URL can be overridden through an environment variable:

```powershell
$env:API_BASE_URL="https://restful-booker.herokuapp.com"
npx playwright test
```

Credentials and other secrets should be stored in environment variables or a CI secret store, never committed to source control.

## Scope and Limitations

This is an educational POC using a public demo API and a separate public demo UI.

The combined API + UI test demonstrates API operations and browser assertions in the same test, but it does not prove that a booking created in the Restful Booker API is displayed in the separate public UI.

A production implementation should use an application whose UI and API share the same backend when validating a complete business workflow.

Other production improvements could include:

- Centralized environment configuration.
- Stronger response schemas and contract validation.
- More comprehensive test-data cleanup.
- Stable test environments and test data isolation.
- Authentication and authorization coverage.
- CI report aggregation across shards.
- Monitoring flaky-test rates and execution duration.

## Interview Topics Demonstrated

This project provides practical examples for discussing:

- APIRequestContext versus the built-in request fixture.
- Page, BrowserContext, and Browser.
- Fixtures and fixture dependency management.
- API authentication and CRUD testing.
- JSON Schema validation.
- Parallel execution and sharding.
- Retry behavior and flaky-test diagnosis.
- CI/CD using GitHub Actions.
- Environment variables and secret management.
- Test isolation and cleanup strategies.

## Author

QA Automation / SDET — Playwright, TypeScript, API automation, test framework design, and CI/CD.
