# Connected backend verification

Verified on 11 November 2026 with JDK 26.0.2, NetBeans' bundled Maven 3.9.9, and Spring Boot 4.0.9. The Maven project targets Java 17. The command `mvn clean verify` completed and produced an executable JAR.

| Suite | Checks passed | What it verifies |
| --- | ---: | --- |
| VehicleServiceTest | 16 | JUnit and Mockito checks for create, ID lookup, pagination, update, duplicates, and invalid inputs |
| VehicleRulesTest | 7 | Model year, calendar dates, registration normalization, and optional fields |
| VehicleApiIntegrationTest | 11 | Real Spring HTTP requests for CRUD, pagination, filters, service ordering, summary, removal, and restore |
| Total | 34 | No failures, errors, or skipped tests |

The Spring Maven Run goal was exercised on port 8080 with a temporary H2 file initialized by the preceding backend edition. The connected server read all eight seeded vehicles. The Vite frontend at port 5173 used its default proxy; the browser loaded a second page, added MF-009, opened it by exact ID, and saved Jeddah and 27,310 km. The browser showed the saved change after refresh. The executable JAR was then started against the same H2 file, and a request through the Vite proxy retrieved the saved record with both updated fields.

The temporary database and generated build files are excluded from the ZIP.
