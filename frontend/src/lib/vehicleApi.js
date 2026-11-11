const BASE = "/api/vehicles";

export class VehicleApiError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

async function request(path, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(BASE + path, {
      method, signal,
      ...(body === undefined ? {} : {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new VehicleApiError("Cannot reach the fleet server. Run Part 2 in NetBeans and try again.");
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (data === null || response.status >= 500) {
    throw new VehicleApiError("The fleet server did not respond as expected. Check that Part 2 is running on port 8080.");
  }
  if (!response.ok) {
    throw new VehicleApiError(data.message || "The fleet server could not complete this request.", data.fieldErrors);
  }
  return data;
}

export function listVehicles({ page = 0, size = 5, query = "", branch, status, serviceOnly, sort }, signal) {
  const params = new URLSearchParams({ page, size, q: query.trim() });
  if (branch && branch !== "All branches") params.set("branch", branch);
  if (status && status !== "All vehicles") params.set("status", status);
  if (serviceOnly) params.set("serviceOnly", "true");
  if (sort) params.set("sort", sort);
  return request("?" + params, { signal });
}

export async function listAllMatching(filters) {
  const records = [];
  for (let page = 0; ; page++) {
    const result = await listVehicles({ ...filters, page, size: 100 });
    records.push(...result.items);
    if (!result.hasNext) return records;
  }
}

const idPath = (id) => "/" + encodeURIComponent(id.trim());

export const fleetSummary = (signal) => request("/summary", { signal });
export const findVehicle = (id) => request(idPath(id));
export const createVehicle = (body) => request("", { method: "POST", body });
export const updateVehicle = (id, body) => request(idPath(id), { method: "PUT", body });
export const archiveVehicle = (id) => request(idPath(id), { method: "DELETE" });
export const unarchiveVehicle = (id) => request(idPath(id) + "/restore", { method: "POST" });
