import { useState } from "react";
import { ArrowRight, Check, X, CarFront } from "lucide-react";
import { BRANCHES, STATUSES, validateVehicle } from "../lib/fleet.js";
import Modal from "./Modal.jsx";

export default function VehicleForm({ vehicle, vehicles, onSave, onClose }) {
  const [form, setForm] = useState(
    vehicle || {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      plate: "",
      branch: "Riyadh",
      status: "Available",
      driver: "",
      mileage: 0,
      value: "",
      serviceDate: "",
      notes: "",
    },
  );
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const update = (e) => {
    setForm((previous) => ({ ...previous, [e.target.name]: e.target.value }));
    setErrors((previous) => ({ ...previous, [e.target.name]: undefined }));
  };
  function submit(e) {
    e.preventDefault();
    const next = validateVehicle(form, vehicles, vehicle?.id);
    setErrors(next);
    if (Object.keys(next).length) {
      setTimeout(
        () =>
          document.getElementById(`vehicle-${Object.keys(next)[0]}`)?.focus(),
        0,
      );
      return;
    }
    onSave(form);
  }
  const field = (name, label, props = {}) => (
    <div className={`field ${props.wide ? "wide" : ""}`}>
      <label htmlFor={`vehicle-${name}`}>
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={`vehicle-${name}`}
        name={name}
        value={form[name]}
        onChange={update}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `error-${name}` : undefined}
        {...Object.fromEntries(
          Object.entries(props).filter(([key]) => key !== "wide"),
        )}
      />
      {errors[name] && (
        <small className="field-error" id={`error-${name}`}>
          {errors[name]}
        </small>
      )}
    </div>
  );
  return (
    <Modal onClose={onClose} labelledBy="form-title" className="drawer">
      <div className="drawer-heading">
        <div className="icon-tile">
          <CarFront size={23} />
        </div>
        <button
          className="icon-button"
          aria-label="Close vehicle form"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <p className="eyebrow">{vehicle ? vehicle.id : "GROW YOUR FLEET"}</p>
      <h2 id="form-title">{vehicle ? "Edit vehicle" : "Add a vehicle"}</h2>
      <p className="muted">The essentials, all in one place.</p>
      <form onSubmit={submit} noValidate onChange={() => setDirty(true)}>
        <div className="form-grid">
          {field("make", "Manufacturer", {
            required: true,
            placeholder: "e.g. Toyota",
            maxLength: 50,
            "data-autofocus": true,
          })}
          {field("model", "Model", {
            required: true,
            placeholder: "e.g. Camry",
            maxLength: 50,
          })}
          {field("year", "Model year", {
            type: "number",
            required: true,
            min: 1990,
            max: new Date().getFullYear() + 1,
          })}
          {field("plate", "Registration number", {
            required: true,
            placeholder: "e.g. ABC 1234",
            maxLength: 24,
          })}
          <div className="field">
            <label htmlFor="vehicle-branch">Branch *</label>
            <select
              id="vehicle-branch"
              name="branch"
              value={form.branch}
              onChange={update}
            >
              {BRANCHES.map((branch) => (
                <option key={branch}>{branch}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="vehicle-status">Status *</label>
            <select
              id="vehicle-status"
              name="status"
              value={form.status}
              onChange={update}
            >
              {STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
          {form.status === "Assigned" &&
            field("driver", "Assigned driver", {
              required: true,
              wide: true,
              placeholder: "Full name",
              maxLength: 80,
            })}
          {field("mileage", "Mileage (km)", {
            required: true,
            type: "number",
            min: 0,
            step: 1,
          })}
          {field("value", "Asset value (SAR)", {
            required: true,
            type: "number",
            min: 0,
            max: 100000000,
            step: "0.01",
            placeholder: "0",
          })}
          {field("serviceDate", "Next service", { type: "date", wide: true })}
          <div className="field wide">
            <label htmlFor="vehicle-notes">
              Notes <span className="optional">optional</span>
            </label>
            <textarea
              id="vehicle-notes"
              name="notes"
              value={form.notes}
              onChange={update}
              rows={3}
              maxLength={500}
              placeholder="Anything the next person should know."
            />
          </div>
        </div>
        <p className="form-note">
          * Required fields ·{" "}
          {dirty ? "Unsaved changes" : "Saved for this session"}
        </p>
        <div className="drawer-footer">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button primary">
            {vehicle ? <Check size={17} /> : <ArrowRight size={17} />}{" "}
            {vehicle ? "Save changes" : "Add vehicle"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
