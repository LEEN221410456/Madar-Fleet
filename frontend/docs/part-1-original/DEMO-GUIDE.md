# Demonstration guide

Allow approximately five minutes. Start with a fresh page so the fictional collection contains eight vehicles.

1. **Explain the scope (30 seconds).** Madar Fleet manages one asset type: company vehicles. It is a React frontend for a fictional Saudi company. There is no backend or database in Part 1.
2. **Overview (30 seconds).** Show 8 vehicles, 3 ready to assign, 3 needing attention, SAR 745,000 active value, and 43% utilization. Explain that retired assets are excluded from active value and utilization. Select Ready to assign to open its filtered view.
3. **Create (60 seconds).** Select Add vehicle or press N. Enter Mazda / 6 / 2025 / NEW 1234 / Riyadh / Available / 100 km / SAR 90,000. Save. Show the new MF-009 record and success message. The registry now contains 9 vehicles.
4. **Find and update (45 seconds).** Search NEW 1234. Open the vehicle name. Change status to Assigned; show that the driver becomes required. Enter a fictional driver and save. Show the updated status and driver.
5. **Validate (30 seconds).** Try adding a record with registration RKD 4821. Show duplicate-registration validation. Cancel. Do not present a failed save as a saved record.
6. **Delete and undo (30 seconds).** Delete MF-009, review the confirmation, then confirm. Use Undo to restore it. Delete it again if returning to the original fleet is preferred.
7. **Service (30 seconds).** Open Service. Explain the 14-day rule and the overdue Hilux. Open a record and show how a next-service date can be changed. Cancelling leaves it unchanged.
8. **About and closing (30 seconds).** Open About and show the two members and student IDs. Show the test report and the passing command output. Explain that refreshing restores demo data; CSV export downloads a copy of the current filtered view.

## Useful shortcuts

| Key | Action |
| --- | --- |
| N | Add a vehicle |
| / | Focus search |
| ? | Open Quick guide |
| Escape | Close an open dialog |

Shortcuts do not interrupt typing in inputs. On phones, use the bottom menu and the visible edit/delete buttons on vehicle cards.

## Questions to be ready to answer

- Where are the records held? In a React state array initialized from the object collection.
- Why do changes disappear after refresh? Part 1 uses a session-only in-memory data model.
- How does editing update the view? The matching object is replaced immutably; React re-renders and derived values recalculate.
- Why separate fleet.js? Business rules can be tested without rendering the interface.
- What belongs to Part 2? The manually written backend, database, server-side validation, and future multi-user functionality.
- Did AI assist? Yes. Requirements interpretation, design, implementation, tests, and documentation are disclosed in AI-USAGE.md.
