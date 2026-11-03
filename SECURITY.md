# Security Policy

## Supported scope

Security fixes are handled against the current `main` branch and the currently deployed site. Historical branches and retired prototypes are not supported release lines, but historical credential exposure still requires provider-side revocation or rotation.

Security-sensitive areas include:
- article and source publication integrity;
- npm dependencies, GitHub Actions and the Pages deployment pipeline;
- credentials and tokens used by build, analytics, search or external integrations;
- privacy and consent handling.

## Reporting a vulnerability

Do not publish suspected exploitable vulnerabilities, credential values, private URLs, access tokens or proof-of-concept payloads in public issues, pull requests or discussions.

Use GitHub's private vulnerability reporting from the repository Security tab when it is enabled. If private reporting is unavailable, contact the site owner through a private channel before public disclosure. Include the affected component, impact, a minimal reproducible description and the affected commit, but never include a live secret value.

## Credentials and exposure response

Never commit API keys, OAuth tokens, passwords, private keys, production environment files or personal data.

If a credential may have been exposed:
1. identify its type and provider without copying its value into the report;
2. revoke or rotate it at the provider;
3. verify the replacement through the existing owner-controlled operational process;
4. remove the exposed value from reachable Git history where appropriate, but do not treat history rewriting as revocation.

## Automated controls

- The required `validate` CI check runs Gitleaks against the full Git history on pull requests and pushes to `main`.
- Dependabot monitors npm dependencies and GitHub Actions. Updates arrive as reviewable PRs; automatic merging is not configured.
- Repository-hygiene checks reject unpinned GitHub Actions, temporary workflows, generated build output and tracked credential files.

## Responsible testing

Test only systems, accounts and data that you are authorized to access. Do not use exposed credentials, access another person's data, perform destructive provider operations or run denial-of-service tests. Production mutation requires separate, explicit owner authorization for the exact operation.
