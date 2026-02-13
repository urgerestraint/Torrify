# Playwright Smoke Tests

These tests intentionally cover only stable smoke flows:

- text input works
- LLM request flow works
- render request flow works

## Run

1. Install Playwright browser:
`npm run test:e2e:setup`

2. Run tests:
`npm run test:e2e`

## Linux dependency troubleshooting

If you see:
`error while loading shared libraries: libnspr4.so`

Install Playwright system dependencies:

- Debian/Ubuntu:
`sudo npx playwright install-deps`

or install directly:
`sudo apt-get update && sudo apt-get install -y libnspr4 libnss3`

Then rerun:

`npm run test:e2e`
