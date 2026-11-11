# Test report

**Project:** Madar Fleet — SE411 Part 1  
**Execution date:** 22 October 2026  
**Result:** 81 automated tests passed; production build passed.

## Environment and commands

Executed locally on macOS using Node 24, npm, Vitest 3.2.7, jsdom 26.1.0, and Vite 7.3.7. Dependency versions are locked in package-lock.json. Browser checks used the Codex in-app browser against the locally served production build.

```sh
npm run test:coverage
npm run build
```

The final automated run completed in 11.06 seconds. The production build completed in 2.48 seconds. Timings describe this run and will vary by machine.

## Automated results

| Suite | Passed | Failed | Coverage of behavior |
| --- | ---: | ---: | --- |
| src/lib/fleet.test.js | 60 | 0 | Validation, normalization, duplicate plates, IDs, filters/sort, metrics, service dates, CSV |
| src/App.test.jsx | 21 | 0 | CRUD, assignment, About identities, navigation, combined filters, empty views, keyboard/focus, export, reset |
| **Total** | **81** | **0** | Both test files passed |

## V8 coverage

| Metric | Result |
| --- | ---: |
| Statements | 96.76% |
| Lines | 96.76% |
| Branches | 90.62% |
| Functions | 80.70% |

Coverage includes App.jsx, the components, and lib/fleet.js. It excludes styles, the bootstrap entry point, test files, and the sample-data file. The domain module has 100% line coverage and 89.58% branch coverage. JSX/SVG markup contributes to line coverage; this metric is not a visual-correctness guarantee. Some notification/help callbacks and fallback branches are not executed by the automated suite.

## Production-build result

Vite transformed 1,584 modules and generated a static index, bundled CSS, and bundled JavaScript. The main JavaScript bundle was approximately 262.32 kB (82.04 kB gzip) and CSS approximately 40.66 kB (9.28 kB gzip). Self-hosted fonts are separate assets. The build exited successfully.

## Browser verification

| Check | Observed result |
| --- | --- |
| Desktop overview and registry | Correct initial counts, SAR value, utilization and eight records |
| Create | Mazda 6 added as MF-009; registry increased to nine |
| Edit and assignment | Status changed to Assigned; driver and 1,500 km update displayed |
| Search | QA 9001 isolated the created vehicle |
| Delete | Confirmation named the vehicle; deletion removed it |
| Undo | Vehicle was restored |
| Service | Three qualifying records; overdue and upcoming labels displayed |
| About | Both supplied names and exact student IDs displayed |
| Refresh | Created QA record disappeared and original eight records returned |
| Phone, 390 × 844 | Bottom navigation, vehicle cards, direct actions, and edit drawer inspected |
| Horizontal overflow | Document width equalled the 390 px phone viewport |
| Desktop, 1440 × 1000 | Full navigation, overview illustration, summaries and registry inspected |
| Navigation scroll | Menu navigation returned to scroll position 0 after the final correction |
| Browser console | No captured warnings or errors in the final production-build session |

The browser-created QA vehicle was temporary test data and was removed by refresh. Screenshots in docs/screenshots show the running application. Form screenshots intentionally show the scrollable panel; remaining fields/actions can be reached within it.

## Execution notes and limitations

The first automated run exposed an overly strict text matcher for an asset ID displayed with adjacent year metadata. It was corrected to verify the named edit action. The final suite passed. A later browser check exposed retained scroll position on menu navigation; the application now scrolls to the top on navigation, and the final suite/build and browser check passed.

A development-server restart temporarily interrupted preview access. Final browser checks used the successfully built production output. The run does not claim exhaustive Safari/Firefox/Android/iOS testing, an external accessibility audit, real Saudi registration validation, or a GitHub Actions cloud run. The automated tests run in jsdom, not a full browser. The generated CI workflow will execute after the user uploads the repository and enables Actions.

## Evidence files

- evidence/automated-tests.txt — final executed test output, with local root paths normalized to <project>.
- evidence/production-build.txt — final build output.
- evidence/coverage-summary.json — machine-readable coverage totals; source keys normalized to repository-relative paths.
- screenshots/ — desktop and phone captures of the production application.
