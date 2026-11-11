# Connected edition verification

Verified on 11 November 2026. The two archives are a matched pair. The original Part 1 documents describe the earlier in-memory edition.

- Frontend: 84 passing checks across two suites. The Vite production build also completed.
- Backend: 34 passing checks, including real Spring HTTP tests and JUnit/Mockito service tests.
- Browser: ran Spring at port 8080 using the Maven goal mapped in NetBeans and Vite at port 5173. The dashboard connected, the Next button loaded another server page, and adding a vehicle in React assigned MF-009.
- In the browser, the Find by asset ID control opened MF-009. Saving Jeddah and 27,310 km updated the registry, and refreshing and paging back to the row showed the same values.
- After a Spring restart with the same H2 file, the updated record was retrieved again through Vite's API proxy. Testing used a temporary copy of the demo database; neither ZIP includes the test record.
- The updated server also opened a database first initialized by the preceding Part 2 build and listed its eight original vehicles.
