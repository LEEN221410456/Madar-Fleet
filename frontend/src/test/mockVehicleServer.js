import { vi } from "vitest";
import { createDemoVehicles } from "../data/vehicles.js";
import { dateKey, filterVehicles, fleetStats, normalizePlate } from "../lib/fleet.js";

// A test fixture for the HTTP boundary; integration tests exercise the real Spring implementation.
export function mockVehicleServer() {
  let fleet = createDemoVehicles();
  let archived = [];
  let sequence = 8;
  const respond = (data, status = 200) => ({
    ok: status < 400,
    status,
    json: async () => data,
  });
  const missing = () => respond({ message: "No vehicle was found with that ID." }, 404);
  return vi.fn(async (input, options = {}) => {
    const url = new URL(input, "http://localhost");
    const prefix = "/api/vehicles";
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    const method = options.method || "GET";
    if (method === "GET" && path === "/summary") return respond(fleetStats(fleet, dateKey()));
    if (method === "GET" && path === "") {
      const params = url.searchParams;
      const page = Number(params.get("page") || 0), size = Number(params.get("size") || 5);
      const all = filterVehicles(fleet, {
        query: params.get("q") || "",
        branch: params.get("branch") || "All branches",
        status: params.get("status") || "All vehicles",
        serviceOnly: params.get("serviceOnly") === "true",
        sort: params.get("sort") || "id",
      }, dateKey());
      return respond({
        items: all.slice(page * size, (page + 1) * size), page, size,
        totalElements: all.length, totalPages: Math.ceil(all.length / size),
        hasNext: (page + 1) * size < all.length, hasPrevious: page > 0,
      });
    }
    const [, id, action] = path.split("/");
    const existing = fleet.find((v) => v.id === id);
    if (method === "GET") return existing ? respond(existing) : missing();
    if (method === "DELETE") {
      if (!existing) return missing();
      archived.push(existing);
      fleet = fleet.filter((v) => v.id !== id);
      return respond(null, 204);
    }
    if (method === "POST" && action === "restore") {
      const vehicle = archived.find((v) => v.id === id);
      if (!vehicle) return missing();
      archived = archived.filter((v) => v.id !== id);
      fleet.push(vehicle);
      return respond(vehicle);
    }
    const data = JSON.parse(options.body);
    if (method === "PUT" && !existing) return missing();
    if ([...fleet, ...archived].some((v) => v.id !== id && normalizePlate(v.plate) === normalizePlate(data.plate))) {
      return respond({ message: "This registration number is already in use.",
        fieldErrors: { plate: "Use a registration number that is not already in the fleet." } }, 409);
    }
    const saved = { ...data, id: id || `MF-${String(++sequence).padStart(3, "0")}` };
    fleet = [...fleet.filter((v) => v.id !== saved.id), saved];
    return respond(saved, id ? 200 : 201);
  });
}
