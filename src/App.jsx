import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CarFront,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  Compass,
  Gauge,
  LayoutGrid,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { createDemoVehicles } from "./data/vehicles.js";
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
  serviceLabel,
} from "./lib/fleet.js";
import VehicleArt from "./components/VehicleArt.jsx";
import VehicleForm from "./components/VehicleForm.jsx";
import Modal from "./components/Modal.jsx";

const number = (value) => new Intl.NumberFormat("en-SA").format(value);
const money = (value) =>
  new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(value);
const pages = [
  { id: "overview", name: "Overview", icon: LayoutGrid },
  { id: "vehicles", name: "Vehicles", icon: CarFront },
  { id: "service", name: "Service", icon: Wrench },
  { id: "about", name: "About", icon: UsersRound },
];
const pageFromHash = () =>
  pages.some((page) => page.id === location.hash.slice(1))
    ? location.hash.slice(1)
    : "overview";

function Brand({ small = false }) {
  return (
    <div className={`brand ${small ? "small" : ""}`}>
      <span className="brand-symbol">
        <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path
            d="M8 29V13l7 9 5-13 6 13 6-9v16"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!small && (
        <span>
          madar<span className="brand-sub">FLEET MANAGEMENT</span>
        </span>
      )}
    </div>
  );
}

function Status({ value }) {
  return (
    <span className={`status ${value.toLowerCase()}`}>
      <span />
      {value}
    </span>
  );
}

