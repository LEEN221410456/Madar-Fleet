import { describe, expect, it } from "vitest";
import {
  BRANCHES,
  cleanVehicle,
  csvExport,
  dateKey,
  daysUntil,
  filterVehicles,
  fleetStats,
  needsService,
  nextAssetId,
  normalizePlate,
  serviceLabel,
  validateVehicle,
} from "./fleet.js";
import { createDemoVehicles } from "../data/vehicles.js";

const today = "2026-10-22";
const seed = () => createDemoVehicles(new Date(2026, 9, 22));
const valid = () => ({
  make: "Toyota",
  model: "Camry",
  plate: "NEW 1234",
  year: "2025",
  branch: "Riyadh",
  status: "Available",
  driver: "",
  mileage: "100",
  value: "95000",
  serviceDate: "2026-11-01",
  notes: "",
});

describe("vehicle validation", () => {
  it("accepts a valid record", () =>
    expect(validateVehicle(valid(), seed(), null, 2026)).toEqual({}));
  it("requires manufacturer, model and registration", () =>
    expect(
      Object.keys(
        validateVehicle(
          { ...valid(), make: " ", model: "", plate: "" },
          seed(),
        ),
      ),
    ).toEqual(expect.arrayContaining(["make", "model", "plate"])));
  it("detects duplicate registrations regardless of spaces, hyphens and letter case", () =>
    expect(
      validateVehicle({ ...valid(), plate: " rkd-4821 " }, seed()).plate,
    ).toBeDefined());
  it("allows the current registration while editing its own record", () =>
    expect(validateVehicle(seed()[0], seed(), "MF-001")).toEqual({}));
  it("still rejects another record’s registration when editing", () =>
    expect(
      validateVehicle(
        { ...seed()[0], plate: seed()[1].plate },
        seed(),
        "MF-001",
      ).plate,
    ).toBeDefined());
  it.each(["", "abc", "1989", "2028", "2025.5"])(
    "rejects invalid model year %s",
    (year) =>
      expect(
        validateVehicle({ ...valid(), year }, seed(), null, 2026).year,
      ).toBeDefined(),
  );
  it("requires a driver for assigned vehicles", () =>
    expect(
      validateVehicle({ ...valid(), status: "Assigned" }, seed()).driver,
    ).toBeDefined());
  it.each(["", "-1", "1.5", "Infinity", "9007199254740992"])(
    "rejects invalid mileage %s",
    (mileage) =>
      expect(
        validateVehicle({ ...valid(), mileage }, seed()).mileage,
      ).toBeDefined(),
  );
  it.each(["", "-1", "Infinity", "100000001"])(
    "rejects invalid asset value %s",
    (value) =>
      expect(
        validateVehicle({ ...valid(), value }, seed()).value,
      ).toBeDefined(),
  );
  it("accepts zero mileage and zero value", () =>
    expect(
      validateVehicle({ ...valid(), mileage: 0, value: 0 }, seed()),
    ).toEqual({}));
  it("rejects unknown branches and statuses", () =>
    expect(
      validateVehicle(
        { ...valid(), branch: "Unknown", status: "Unknown" },
        seed(),
      ),
    ).toEqual(
      expect.objectContaining({
        branch: expect.any(String),
        status: expect.any(String),
      }),
    ));
  it.each(["2026-02-30", "not-a-date", "2026-13-01"])(
    "rejects invalid dates %s",
    (serviceDate) =>
      expect(
        validateVehicle({ ...valid(), serviceDate }, seed()).serviceDate,
      ).toBeDefined(),
  );
  it("allows an omitted service date", () =>
    expect(validateVehicle({ ...valid(), serviceDate: "" }, seed())).toEqual(
      {},
    ));
  it("normalizes and trims a submitted record", () =>
    expect(
      cleanVehicle(
        {
          ...valid(),
          make: " Toyota ",
          notes: " example ",
          plate: "new   1234",
        },
        "MF-009",
      ),
    ).toEqual(
      expect.objectContaining({
        make: "Toyota",
        mileage: 100,
        value: 95000,
        plate: "NEW 1234",
        notes: "example",
        id: "MF-009",
      }),
    ));
  it("clears the driver when a vehicle is no longer assigned", () =>
    expect(
      cleanVehicle({ ...valid(), driver: "Previous driver" }, "MF-009").driver,
    ).toBe(""));
  it("preserves a driver when assigned", () =>
    expect(
      cleanVehicle(
        { ...valid(), status: "Assigned", driver: " Driver " },
        "MF-009",
      ).driver,
    ).toBe("Driver"));
  it("normalizes Arabic registration text without restricting plate formats", () =>
    expect(normalizePlate(" أ ب ج 1234 ")).toBe("أبج1234"));
});

