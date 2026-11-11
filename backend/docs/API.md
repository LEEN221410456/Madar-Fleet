# Vehicle REST API

Local base URL: `http://127.0.0.1:8080`. Requests with a body use `Content-Type: application/json`.

| Method | Route | Inputs | Success |
| --- | --- | --- | --- |
| POST | `/api/vehicles` | Vehicle JSON | `201 Created`, saved vehicle, and a `Location` header |
| GET | `/api/vehicles/{id}` | Asset ID, e.g. `MF-001` | `200 OK`, one vehicle |
| GET | `/api/vehicles` | Page, size, and optional registry filters | `200 OK`, one page plus pagination metadata |
| PUT | `/api/vehicles/{id}` | Existing asset ID and complete vehicle JSON | `200 OK`, updated vehicle with the same ID |
| GET | `/api/vehicles/summary` | None | `200 OK`, totals for the dashboard across all nonremoved records |
| DELETE | `/api/vehicles/{id}` | Existing asset ID | `204 No Content`, removes the record from the active registry |
| POST | `/api/vehicles/{id}/restore` | Previously removed asset ID | `200 OK`, restores the record with its original ID |

## Create and update body

```json
{
  "make": "Mazda",
  "model": "CX-5",
  "year": 2025,
  "plate": "QA 4100",
  "branch": "Riyadh",
  "status": "Available",
  "driver": "",
  "mileage": 17500,
  "value": 105000.50,
  "serviceDate": "",
  "notes": "Demonstration vehicle"
}
```

The response adds an `id` such as `MF-009`. IDs are generated from the database key and assigned once. For PUT, send the full body; use the URL to identify the record. The optional fields may be omitted or empty; PUT clears them if omitted. ID lookups accept lowercase letters and leading/trailing whitespace, but require the formatted numeric part (for example, `MF-001`, not `MF-1`).

- `make` and `model` must be present and each is limited to 80 characters. Registration input must contain a nonseparator and is limited to 40 characters. Equivalent registrations are compared ignoring case, whitespace, and hyphens, with Unicode compatibility normalization.
- `year` is a whole number from 1990 through next year, calculated in the Riyadh time zone.
- `branch` must be Riyadh, Jeddah, Dammam, or Al Khobar. `status` must be Available, Assigned, Maintenance, or Retired.
- `driver` is required for Assigned and cleared for other statuses. `mileage` is a nonnegative whole number in kilometres within the JavaScript safe integer range. `value` is a numeric SAR amount between 0 and 100,000,000, with up to two decimal places.
- A nonempty `serviceDate` must be a valid calendar date in `YYYY-MM-DD` format. Notes are optional and limited to 500 characters. An absent service date is returned as an empty string.

## Pagination

`page` is zero-based and defaults to 0. `size` defaults to 5 and must be 1–100. The server orders by the underlying numeric ID and pages in the database. An out-of-range page returns an empty `items` array and still reports the total. For instance, `GET /api/vehicles?page=0&size=1` on a fresh database returns one vehicle in `items` and the following pagination fields:

| Field | Example |
| --- | --- |
| `page` | 0 |
| `size` | 1 |
| `totalElements` | 8 |
| `totalPages` | 8 |
| `hasNext` | true |
| `hasPrevious` | false |

## Registry filters and dashboard

The list accepts `q` (case-insensitive search text or an exact asset ID), `branch`, `status`, `serviceOnly=true`, and `sort=id|model|mileage|service`. Search and filters apply before pagination. The mileage sort is highest first; service dates sort earliest first, with undated records last. The service queue covers nonretired vehicles in Maintenance or with a service date due within 14 days, including overdue dates.

The summary response provides `total`, `available`, `assigned`, `maintenance`, `service`, `value` (active asset value in SAR), and `utilization` (percentage). Removed records are omitted from queries and totals; their plate remains reserved while they are restorable.

## Errors

| Status | Code | Cause |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Invalid fields, ID format, or pagination parameters |
| 400 | `INVALID_BODY` | Missing or malformed JSON, or incompatible field types |
| 404 | `VEHICLE_NOT_FOUND` | A valid asset ID is absent |
| 409 | `DUPLICATE_PLATE` | Another vehicle owns the equivalent registration |

Validation errors include a map indexed by the request field name:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Correct the highlighted fields.",
  "fieldErrors": {
    "driver": "An assigned vehicle needs a driver."
  }
}
```
