# Peppermint contributor guidance

Peppermint is the NTC Block WordPress theme. Keep the installed directory
`wordpress-theme-peppermint` and the `ntc-block` translation and block namespaces.
Requirements and installation steps are in `readme.md`.

- Use core blocks, patterns, `theme.json`, and native editor controls. Preserve saved content.
- Follow WordPress coding standards. Escape output at its destination and translate user-facing strings.
- Write short, direct comments that explain intent. Keep user instructions in `readme.md`.
- Keep agent reports, credentials, uploads, dependencies, and generated output outside Git.
  `AGENTS.md` and `readme.md` are the only Markdown files in the repository.
- Run `composer install`, then `composer check`. Set `NTC_WORDPRESS_ROOT` to an
  extracted or installed WordPress root and run `php tests/run.php static --require-wordpress`.
- Run `npm --prefix tests/browser run setup` and install Chromium with Playwright.
  Run `npm --prefix tests/browser run test:profiles`. From `tests/browser`, run
  `npx playwright test --config=block-validation.config.mjs`.
  Set `NTC_PHP_BINARY` if PHP is not on PATH.
- Browser profiles require a running preview site. Set `NTC_TEST_BASE_URL`, inspect
  `npm --prefix tests/browser run test:full -- --list`, then run `test:full` before pushing.
  Use `test:component -- <name>` for scoped development. Do not accept new screenshot baselines automatically.
  Set `NTC_TEST_CHANNEL=chrome` to test installed Google Chrome. CI uses bundled Chromium.
- Claude Code cannot always approve `.local` domains, so it prompts for each request to a
  `.local` preview site. Give Claude the site's `http://127.0.0.1:<port>` address, and use
  that address for `NTC_TEST_BASE_URL`. Node cannot resolve `*.localhost` names on Windows.
  The site must serve its own URLs on that host. Configure that alias in the site, not in this theme.
- For visual changes, check the live Site Editor and frontend at phone, tablet, and desktop sizes.
  Check keyboard use, light/dark appearance, RTL, text expansion, and affected accessibility behavior.
- The local preview site loads this checkout through a directory junction, so edit here only.
  If a separate copy is ever used, compare it with `php tests/compare-theme-trees.php <active> <mirror>`.
  Record unavailable checks as not run.
- CI runs source checks and isolated block validation on Linux; it has no site database.
  Full frontend tests need preview fixtures. After the checks pass, CI publishes each pull request
  from this repository as a prerelease zip tagged `pr-<number>`. When `main` gets a new `Version`
  in `style.css`, CI publishes it as the latest release, tagged `v<version>`. Deployment is a separate operation.
- The compatibility tools are pinned prereleases because the older stable scanner crashes on PHP 8.5.
  Their results supplement runtime tests; they do not certify every PHP or plugin integration.

Local development files live in the ignored `.local/` directory: Composer packages
under `vendor/`, browser packages under `browser/node_modules/`, and generated test
results, logs, and images in their own subfolders. The link at `tests/browser/node_modules`
points there for Node resolution. Use the setup command above instead of `npm ci` in
`tests/browser`. Keep `package.json` and its lockfile there as tracked source.
