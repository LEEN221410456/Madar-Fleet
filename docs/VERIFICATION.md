# Combined repository verification

Executed on **11 November 2026**, after organizing the connected application into `frontend/` and `backend/`.

| Check | Result |
| --- | --- |
| Frontend locked dependency installation (`npm ci`) | Passed |
| Frontend domain tests (`src/lib/fleet.test.js`) | 60 passed |
| Frontend interaction tests (`src/App.test.jsx`) | 24 passed |
| Frontend production build (`npm run build`) | Passed |
| Backend rules tests (`VehicleRulesTest`) | 7 passed |
| Backend HTTP integration tests (`VehicleApiIntegrationTest`) | 11 passed |
| Backend service tests (`VehicleServiceTest`) | 16 passed |
| Backend package (`mvn clean verify`) | Passed; executable Spring Boot JAR produced |

Local tools: Node.js 24.21.0, npm 11.19.0, JDK 26.0.2 and NetBeans' bundled Maven 3.9.9. Maven compiled the backend with Java release 17. GitHub Actions separately verifies the backend on JDK 17.

The local frontend folder was missing `src/data/vehicles.js`, which both frontend test suites import. Its fictional sample records were restored from the original Part 1 repository, with the comment updated to describe their use as test fixtures. The connected application continues to load vehicle records from the Spring API.

Backend HTTP integration tests start a real embedded Spring server on a temporary port and use an in-memory H2 database. They cover create/read/update, pagination, filters, summary, removal/restore and invalid requests. Frontend tests use a mocked HTTP boundary. Browser and restart checks performed for the earlier connected edition remain documented in [the frontend verification](../frontend/docs/CONNECTED-VERIFICATION.md) and [the backend verification](../backend/docs/VERIFICATION.md); those browser checks were not repeated for this folder reorganization.

The root workflow runs Node/frontend and Java/backend jobs from their respective directories. Local databases, Maven output, npm dependencies, frontend builds and environment files are ignored. Original Part 1 reports, screenshots and test evidence remain in `frontend/docs/part-1-original/`; the original standalone source remains in Git history and at the `part-1` tag.
