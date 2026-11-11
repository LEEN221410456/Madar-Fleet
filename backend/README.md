# Madar Fleet Part 2 Spring Boot server

This Maven project implements the four vehicle operations required for SE411 Part 2: create, find by asset ID, list with pagination, and update. The server can be run and tested on its own or with the React application in [`../frontend`](../frontend/), which forwards API requests to this server on port 8080. See the [repository setup guide](../README.md).

## Open in NetBeans

1. Clone the repository. In NetBeans, choose **File → Open Project** and select the **backend** folder containing `pom.xml`. Open it as the existing Maven project.
2. Select a JDK supported by Spring Boot 4.0.9. The project targets Java 17 and was built with JDK 26.0.2 and NetBeans' bundled Maven 3.9.9. The first build needs network access to Maven Central.
3. Right-click **Madar Fleet Part 2** and choose **Run**. The included `nbactions.xml` runs the Maven goal `spring-boot:run`. Alternatively, run `MadarFleetApplication.java` from Source Packages.
4. Wait for the server startup message, then open **http://127.0.0.1:8080/api/vehicles?page=0&size=3**. A fresh project returns three records on the first page, with eight demo vehicles in total. **http://127.0.0.1:8080/api/vehicles/MF-001** retrieves the seeded Toyota Camry.
5. To run the JUnit and Mockito suite, right-click the project and choose **Test**. The HTTP integration tests start their own temporary server and database, so they can run while the regular server is up.

If you use Maven outside NetBeans, run these commands in the project folder:

```sh
mvn spring-boot:run
mvn clean verify
```

Run those separately: the server command stays running until you stop it. A build creates `target/madar-fleet-part-2-1.0.0.jar`, which you can also start with `java -jar`. If another app uses port 8080, set the `SERVER_PORT` environment variable or launch the JAR with `--server.port=8081` and use the matching port in the URLs.

## Try the API

See [the REST API reference](docs/API.md) for the route table, request and response examples, and validation errors. The included [sample requests](api-demo.http) can be copied to any HTTP client that supports that format. A browser address bar can exercise the two GET routes; use an HTTP client for POST and PUT.

## Architecture and storage

```
HTTP client
    → VehicleController     HTTP routes and input validation
    → VehicleService        vehicle rules, ID lookup and transactions
    → VehicleRepository     Spring Data JPA queries and pagination
    → H2                    vehicle records and unique registration keys
```

The file database is created under `data/` relative to the server's working directory. Data survives a restart when you run from the same directory or point both runs at the same database file. On an empty database, startup loads the eight fictional Part 1 records in order, with IDs `MF-001` to `MF-008` and service dates relative to the initial seed date. It does not seed a nonempty database. The seed can be disabled with `MADAR_SEED_DEMO_DATA=false`.

The server listens on the local machine only. Leave it running while starting React with `npm ci` and `npm run dev` in the repository's `frontend` folder. The frontend header will show **Connected to Spring**. Use the frontend URL printed by Vite to use the application.

The connected API also supports registry filters, whole-fleet dashboard totals, and server-backed removal and Undo. Removal keeps the stored record and reserves its registration so it can be restored. There is no hosted deployment or login requirement.

A fresh clone starts with the sample records. To carry over records saved in an earlier Part 2 project, stop both servers, back up the old `data` folder, and copy it into `backend` before the first run. Do not overwrite an existing database. The connected build can read the earlier schema. Databases are local files and are excluded from Git.

## Source and tests

- `MadarFleetApplication` starts Spring Boot.
- `VehicleController` exposes the four required routes, and `VehicleErrorHandler` translates validation, missing records, and duplicate registrations into useful HTTP responses.
- `VehicleService`, `VehicleRules`, and `VehicleIds` handle record operations and rules.
- `VehicleRepository` stores the records and queries one page at a time.
- `VehicleServiceTest` uses JUnit and Mockito for service-level tests with a mocked repository.
- `VehicleRulesTest` covers date, time zone, and normalization rules. `VehicleApiIntegrationTest` exercises the live Spring endpoints and a temporary H2 database.
- See [verification results](docs/VERIFICATION.md) for the actual build and test outcome.

This implementation was generated with AI assistance. The Part 1 course brief states that the Part 2 backend will be manually coded; confirm with your instructor before using this implementation in a submission.
