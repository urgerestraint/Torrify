# Contributing to Torrify

Thanks for contributing.

## Before You Start

- Search existing [issues](https://github.com/caseyhartnett/torrify/issues) and pull requests.
- For larger changes, open an issue first to align on approach.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Setup

```bash
git clone https://github.com/caseyhartnett/torrify.git
cd torrify
npm install
npm run electron:dev
```

## Common Commands

- `npm test` run tests
- `npm run test:coverage` run tests with coverage
- `npm run lint` run lint checks
- `npm run build` build renderer and Electron bundles
- `npm run docs:dev` run docs locally

## Contribution Expectations

- Keep pull requests focused and reviewable.
- Add or update tests when behavior changes.
- Update docs when user or developer workflows change.
- Use clear commit messages and PR descriptions.

## Pull Request Checklist

- [ ] Tests pass locally
- [ ] Lint passes locally
- [ ] Docs updated if needed
- [ ] Screenshots included for UI changes

## Reporting Bugs

Please include:

- OS and version
- Torrify version
- Steps to reproduce
- Expected result
- Actual result
- Logs or screenshots when possible

## Feature Requests

Open an issue with:

- Problem statement
- Proposed behavior
- Alternatives considered
- Scope (small enhancement vs large feature)