describe("fleet views and calculations", () => {
  it("starts with eight independent fictional records", () => {
    const first = seed();
    first[0].model = "Changed";
    expect(seed()[0].model).toBe("Camry");
    expect(seed()).toHaveLength(8);
  });
  it("calculates summary totals and excludes retired vehicles from value and utilization", () =>
    expect(fleetStats(seed(), today)).toEqual({
      total: 8,
      assigned: 3,
      available: 3,
      maintenance: 1,
      service: 3,
      value: 745000,
      utilization: 43,
    }));
  it("handles an empty fleet without dividing by zero", () =>
    expect(fleetStats([], today)).toEqual({
      total: 0,
      assigned: 0,
      available: 0,
      maintenance: 0,
      service: 0,
      value: 0,
      utilization: 0,
    }));
  it.each(["camry", "MF-001", "4821", "faisal"])(
    "finds records by %s",
    (query) => expect(filterVehicles(seed(), { query })[0].id).toBe("MF-001"),
  );
  it("combines search, branch and status", () =>
    expect(
      filterVehicles(seed(), {
        query: "toyota",
        branch: "Riyadh",
        status: "Assigned",
      }),
    ).toHaveLength(1));
  it("returns no matches for an unknown search", () =>
    expect(filterVehicles(seed(), { query: "does-not-exist" })).toEqual([]));
  it("filters by status", () =>
    expect(filterVehicles(seed(), { status: "Available" })).toHaveLength(3));
  it("filters by branch", () =>
    expect(filterVehicles(seed(), { branch: BRANCHES[0] })).toHaveLength(3));
  it("filters the service queue", () =>
    expect(
      filterVehicles(seed(), { serviceOnly: true }, today).map((v) => v.id),
    ).toEqual(["MF-003", "MF-004", "MF-006"]));
  it("sorts by descending mileage without mutating the source collection", () => {
    const data = seed();
    expect(filterVehicles(data, { sort: "mileage" })[0].id).toBe("MF-008");
    expect(data[0].id).toBe("MF-001");
  });
  it("sorts by name", () =>
    expect(filterVehicles(seed(), { sort: "model" })[0].model).toBe("Sonata"));
  it("sorts blank service dates last", () =>
    expect(filterVehicles(seed(), { sort: "service" }).at(-1).id).toBe(
      "MF-008",
    ));
  it("allocates unique IDs beyond the highest existing ID", () =>
    expect(nextAssetId(seed())).toBe("MF-009"));
  it("does not reuse a deleted ID when a sequence is supplied", () =>
    expect(nextAssetId([], 12)).toBe("MF-013"));
});

describe("service dates and safe export", () => {
  it("formats calendar days consistently", () => {
    expect(dateKey(new Date(2026, 0, 2))).toBe("2026-01-02");
    expect(daysUntil("2026-10-24", today)).toBe(2);
    expect(daysUntil("", today)).toBeNull();
  });
  it("includes overdue, today, and day 14; excludes day 15", () => {
    for (const date of ["2026-10-20", "2026-10-22", "2026-11-05"])
      expect(
        needsService({ status: "Available", serviceDate: date }, today),
      ).toBe(true);
    expect(
      needsService({ status: "Available", serviceDate: "2026-11-06" }, today),
    ).toBe(false);
  });
  it("includes maintenance without a service date", () =>
    expect(
      needsService({ status: "Maintenance", serviceDate: "" }, today),
    ).toBe(true));
  it("excludes retired vehicles even when overdue", () =>
    expect(
      needsService({ status: "Retired", serviceDate: "2026-01-01" }, today),
    ).toBe(false));
  it.each([
    ["2026-10-20", "2d overdue"],
    ["2026-10-22", "Due today"],
    ["2026-10-23", "Due tomorrow"],
    ["2026-10-25", "In 3 days"],
    ["", "Not scheduled"],
  ])("labels %s as %s", (serviceDate, label) =>
    expect(serviceLabel({ status: "Available", serviceDate }, today)).toBe(
      label,
    ),
  );
  it("labels a retired vehicle as unscheduled", () =>
    expect(serviceLabel(seed()[7], today)).toBe("Not scheduled"));
  it("exports headers, every record and a UTF-8 BOM", () => {
    const csv = csvExport(seed());
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.split("\r\n")).toHaveLength(9);
    expect(csv).toContain("Value (SAR)");
    expect(csv).toContain("MF-008");
  });
  it("escapes CSV quotes, commas, and multiline notes", () =>
    expect(csvExport([{ ...seed()[0], notes: '"hello",\nworld' }])).toContain(
      '"""hello"",\nworld"',
    ));
  it("neutralizes spreadsheet formulas in user text", () =>
    expect(
      csvExport([{ ...seed()[0], notes: '=HYPERLINK("example")' }]),
    ).toContain('"\'=HYPERLINK(""example"")"'));
});
