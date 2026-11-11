# Requirements and acceptance criteria

The source is the supplied one-page SE411 Part 1 brief. Items below distinguish assignment requirements from chosen enhancements.

## Assignment traceability

| ID | Requirement | Implementation / evidence | State |
| --- | --- | --- | --- |
| R1 | React project | React entry point, components, package.json | Implemented |
| R2 | Menu between different features | Overview, Vehicles, Service, About; hash navigation | Implemented |
| R3 | Add elements | Add drawer; required-field validation; generated ID | Implemented and tested |
| R4 | Remove elements | Named confirmation; immutable deletion; Undo | Implemented and tested |
| R5 | Update elements | Edit drawer; all editable record properties | Implemented and tested |
| R6 | Display elements | Registry plus mobile cards; existing values in edit drawer | Implemented and tested |
| R7 | About with names and student IDs | Leen Alshaya 221410456; Layal Alhashim 220511246 | Implemented and tested |
| R8 | Manage one kind of asset | Every collection object represents one company vehicle | Implemented |
| R9 | Collection of objects, no database | src/data/vehicles.js and useState in App.jsx | Implemented |
| R10 | AI requirements, visual design, code | docs/AI-USAGE.md | Documented |
| R11 | AI-generated architecture/stack/features documentation | Project report, README, supporting guides | Delivered |
| R12 | AI-generated tests and executed tests | 81 passing automated checks; logs in docs/evidence | Executed |
| R13 | Public GitHub repository | User will upload; see GITHUB-SUBMISSION.md | User action remaining |
| R14 | Three to four team members | Only two supplied actual members are listed | Instructor approval or actual additional members needed |
| R15 | One student submits repository URL | Submission guide | User action remaining |
| R16 | Backend manually coded in Part 2 | No backend implemented in Part 1 | Scope respected |

## Acceptance criteria

- Creating a valid record adds one row/card, generates a unique asset ID, and changes derived summaries.
- Missing fields or duplicate registrations prevent saving and show a specific error.
- Changing status to Assigned requires a driver; changing away from Assigned clears the driver.
- Editing preserves the record ID and updates the selected vehicle without duplicating it.
- Cancelling an add/edit form leaves the collection unchanged.
- Cancelling deletion preserves the record; confirming removes it; immediate Undo restores it.
- Search matches ID, manufacturer, model, registration, driver, or branch without case sensitivity.
- Search, branch, and status filters combine; Clear restores the full applicable view.
- The service queue includes Maintenance records and dates up to 14 days ahead; retired records are excluded.
- Export contains only the visible filtered records and safely quotes user text.
- The About menu opens the supplied names and exact student IDs.
- Reloading restores the initial fictional collection, as explained in the interface and README.
- Desktop, tablet, and phone views keep primary actions accessible.

## Chosen enhancements

Overview metrics, utilization, service queue, search/filter/sort, CSV export, Undo, keyboard shortcuts, a responsive mobile card layout, locally bundled fonts, and continuous integration go beyond the minimum CRUD/menu/About requirements. Authentication, a database, live tracking, real valuations, Arabic translation, official plate validation, CSV import, and multi-user synchronization are outside scope.