export default function App() {
  const [vehicles, setVehicles] = useState(createDemoVehicles);
  const sequence = useRef(8);
  const [page, setPage] = useState(pageFromHash);
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("All branches");
  const [status, setStatus] = useState("All vehicles");
  const [sort, setSort] = useState("id");
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [undo, setUndo] = useState(null);
  const [toast, setToast] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [today, setToday] = useState(dateKey);
  const searchRef = useRef(null);
  const stats = fleetStats(vehicles, today);
  const closeForm = useCallback(() => setForm(null), []);
  const closeDelete = useCallback(() => setDeleting(null), []);
  const closeHelp = useCallback(() => setShowHelp(false), []);
  const navigate = useCallback((next, nextStatus = "All vehicles") => {
    setPage(next);
    setStatus(nextStatus);
    setQuery("");
    setSort("id");
    setBranch("All branches");
    location.hash = next;
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const handler = () => setPage(pageFromHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setToday(dateKey()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    const onKey = (e) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) ||
        e.target.isContentEditable ||
        form ||
        deleting ||
        showHelp
      )
        return;
      if (e.key === "/") {
        e.preventDefault();
        if (page === "about") navigate("vehicles");
        setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setForm({ mode: "add" });
      }
      if (e.key === "?") setShowHelp(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, form, deleting, showHelp, navigate]);
  const filtered = useMemo(
    () =>
      filterVehicles(
        vehicles,
        { query, branch, status, sort, serviceOnly: page === "service" },
        today,
      ),
    [vehicles, query, branch, status, sort, page, today],
  );
  const serviceVehicles = vehicles
    .filter((v) => needsService(v, today))
    .sort((a, b) =>
      (a.serviceDate || "9999").localeCompare(b.serviceDate || "9999"),
    );

  function saveVehicle(input) {
    const editing = form.mode === "edit";
    const id = editing
      ? form.vehicle.id
      : nextAssetId(vehicles, sequence.current);
    if (!editing) sequence.current = Number(id.replace("MF-", ""));
    const record = cleanVehicle(input, id);
    setVehicles((previous) =>
      editing
        ? previous.map((v) => (v.id === id ? record : v))
        : [...previous, record],
    );
    setForm(null);
    setToast({
      message: `${record.make} ${record.model} ${editing ? "updated" : "added to your fleet"}.`,
    });
    if (!editing) navigate("vehicles");
  }

  function removeVehicle() {
    const record = deleting;
    setVehicles((previous) => previous.filter((v) => v.id !== record.id));
    setDeleting(null);
    setUndo(record);
    setToast({
      message: `${record.make} ${record.model} removed.`,
      canUndo: true,
    });
  }

  function restoreVehicle() {
    if (undo) {
      setVehicles((previous) => [...previous, undo]);
      setUndo(null);
      setToast({ message: "Vehicle restored." });
    }
  }

  function exportData() {
    const url = URL.createObjectURL(
      new Blob([csvExport(filtered)], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `madar-fleet-${today}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast({
      message: `${filtered.length} vehicle${filtered.length !== 1 ? "s" : ""} exported.`,
    });
  }

  const toolbar = (
    <div className="table-toolbar">
      <div className="search-box">
        <Search size={17} />
        <label className="sr-only" htmlFor="fleet-search">
          Search vehicles
        </label>
        <input
          ref={searchRef}
          id="fleet-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vehicles, plates, drivers…"
        />
        <kbd>/</kbd>
      </div>
      <div className="table-controls">
        <div className="select-wrap">
          <MapPin size={15} />
          <label className="sr-only" htmlFor="branch-filter">
            Filter by branch
          </label>
          <select
            id="branch-filter"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            <option>All branches</option>
            {BRANCHES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <ChevronDown size={13} />
        </div>
        <div className="select-wrap sort-select">
          <label className="sr-only" htmlFor="sort-vehicles">
            Sort vehicles
          </label>
          <select
            id="sort-vehicles"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="id">Asset ID</option>
            <option value="model">Vehicle name</option>
            <option value="mileage">Highest mileage</option>
            <option value="service">Service date</option>
          </select>
          <ChevronDown size={13} />
        </div>
        <button
          className="button secondary export-button"
          onClick={exportData}
          disabled={!filtered.length}
        >
          <ArrowDownToLine size={16} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content").focus();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="workspace">
          <div className="workspace-icon">
            <Building2 size={19} />
          </div>
          <div>
            <strong>Madar Operations</strong>
            <span>Saudi Arabia</span>
          </div>
          <span className="workspace-dot" title="Demo workspace" />
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {pages.map(({ id, name, icon: Icon }) => (
            <a
              href={`#${id}`}
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              aria-label={name}
              title={name}
              aria-current={page === id ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                navigate(id);
              }}
            >
              <Icon size={19} />
              <span>{name}</span>
              {id === "service" && stats.service > 0 && (
                <span className="nav-count">{stats.service}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="session-card">
            <span className="session-orbit">
              <Activity size={17} />
            </span>
            <strong>
              A little lighter.
              <br />A lot more in control.
            </strong>
            <p>Your fleet, without the friction.</p>
          </div>
          <button
            className="help-link"
            aria-label="Quick guide"
            onClick={() => setShowHelp(true)}
          >
            <CircleHelp size={18} />
            <span>Quick guide</span>
            <kbd>?</kbd>
          </button>
          <div className="sidebar-footer">
            <span className="avatar">LL</span>
            <div>
              <strong>Leen & Layal</strong>
              <span>SE411 · Part 1</span>
            </div>
            <span className="version">v1.0</span>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>
            <strong>{pages.find((p) => p.id === page)?.name}</strong>
          </div>
          <div className="topbar-right">
            <span className="session-indicator">
              <span />
              Demo session
            </span>
            <span className="country-label">
              KSA <span className="country-line" />
            </span>
            <button
              className="topbar-avatar"
              aria-label="View project team"
              onClick={() => navigate("about")}
            >
              LL
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {page === "about" ? (
            <About />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">
                    {page === "overview"
                      ? "A CLEARER VIEW, EVERY DAY"
                      : page === "service"
                        ? "KEEP THINGS MOVING"
                        : "YOUR FLEET, IN ONE PLACE"}
                  </p>
                  <h1>
                    {page === "overview"
                      ? "Your fleet, in focus."
                      : page === "service"
                        ? "A little care. More uptime."
                        : "Every vehicle. One view."}
                  </h1>
                  <p className="page-subtitle">
                    {page === "overview"
                      ? "Less to manage. More room to move."
                      : page === "service"
                        ? "Upcoming service and vehicles that need attention."
                        : "Find, assign, and update your company vehicles."}
                  </p>
                </div>
                <button
                  className="button primary add-button"
                  onClick={() => setForm({ mode: "add" })}
                >
                  <Plus size={18} />
                  Add vehicle<kbd>N</kbd>
                </button>
              </div>

              {page === "overview" && (
                <>
                  <div className="overview-grid">
                    <section className="hero-panel">
                      <div className="hero-grid" />
                      <div className="hero-copy">
                        <span className="hero-kicker">
                          <span />
                          CONNECTED BY CLARITY
                        </span>
                        <h2>
                          Ready for
                          <br />
                          what’s next.
                        </h2>
                        <p>
                          {stats.available} vehicles ready to go.
                          <br />
                          One workspace to keep them moving.
                        </p>
                        <button
                          onClick={() => navigate("vehicles", "Available")}
                          className="hero-link"
                        >
                          Explore your fleet <ArrowUpRight size={17} />
                        </button>
                      </div>
                      <div className="hero-visual">
                        <div className="orbit orbit-one" />
                        <div className="orbit orbit-two" />
                        <div className="hero-chip">
                          <span />
                          FLEET ASSETS · KSA
                        </div>
                        <VehicleArt />
                        <span className="hero-coordinate">
                          24.7136° N &nbsp; 46.6753° E
                        </span>
                      </div>
                    </section>
                    <section className="readiness-panel">
                      <div className="section-mini-heading">
                        <span>Fleet readiness</span>
                        <ArrowUpRight size={17} />
                      </div>
                      <div
                        className="readiness-ring"
                        style={{ "--progress": `${stats.utilization}%` }}
                      >
                        <div>
                          <strong>
                            {stats.utilization}
                            <span>%</span>
                          </strong>
                          <span>in use</span>
                        </div>
                      </div>
                      <div className="readiness-legend">
                        <span>
                          <i className="legend-assigned" />
                          {stats.assigned} assigned
                        </span>
                        <span>
                          <i className="legend-available" />
                          {stats.available} available
                        </span>
                      </div>
                      <p>Assigned / non-retired vehicles</p>
                    </section>
                  </div>
                  <section className="stats-grid" aria-label="Fleet summary">
                    <Metric
                      label="Total vehicles"
                      value={stats.total}
                      icon={CarFront}
                      detail="Across all branches"
                      onClick={() => navigate("vehicles")}
                      tone="purple"
                    />
                    <Metric
                      label="Ready to assign"
                      value={stats.available}
                      icon={ShieldCheck}
                      detail="Available for your next move"
                      onClick={() => navigate("vehicles", "Available")}
                      tone="mint"
                    />
                    <Metric
                      label="Needs attention"
                      value={stats.service}
                      icon={Wrench}
                      detail="In service or due within 14 days"
                      onClick={() => navigate("service")}
                      tone="peach"
                    />
                    <Metric
                      label="Active asset value"
                      value={money(stats.value)}
                      icon={Gauge}
                      detail="Excludes retired vehicles"
                      onClick={() => navigate("vehicles")}
                      tone="blue"
                      compact
                    />
                  </section>
                </>
              )}

              {page === "service" && (
                <section className="service-banner">
                  <div className="service-banner-icon">
                    <Wrench size={24} />
                  </div>
                  <div>
                    <h2>
                      {stats.service
                        ? `${stats.service} vehicles need your attention`
                        : "Your fleet is on track"}
                    </h2>
                    <p>
                      Includes vehicles in maintenance and service dates within
                      the next 14 days. Retired vehicles are excluded.
                    </p>
                  </div>
                  <span className="service-window">14-day outlook</span>
                </section>
              )}

              <section className="fleet-panel">
                <div className="fleet-panel-heading">
                  <div>
                    <h2>
                      {page === "service"
                        ? "Service queue"
                        : page === "overview"
                          ? "Fleet at a glance"
                          : "Vehicle registry"}
                      <span className="count-badge">
                        {page === "service"
                          ? serviceVehicles.length
                          : vehicles.length}
                      </span>
                    </h2>
                    <p>
                      {page === "service"
                        ? "Select a vehicle to update its service date or status."
                        : "A small overview. A complete picture."}
                    </p>
                  </div>
                  {page === "overview" && (
                    <button
                      className="text-button"
                      onClick={() => navigate("vehicles")}
                    >
                      View all vehicles
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
                {toolbar}
                <div
                  className="filter-tabs"
                  role="group"
                  aria-label="Filter by status"
                >
                  {[
                    "All vehicles",
                    "Available",
                    "Assigned",
                    "Maintenance",
                    "Retired",
                  ].map((item) => (
                    <button
                      key={item}
                      className={status === item ? "selected" : ""}
                      aria-pressed={status === item}
                      onClick={() => setStatus(item)}
                    >
                      {item}
                      {item === "All vehicles" && (
                        <span>
                          {page === "service"
                            ? serviceVehicles.length
                            : vehicles.length}
                        </span>
                      )}
                    </button>
                  ))}
                  {(query ||
                    branch !== "All branches" ||
                    status !== "All vehicles") && (
                    <button
                      className="clear-filters"
                      onClick={() => {
                        setQuery("");
                        setBranch("All branches");
                        setStatus("All vehicles");
                      }}
                    >
                      <X size={12} />
                      Clear
                    </button>
                  )}
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Vehicle</th>
                        <th scope="col">Registration</th>
                        <th scope="col">Branch</th>
                        <th scope="col">Status</th>
                        <th scope="col">Mileage</th>
                        <th scope="col">
                          {page === "service" ? "Next service" : "Assigned to"}
                        </th>
                        <th scope="col">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((vehicle) => (
                        <tr key={vehicle.id}>
                          <td>
                            <button
                              className="vehicle-name"
                              onClick={() => setForm({ mode: "edit", vehicle })}
                              aria-label={`Edit ${vehicle.make} ${vehicle.model}, ${vehicle.id}`}
                            >
                              <span
                                className={`vehicle-icon ${vehicle.status.toLowerCase()}`}
                              >
                                <CarFront size={24} strokeWidth={1.5} />
                              </span>
                              <span>
                                <strong>
                                  {vehicle.make} {vehicle.model}
                                </strong>
                                <small>
                                  {vehicle.id}
                                  <span>·</span>
                                  {vehicle.year}
                                </small>
                              </span>
                            </button>
                          </td>
                          <td>
                            <span className="plate">{vehicle.plate}</span>
                          </td>
                          <td>
                            <span className="branch-name">
                              <MapPin size={13} />
                              {vehicle.branch}
                            </span>
                          </td>
                          <td>
                            <Status value={vehicle.status} />
                          </td>
                          <td>
                            <span className="mileage">
                              {number(vehicle.mileage)}
                              <small>km</small>
                            </span>
                          </td>
                          <td>
                            {page === "service" ? (
                              <div
                                className={`service-date ${daysUntil(vehicle.serviceDate, today) < 0 ? "overdue" : ""}`}
                              >
                                <strong>{serviceLabel(vehicle, today)}</strong>
                                <small>
                                  {vehicle.serviceDate || "Date not set"}
                                </small>
                              </div>
                            ) : vehicle.driver ? (
                              <span className="driver">
                                <span className="driver-avatar">
                                  {vehicle.driver
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")}
                                </span>
                                {vehicle.driver}
                              </span>
                            ) : (
                              <span className="unassigned">Unassigned</span>
                            )}
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                className="icon-button"
                                aria-label={`Edit ${vehicle.id}`}
                                title="Edit vehicle"
                                onClick={() =>
                                  setForm({ mode: "edit", vehicle })
                                }
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="icon-button delete"
                                aria-label={`Delete ${vehicle.id}`}
                                title="Delete vehicle"
                                onClick={() => setDeleting(vehicle)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!filtered.length && (
                  <div className="empty-state">
                    <span className="icon-tile">
                      <CarFront size={28} />
                    </span>
                    <h3>
                      {vehicles.length
                        ? "No vehicles match this view"
                        : "A fresh start for your fleet"}
                    </h3>
                    <p>
                      {vehicles.length
                        ? "Try another search or clear your filters."
                        : "Add your first vehicle to get things moving."}
                    </p>
                    <button
                      className="button secondary"
                      onClick={() => {
                        if (!vehicles.length) setForm({ mode: "add" });
                        else {
                          setQuery("");
                          setBranch("All branches");
                          setStatus("All vehicles");
                        }
                      }}
                    >
                      {vehicles.length ? "Clear filters" : "Add vehicle"}
                    </button>
                  </div>
                )}
                <div className="table-footer">
                  <span>
                    Showing <strong>{filtered.length}</strong> of{" "}
                    {page === "service"
                      ? serviceVehicles.length
                      : vehicles.length}{" "}
                    vehicles
                  </span>
                  <span>
                    <span className="tiny-dot" />
                    All changes stay in this session
                  </span>
                </div>
              </section>
              {page === "overview" && (
                <div className="bottom-note">
                  <Compass size={15} />
                  <span>
                    Built for Saudi operations. Designed to keep you moving.
                  </span>
                  <span className="bottom-note-right">
                    RIYADH · JEDDAH · DAMMAM · AL KHOBAR
                  </span>
                </div>
              )}
            </>
          )}
          <footer className="main-footer">
            <span>
              madar fleet <span>© {new Date().getFullYear()}</span>
            </span>
            <span>Thoughtfully built by Leen & Layal</span>
          </footer>
        </main>
      </div>

      {form && (
        <VehicleForm
          vehicle={form.vehicle}
          vehicles={vehicles}
          onSave={saveVehicle}
          onClose={closeForm}
        />
      )}
      {deleting && (
        <Modal
          onClose={closeDelete}
          labelledBy="delete-title"
          className="confirm-modal"
        >
          <div className="confirm-icon">
            <Trash2 size={23} />
          </div>
          <h2 id="delete-title">Remove this vehicle?</h2>
          <p>
            <strong>
              {deleting.make} {deleting.model}
            </strong>{" "}
            ({deleting.id}) will be removed from your fleet. You can undo this
            immediately after deleting.
          </p>
          <div className="confirm-detail">
            <span className="plate">{deleting.plate}</span>
            <span>{deleting.branch}</span>
          </div>
          <div className="confirm-actions">
            <button
              className="button secondary"
              onClick={closeDelete}
              data-autofocus
            >
              Keep vehicle
            </button>
            <button className="button danger" onClick={removeVehicle}>
              Delete vehicle
            </button>
          </div>
        </Modal>
      )}
      {showHelp && (
        <Modal
          onClose={closeHelp}
          labelledBy="help-title"
          className="help-modal"
        >
          <button
            className="icon-button close-help"
            aria-label="Close quick guide"
            onClick={closeHelp}
          >
            <X size={20} />
          </button>
          <span className="icon-tile">
            <Sparkles size={24} />
          </span>
          <p className="eyebrow">LESS FRICTION, MORE FLOW</p>
          <h2 id="help-title">A few ways to move faster.</h2>
          <div className="shortcut">
            <span>Search your fleet</span>
            <kbd>/</kbd>
          </div>
          <div className="shortcut">
            <span>Add a vehicle</span>
            <kbd>N</kbd>
          </div>
          <div className="shortcut">
            <span>Close an open panel</span>
            <kbd>Esc</kbd>
          </div>
          <div className="shortcut">
            <span>Open this guide</span>
            <kbd>?</kbd>
          </div>
          <p className="guide-note">
            Select a vehicle name to edit it. Use the summary cards to jump to a
            filtered view. Export downloads the vehicles in your current view.
          </p>
          <div className="session-explanation">
            <Activity size={19} />
            <p>
              <strong>A session-based demo</strong>Your changes are held in
              memory. Refreshing restores the fictional sample fleet. Export a
              CSV if you want to keep a copy.
            </p>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span className="toast-check">
            <Check size={16} />
          </span>
          <span>{toast.message}</span>
          {toast.canUndo && undo && (
            <button onClick={restoreVehicle}>
              <RotateCcw size={14} />
              Undo
            </button>
          )}
          <button
            className="toast-close"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, icon: Icon, detail, tone, onClick, compact }) {
  return (
    <button
      className={`metric-card ${compact ? "compact-value" : ""}`}
      onClick={onClick}
    >
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon ${tone}`}>
          <Icon size={18} />
        </span>
      </div>
      <strong className="metric-value">{value}</strong>
      <div className="metric-bottom">
        <span>{detail}</span>
        <ArrowUpRight size={14} />
      </div>
    </button>
  );
}

function About() {
  return (
    <div className="about-page">
      <p className="eyebrow">THE PEOPLE BEHIND THE PROJECT</p>
      <h1>
        Built with purpose.
        <br />
        <span>Made to move.</span>
      </h1>
      <p className="about-intro">
        Madar Fleet brings clarity to company vehicle management.
        <br />A focused workspace for assets, assignments, and the road ahead.
      </p>
      <div className="about-project">
        <Brand />
        <div>
          <span className="project-pill">SE411 · FALL 2026–27</span>
          <span className="project-pill subtle">PART 1 · REACT FRONTEND</span>
        </div>
      </div>
      <section className="team-section" aria-labelledby="team-title">
        <div className="team-heading">
          <h2 id="team-title">Meet the team</h2>
          <span>Designed and developed together</span>
        </div>
        <div className="team-grid">
          <article className="team-card">
            <div className="team-avatar leen">
              LA<span>01</span>
            </div>
            <div>
              <p className="eyebrow">PROJECT TEAM</p>
              <h3>Leen Alshaya</h3>
              <p className="student-id">
                Student ID <strong>221410456</strong>
              </p>
            </div>
          </article>
          <article className="team-card">
            <div className="team-avatar layal">
              LA<span>02</span>
            </div>
            <div>
              <p className="eyebrow">PROJECT TEAM</p>
              <h3>Layal Alhashim</h3>
              <p className="student-id">
                Student ID <strong>220511246</strong>
              </p>
            </div>
          </article>
        </div>
      </section>
      <div className="about-details">
        <article>
          <span className="icon-tile">
            <CarFront size={21} />
          </span>
          <h3>One clear focus</h3>
          <p>
            Company vehicles, from registration and assignment to mileage and
            service dates.
          </p>
        </article>
        <article>
          <span className="icon-tile">
            <MapPin size={21} />
          </span>
          <h3>A Saudi setting</h3>
          <p>
            Branches in Riyadh, Jeddah, Dammam, and Al Khobar. Asset values in
            Saudi riyals.
          </p>
        </article>
        <article>
          <span className="icon-tile">
            <Activity size={21} />
          </span>
          <h3>Frontend, thoughtfully done</h3>
          <p>
            A React application with an in-memory collection of fictional
            vehicle records.
          </p>
        </article>
      </div>
    </div>
  );
}
