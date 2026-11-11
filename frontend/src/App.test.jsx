import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import { mockVehicleServer } from "./test/mockVehicleServer.js";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  vi.stubGlobal("fetch", mockVehicleServer());
});
afterEach(() => vi.unstubAllGlobals());

const waitRows = (count) => waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(count));
const openAdd = async (user) => {
  await user.click(screen.getByRole("button", { name: /add vehicle/i }));
  return screen.getByRole("dialog");
};
const fillVehicle = async (user) => {
  await user.type(screen.getByLabelText(/Manufacturer/), "Mazda");
  await user.type(screen.getByLabelText(/^Model \*/i), "6");
  await user.type(screen.getByLabelText(/Registration number/), "NEW 1234");
  await user.type(screen.getByLabelText(/Asset value/), "90000");
};

describe("Madar Fleet user journeys", () => {
  it("displays a page of server records and the whole-fleet summary", async () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Your fleet, in focus." }),
    ).toBeInTheDocument();
    await waitRows(6);
    expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
    expect(await screen.findByText("SAR 745,000")).toBeInTheDocument();
  });
  it("navigates to About and displays both exact student identities", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("link", { name: "About" }));
    expect(screen.getByText("Leen Alshaya")).toBeInTheDocument();
    expect(screen.getByText("221410456")).toBeInTheDocument();
    expect(screen.getByText("Layal Alhashim")).toBeInTheDocument();
    expect(screen.getByText("220511246")).toBeInTheDocument();
  });
  it("creates a vehicle and updates the registry", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openAdd(user);
    await fillVehicle(user);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Add vehicle",
      }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await screen.findByText("Mazda 6")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit MF-009" }),
    ).toBeInTheDocument();
    await waitRows(2);
  });
  it("validates missing fields and focuses the first error", async () => {
    const user = userEvent.setup();
    render(<App />);
    const dialog = await openAdd(user);
    await user.click(
      within(dialog).getByRole("button", { name: "Add vehicle" }),
    );
    expect(screen.getByText("Enter the manufacturer.")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText(/Manufacturer/)).toHaveFocus(),
    );
  });
  it("blocks duplicate registrations", async () => {
    const user = userEvent.setup();
    render(<App />);
    const dialog = await openAdd(user);
    await fillVehicle(user);
    await user.clear(screen.getByLabelText(/Registration number/));
    await user.type(screen.getByLabelText(/Registration number/), "rkd-4821");
    await user.click(
      within(dialog).getByRole("button", { name: "Add vehicle" }),
    );
    expect(
      await screen.findByText("This registration number is already in use."),
    ).toBeInTheDocument();
  });
  it("edits a record and saves the change", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Edit MF-001" }));
    await user.clear(screen.getByLabelText(/Mileage/));
    await user.type(screen.getByLabelText(/Mileage/), "22222");
    await user.selectOptions(screen.getByLabelText(/Branch/), "Jeddah");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("22,222")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("requires a driver when assigning a vehicle", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Edit MF-002" }));
    await user.selectOptions(screen.getByLabelText(/^Status/), "Assigned");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(
      screen.getByText("An assigned vehicle needs a driver."),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Assigned driver/), "Test Driver");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Test Driver")).toBeInTheDocument();
  });
  it("cancels deletion without changing records", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Delete MF-001" }));
    await user.click(screen.getByRole("button", { name: "Keep vehicle" }));
    expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
    await waitRows(6);
  });
  it("deletes a vehicle and restores it using undo", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Delete MF-001" }));
    await user.click(screen.getByRole("button", { name: "Delete vehicle" }));
    await waitFor(() => expect(screen.queryByText("Toyota Camry")).not.toBeInTheDocument());
    await user.click(await screen.findByRole("button", { name: "Undo" }));
    expect(await screen.findByText("Toyota Camry")).toBeInTheDocument();
    await waitRows(6);
  });
  it("searches and combines branch and status filters", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole("searchbox"), "Toyota");
    await user.selectOptions(
      screen.getByLabelText("Filter by branch"),
      "Riyadh",
    );
    await user.click(
      screen.getByRole("button", { name: "Assigned", exact: true }),
    );
    await waitRows(2);
    expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Clear", exact: true }),
    );
    await waitRows(6);
  });
  it("shows a helpful empty search result", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole("searchbox"), "not-a-vehicle");
    expect(await screen.findByText("No vehicles match this view")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitRows(6);
  });
  it("opens the service queue and shows only qualifying vehicles", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("link", { name: /Service/ }));
    expect(
      screen.getByRole("heading", { name: "A little care. More uptime." }),
    ).toBeInTheDocument();
    await waitRows(4);
    expect(screen.getByText("2d overdue")).toBeInTheDocument();
  });
  it("uses a metric card as a shortcut to available vehicles", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Ready to assign/ }));
    await waitRows(4);
    expect(
      screen.getByRole("button", { name: "Available", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  });
  it("supports keyboard shortcuts, Escape and focus restoration", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard("n");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/Manufacturer/)).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.keyboard("/");
    expect(screen.getByRole("searchbox")).toHaveFocus();
  });
  it("traps modal keyboard focus", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openAdd(user);
    const close = screen.getByRole("button", { name: "Close vehicle form" });
    close.focus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Add vehicle",
      }),
    ).toHaveFocus();
    await user.keyboard("{Tab}");
    expect(close).toHaveFocus();
  });
  it("does not invoke global shortcuts while typing", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole("searchbox"), "n");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("cancels unsaved changes", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openAdd(user);
    await fillVehicle(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Mazda 6")).not.toBeInTheDocument();
    await waitRows(6);
  });
  it("exports the filtered view to a downloadable CSV", async () => {
    const user = userEvent.setup();
    const create = vi.fn(() => "blob:demo");
    const revoke = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: create,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revoke,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    render(<App />);
    await user.type(screen.getByRole("searchbox"), "Camry");
    await waitRows(2);
    await user.click(screen.getByRole("button", { name: "Export" }));
    await waitFor(() => expect(create).toHaveBeenCalledOnce());
    expect(click).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent("1 vehicle exported.");
    click.mockRestore();
  });
  it("keeps a removed record out of the list when the app reloads", async () => {
    const user = userEvent.setup();
    const view = render(<App />);
    await user.click(await screen.findByRole("button", { name: "Delete MF-001" }));
    await user.click(screen.getByRole("button", { name: "Delete vehicle" }));
    await screen.findByText("Toyota Camry removed.");
    view.unmount();
    render(<App />);
    await waitRows(6);
    expect(screen.queryByText("Toyota Camry")).not.toBeInTheDocument();
  });
  it("requests the next page from the server", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitRows(6);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Toyota Corolla")).toBeInTheDocument();
    expect(screen.queryByText("Toyota Camry")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("page=1"), expect.anything());
  });
  it("uses the exact ID route to open a vehicle from another page", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("Find by asset ID"));
    await user.type(screen.getByLabelText("Asset ID", { exact: true }), "MF-008");
    await user.click(screen.getByRole("button", { name: "Find vehicle" }));
    expect(await screen.findByRole("dialog", { name: "Edit vehicle" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Manufacturer/)).toHaveValue("Nissan");
    expect(fetch).toHaveBeenCalledWith("/api/vehicles/MF-008", expect.anything());
  });
  it("reports the server outage and can retry", async () => {
    const user = userEvent.setup();
    const mock = mockVehicleServer();
    fetch.mockRejectedValue(new Error("offline"));
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot reach the fleet server");
    expect(screen.queryByText("Toyota Camry")).not.toBeInTheDocument();
    fetch.mockImplementation(mock);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Toyota Camry")).toBeInTheDocument();
  });
  it("supports a direct About hash", () => {
    window.history.replaceState(null, "", "/#about");
    render(<App />);
    expect(screen.getByText("Leen Alshaya")).toBeInTheDocument();
  });
  it("responds to browser back/forward hash changes", () => {
    render(<App />);
    window.history.replaceState(null, "", "/#vehicles");
    fireEvent(window, new Event("hashchange"));
    expect(
      screen.getByRole("heading", { name: "Every vehicle. One view." }),
    ).toBeInTheDocument();
  });
});
