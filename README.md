# Fynx

A modern Angular (v17) web app. This README collects the essentials for running, developing, testing, and shipping the project.

## Table of contents
- Overview
- Requirements
- Quick start
- Common scripts
- Project structure
- Development tips
- Testing
- Build and deploy
- Troubleshooting

## Overview
- Single-page application built with Angular CLI 17.1.
- Designed for a 4200-localhost dev loop with live reload.
- Uses the default Angular workspace layout (src/app for features and shared code).

## Requirements
- Node.js 18 or 20 (Angular 17 supports LTS 18/20).
- npm 9+ (ships with Node) or pnpm/yarn if you prefer.
- Angular CLI 17 installed globally helps for direct `ng` commands: `npm i -g @angular/cli@17`.

## Quick start
1) Install dependencies: `npm install`
2) Start the dev server: `ng serve` (or `npm start` if a script is set up)
3) Open the app: http://localhost:4200/

## Common scripts
- Dev server: `ng serve`
- Build (production): `ng build`
- Unit tests: `ng test`
- E2E tests: `ng e2e` (requires a configured e2e runner)

## Project structure
- src/main.ts — bootstraps the Angular app
- src/app/ — features, shared components, services, and routing
- src/assets/ — static assets (images, fonts, etc.)
- src/environments/ — environment config files (dev/prod)

## Development tips
- Keep features modular: prefer `src/app/<feature>/` folders with their own routing and services.
- Reuse UI elements via shared components/modules instead of duplicating markup.
- For HTTP calls, centralize API endpoints in a service and handle errors with interceptors.
- If you add global styles, scope them carefully to avoid leaking into feature styles.

## Testing
- Run unit tests during development: `ng test --watch`
- Keep components shallow: mock services and use TestBed only when needed to keep tests fast.
- If adding e2e, pick one runner (e.g., Cypress, Playwright) and document its setup under `e2e/`.

## Build and deploy
- Production build: `ng build --configuration production`
- The optimized output lives in `dist/`. Deploy that folder to your static host (e.g., Firebase Hosting, Netlify, Azure Static Web Apps, S3/CloudFront).
- Set environment-specific values in `src/environments/environment*.ts` rather than hard-coding URLs or keys.

## Troubleshooting
- Mismatch Node version: verify with `node -v` and align to 18/20.
- Port already in use: run `ng serve --port 4300` (or any free port).
- Stale deps or cache issues: delete `node_modules` and run `npm install` again.
- Angular CLI not found: install globally (`npm i -g @angular/cli@17`) or use `npx ng ...`.
