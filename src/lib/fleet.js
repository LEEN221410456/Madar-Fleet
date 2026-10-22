export const BRANCHES = ["Riyadh", "Jeddah", "Dammam", "Al Khobar"];
export const STATUSES = ["Available", "Assigned", "Maintenance", "Retired"];

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function daysUntil(date, today = dateKey()) {
  if (!date) return null;
  return Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
      86400000,
  );
}

export function serviceLabel(vehicle, today) {
  if (vehicle.status === "Retired") return "Not scheduled";
  const days = daysUntil(vehicle.serviceDate, today);
  if (days === null) return "Not scheduled";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `In ${days} days`;
}

export function needsService(vehicle, today) {
  const days = daysUntil(vehicle.serviceDate, today);
  return (
    vehicle.status !== "Retired" &&
    (vehicle.status === "Maintenance" || (days !== null && days <= 14))
  );
}

export function normalizePlate(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/[\s-]+/g, "")
    .toUpperCase();
}

export function validateVehicle(
  input,
  vehicles,
  editingId = null,
  currentYear = new Date().getFullYear(),
) {
  const errors = {};
  if (!String(input.make ?? "").trim()) errors.make = "Enter the manufacturer.";
  if (!String(input.model ?? "").trim()) errors.model = "Enter the model.";
  if (!String(input.plate ?? "").trim())
    errors.plate = "Enter the registration number.";
  else if (
    vehicles.some(
      (v) =>
        v.id !== editingId &&
        normalizePlate(v.plate) === normalizePlate(input.plate),
    )
  )
    errors.plate = "This registration already exists.";
  const year = Number(input.year);
  if (!Number.isInteger(year) || year < 1990 || year > currentYear + 1)
    errors.year = `Use a year from 1990 to ${currentYear + 1}.`;
  if (!BRANCHES.includes(input.branch)) errors.branch = "Choose a branch.";
  if (!STATUSES.includes(input.status)) errors.status = "Choose a status.";
  if (input.status === "Assigned" && !String(input.driver ?? "").trim())
    errors.driver = "An assigned vehicle needs a driver.";
  if (
    String(input.mileage ?? "").trim() === "" ||
    !Number.isSafeInteger(Number(input.mileage)) ||
    Number(input.mileage) < 0
  )
    errors.mileage = "Enter a whole, non-negative mileage.";
  if (
    String(input.value ?? "").trim() === "" ||
    !Number.isFinite(Number(input.value)) ||
    Number(input.value) < 0 ||
    Number(input.value) > 100000000
  )
    errors.value = "Enter a value between 0 and 100,000,000 SAR.";
  if (
    input.serviceDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(input.serviceDate) ||
      Number.isNaN(Date.parse(input.serviceDate)) ||
      new Date(`${input.serviceDate}T00:00:00Z`).toISOString().slice(0, 10) !==
        input.serviceDate)
  )
    errors.serviceDate = "Enter a valid service date.";
  return errors;
}

export function cleanVehicle(input, id) {
  return {
    id,
    make: input.make.trim(),
    model: input.model.trim(),
    plate: input.plate.trim().replace(/\s+/g, " ").toUpperCase(),
    year: Number(input.year),
    branch: input.branch,
    status: input.status,
    driver: input.status === "Assigned" ? input.driver.trim() : "",
    mileage: Number(input.mileage),
    value: Number(input.value),
    serviceDate: input.serviceDate || "",
    notes: input.notes.trim(),
  };
}

export function filterVehicles(
  vehicles,
  {
    query = "",
    branch = "All branches",
    status = "All vehicles",
    serviceOnly = false,
    sort = "id",
  } = {},
  today,
) {
  const term = query.trim().toLowerCase();
  const filtered = vehicles.filter(
    (v) =>
      (!term ||
        [v.id, v.make, v.model, v.plate, v.driver, v.branch].some((x) =>
          x.toLowerCase().includes(term),
        )) &&
      (branch === "All branches" || v.branch === branch) &&
      (status === "All vehicles" || v.status === status) &&
      (!serviceOnly || needsService(v, today)),
  );
  return [...filtered].sort((a, b) => {
    if (sort === "mileage") return b.mileage - a.mileage;
    if (sort === "service")
      return (a.serviceDate || "9999").localeCompare(b.serviceDate || "9999");
    if (sort === "model")
      return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}

export function fleetStats(vehicles, today) {
  const active = vehicles.filter((v) => v.status !== "Retired");
  return {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === "Available").length,
    assigned: vehicles.filter((v) => v.status === "Assigned").length,
    maintenance: vehicles.filter((v) => v.status === "Maintenance").length,
    service: vehicles.filter((v) => needsService(v, today)).length,
    value: active.reduce((sum, v) => sum + v.value, 0),
    utilization: active.length
      ? Math.round(
          (vehicles.filter((v) => v.status === "Assigned").length /
            active.length) *
            100,
        )
      : 0,
  };
}

export function nextAssetId(vehicles, lastSequence = 0) {
  return `MF-${String(Math.max(lastSequence, ...vehicles.map((v) => Number(v.id.replace("MF-", "")) || 0)) + 1).padStart(3, "0")}`;
}

export function csvExport(vehicles) {
  const header = [
    "Asset ID",
    "Make",
    "Model",
    "Year",
    "Registration",
    "Branch",
    "Status",
    "Driver",
    "Mileage (km)",
    "Value (SAR)",
    "Next service",
    "Notes",
  ];
  const safe = (value) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return (
    "\uFEFF" +
    [
      header,
      ...vehicles.map((v) => [
        v.id,
        v.make,
        v.model,
        v.year,
        v.plate,
        v.branch,
        v.status,
        v.driver,
        v.mileage,
        v.value,
        v.serviceDate,
        v.notes,
      ]),
    ]
      .map((row) => row.map(safe).join(","))
      .join("\r\n")
  );
}
