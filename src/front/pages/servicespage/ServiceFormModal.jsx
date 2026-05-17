import { useState, useEffect } from "react";
import "./serviceForm.css";

const IconTrash = () => (
    <svg viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M6 4V2h4v2M5 4l.7 10h4.6L11 4"
            stroke="currentColor" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// const IconPlus = () => (
//     <svg viewBox="0 0 16 16" fill="none">
//         <path d="M8 2v12M2 8h12" stroke="currentColor"
//             strokeWidth="2" strokeLinecap="round" />
//     </svg>
// );

const blankMaterial = () => ({
    _key: crypto.randomUUID(),
    id: null,
    name: "",
    quantity: "",
    unit_cost: "",
});

const blankForm = () => ({
    name: "",
    description: "",
    price: "",
    base_cost: "",
    estimate_hours: "",
    duration: "",
    is_active: true,
});

export default function ServiceFormModal({ modalId = "serviceFormModal", service = null, onSaved, onClose }) {

    const isEdit = !!service;

    const [form, setForm] = useState(blankForm());
    const [materials, setMaterials] = useState([blankMaterial(), blankMaterial()]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (service) {
            setForm({
                name: service.name ?? "",
                description: service.description ?? "",
                price: service.price ?? "",
                base_cost: service.base_cost ?? "",
                estimate_hours: service.estimate_hours ?? "",
                duration: service.duration ?? "",
                is_active: service.is_active ?? true,
            });

            const existing = (service.materials || []).map((m) => ({
                _key: crypto.randomUUID(),
                id: m.id,
                name: m.name ?? "",
                quantity: m.quantity ?? "",
                unit_cost: m.unit_cost ?? "",
            }));
            setMaterials(existing.length ? existing : [blankMaterial()]);
        } else {
            setForm(blankForm());
            setMaterials([blankMaterial(), blankMaterial()]);
        }
        setError(null);
    }, [service]);

    const materialsTotal = materials.reduce((sum, m) => {
        const qty = parseFloat(m.quantity) || 0;
        const cost = parseFloat(m.unit_cost) || 0;
        return sum + qty * cost;
    }, 0);

    const displayedBaseCost =
        form.base_cost !== "" && form.base_cost !== null
            ? parseFloat(form.base_cost) || 0
            : materialsTotal;

    const handleFormChange = (e) => {
        const { id, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [id]: type === "checkbox" ? checked : value,
        }));
    };

    const handleMatChange = (key, field, value) => {
        setMaterials((prev) =>
            prev.map((m) => (m._key === key ? { ...m, [field]: value } : m))
        );
    };

    const addMaterial = () => setMaterials((prev) => [...prev, blankMaterial()]);
    const removeMaterial = (key) =>
        setMaterials((prev) => prev.filter((m) => m._key !== key));

    const handleSubmit = async () => {
        setError(null);

        if (!form.name.trim()) { setError("Service name is required."); return; }
        if (!form.description.trim()) { setError("Description is required."); return; }

        setSaving(true);
        const token = localStorage.getItem("token");
        const baseUrl = import.meta.env.VITE_BACKEND_URL;

        const cleanMats = materials
            .filter((m) => m.name.trim())
            .map((m) => ({
                id: m.id,
                name: m.name.trim(),
                quantity: parseFloat(m.quantity) || 0,
                unit_cost: parseFloat(m.unit_cost) || 0,
            }));

        const payload = {
            name: form.name.trim(),
            description: form.description.trim(),
            price: form.price !== "" ? parseFloat(form.price) : null,
            base_cost: form.base_cost !== "" ? parseFloat(form.base_cost) : null,
            estimate_hours: form.estimate_hours !== "" ? parseFloat(form.estimate_hours) : null,
            duration: form.duration !== "" ? parseInt(form.duration) : null,
            is_active: form.is_active,
            materials: cleanMats,
        };

        try {
            const url = isEdit
                ? `${baseUrl}/api/services/${service.id}/full-update`
                : `${baseUrl}/api/services/create-with-materials`;
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            console.log('resp services', res)

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Something went wrong.");
                return;
            }

            /* close modal via Bootstrap API */
            const el = document.getElementById(modalId);
            if (el) {
                const bsModal = window.bootstrap?.Modal.getInstance(el);
                bsModal?.hide();
            }

            if (onSaved) onSaved(data.service);
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setForm(blankForm());
        setMaterials([blankMaterial(), blankMaterial()]);
        setError(null);
        if (onClose) onClose();
    };

    return (
        <div
            className="modal fade"
            id={modalId}
            data-bs-backdrop="static"
            data-bs-keyboard="false"
            tabIndex="-1"
            aria-labelledby={`${modalId}Label`}
            aria-hidden="true">

            <div className="modal-dialog modal-dialog-scrollable sf-modal-dialog">
                <div className="modal-content border-0 rounded-4 overflow-hidden">

                    <div className="sf-form-header">
                        <p className="sf-form-header-title">
                            {isEdit ? "Edit service" : "Service details"}
                        </p>
                        <p className="sf-form-header-sub">Basic info about what you offer</p>
                    </div>

                    <div className="modal-body px-4 py-3">

                        {error && (
                            <div className="alert alert-danger py-2 mb-3" role="alert">
                                {error}
                            </div>
                        )}

                        <div className="sf-toggle-row">
                            <div>
                                <p className="sf-toggle-label">Active service</p>
                                <p className="sf-toggle-sub">Visible to customers and available for jobs</p>
                            </div>
                            <div className="form-check form-switch mb-0">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="is_active"
                                    checked={form.is_active}
                                    onChange={handleFormChange}
                                    style={{ width: "44px", height: "24px", cursor: "pointer" }}
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="name" className="sf-label">Service name</label>
                            <input
                                type="text"
                                className="form-control"
                                id="name"
                                placeholder="e.g. Tile Installation, Drywall Repair…"
                                value={form.name}
                                onChange={handleFormChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="description" className="sf-label">Description</label>
                            <textarea
                                className="form-control"
                                id="description"
                                rows={3}
                                placeholder="Describe what's included in this service…"
                                value={form.description}
                                onChange={handleFormChange}
                            />
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-6">
                                <label htmlFor="price" className="sf-label">Price ($)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="price"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    value={form.price}
                                    onChange={handleFormChange}
                                />
                                <p className="sf-hint">Base price charged per job</p>
                            </div>
                            <div className="col-6">
                                <label htmlFor="base_cost" className="sf-label">Base cost ($)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="base_cost"
                                    placeholder={materialsTotal > 0
                                        ? `Auto: $${materialsTotal.toFixed(2)}`
                                        : "0.00"}
                                    min="0"
                                    step="0.01"
                                    value={form.base_cost}
                                    onChange={handleFormChange}
                                />
                                <p className="sf-hint">
                                    {form.base_cost !== "" && form.base_cost !== null
                                        ? "Your internal cost estimate"
                                        : "Auto-calculated from materials"}
                                </p>
                            </div>
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-6">
                                <label htmlFor="estimate_hours" className="sf-label">Est. hours</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="estimate_hours"
                                    placeholder="0"
                                    min="0"
                                    step="0.5"
                                    value={form.estimate_hours}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="col-6">
                                <label htmlFor="duration" className="sf-label">Duration (days)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="duration"
                                    placeholder="1"
                                    min="0"
                                    step="1"
                                    value={form.duration}
                                    onChange={handleFormChange}
                                />
                            </div>
                        </div>


                        <div className="bg-secondary-subtle rounded-3 ps-1 pe-1 pb-2">
                            <p className="sf-materials-title ms-2 pt-2 fs-6">Materials needed</p>

                            {materials.map((mat) => (
                                <div className="  bg-white m-2 p-4 rounded-3" key={mat._key}>
                                    <div className="">

                                        <div className="d-sm-none d-md-flex row ">

                                            <div className="col-md-5">
                                                <label className="sf-label">Material name</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="e.g. Ceramic tiles"
                                                    value={mat.name}
                                                    onChange={(e) => handleMatChange(mat._key, "name", e.target.value)}
                                                />
                                            </div>

                                            <div className="sf-mat-qty col-md-3">
                                                <label className="sf-label">Quantity</label>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm"
                                                    placeholder="0"
                                                    min="0"
                                                    step="1"
                                                    value={mat.quantity}
                                                    onChange={(e) => handleMatChange(mat._key, "quantity", e.target.value)}
                                                />
                                            </div>

                                            <div className="sf-mat-cost col-md-3">
                                                <label className="sf-label">Unit cost ($)</label>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm"
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                    value={mat.unit_cost}
                                                    onChange={(e) => handleMatChange(mat._key, "unit_cost", e.target.value)}
                                                />
                                            </div>

                                            <div className="col-md-1 d-flex flex-column justify-content-end">
                                                <label className="sf-label mb-1" style={{ visibility: 'hidden' }}>X</label>
                                                <button
                                                    className="remove-material-btn"
                                                    type="button"
                                                    onClick={() => removeMaterial(mat._key)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>

                                        </div>

                                    </div>
                                </div>
                            ))}

                            <button className="sf-btn-add-mat bg-primary text-white" type="button" onClick={addMaterial}>
                                {/* <IconPlus /> */}
                                Add material
                            </button>

                            <div className="sf-mat-total">
                                <span className="sf-mat-total-label">Estimated materials cost</span>
                                <span className="sf-mat-total-val">${materialsTotal.toFixed(2)}</span>
                            </div>
                        </div>

                    </div>

                    <div className="modal-footer border-top px-4 py-3 d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="sf-footer-cancel"
                            data-bs-dismiss="modal"
                            onClick={handleClose}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="sf-footer-save"
                            onClick={handleSubmit}
                            disabled={saving}>
                            {saving ? "Saving…" : "Save service"}
                        </button>
                    </div>

                </div>
            </div >
        </div >
    );
}