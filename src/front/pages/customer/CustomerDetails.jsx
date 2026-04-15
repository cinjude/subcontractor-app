import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { Link } from "react-router-dom";
import "./customerDetails.css";
import { format, parseISO } from "date-fns";
import { enGB } from "date-fns/locale";
import customerService from "./customerService";
import Swal from 'sweetalert2'

const getInitials = (name = "") => {
    if (!name || name.trim() === "") return "?";
    return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
};

const fmtDate = (raw) => {
    if (!raw) return "N/A";
    try { return format(parseISO(raw), "MMM d, yyyy", { locale: enGB }); }
    catch { return "N/A"; }
};

export default function CustomerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { store } = useGlobalReducer();

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(false);

    const getSingleCustomer = async () => {
        setLoading(true);
        const token = store?.token || localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/customer/${id}`,
                { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            setCustomer(data.customer);
        } catch (err) {
            console.error("Error retrieving customer", id, err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { getSingleCustomer(); }, [store.token]);

    const [editData, setEditData] = useState({
        name: '',
        email: '',
        address: '',
        address2: "",
        city: '',
        state: '',
        zip_code: '',
        phone: '',
        note: ''
    });

    useEffect(() => {
        if (customer) {
            setEditData({
                name: customer.name || "",
                email: customer.email || "",
                phone: customer.phone || "",
                address: customer.address || "",
                address2: customer.address2 || "",
                city: customer.city || "",
                state: customer.state || "",
                zip_code: customer.zip_code || "",
                note: customer.note || ""
            });
        }
    }, [customer]);

    const handleUpdate = async (e) => {
        e.preventDefault();

        Swal.fire({
            title: "Do you want to save the changes?",
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: "Save",
            denyButtonText: `Don't save`,
        }).then(async (result) => {
            if (result.isConfirmed) {
                setLoading(true);
                try {
                    const response = await customerService.update(id, editData);
                    setCustomer(response.customer);

                    // --- CIERRE SEGURO DEL MODAL ---
                    const modalElement = document.getElementById('editCustomerModal');

                    // Usamos window.bootstrap para evitar el error de "undefined"
                    const bs = window.bootstrap;

                    if (modalElement && bs) {
                        const modalInstance = bs.Modal.getInstance(modalElement) || new bs.Modal(modalElement);
                        modalInstance.hide();
                    }

                    setTimeout(() => {
                        const backdrops = document.querySelectorAll('.modal-backdrop');
                        backdrops.forEach(el => el.remove());
                        document.body.classList.remove('modal-open');
                        document.body.style.overflow = '';
                        document.body.style.paddingRight = '';
                    }, 100);

                    Swal.fire("Saved!", "Customer updated successfully", "success");

                } catch (err) {
                    console.error("Update error:", err);
                    Swal.fire("Error", "Could not update customer", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleDelete = async () => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            showLoaderOnConfirm: true, // Muestra un spinner en el botón mientras borra
            preConfirm: async () => {
                try {
                    const token = store?.token || localStorage.getItem("token");
                    const response = await fetch(
                        `${import.meta.env.VITE_BACKEND_URL}/api/customer/${id}`,
                        {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    if (!response.ok) {
                        throw new Error("Could not delete the customer");
                    }
                    return response.json();
                } catch (error) {
                    Swal.showValidationMessage(`Request failed: ${error}`);
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: "Deleted!",
                    text: "The customer has been removed.",
                    icon: "success"
                }).then(() => {
                    navigate("/providerdashboard/customers");
                });
            }
        });
    };



    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>;
    if (!customer) return <div className="text-center py-5 text-muted">Customer not found.</div>;

    const initials = getInitials(customer.name);
    const dateCreated = fmtDate(customer.create_at);
    const dateUpdated = fmtDate(customer.updated_at);

    return (
        <div className="cd-page">

            <div className="cd-topbar">
                <button className="cd-back-btn" onClick={() => navigate(-1)}>
                    ← Back to customers
                </button>
            </div>

            <div className="cd-layout">

                <div className="cd-sidebar">

                    <div className="cd-hero">
                        <div className="cd-avatar">{initials}</div>

                        <div className="cd-hero-info">
                            <h2 className="cd-hero-name">{customer.name}</h2>
                            <p className="cd-hero-email">{customer.email}</p>
                            <p className="cd-hero-meta">
                                Customer ID #{customer.id} · Created {dateCreated}
                            </p>
                            <span className="cd-badge-active">
                                <span className="cd-badge-dot"></span>Active
                            </span>
                        </div>

                        <div className="cd-hero-actions">
                            <button className="cd-btn-edit" data-bs-toggle="modal" data-bs-target="#editCustomerModal">Edit</button>
                            <button onClick={handleDelete} className="cd-btn-delete">Delete</button>
                        </div>
                    </div>

                    {/* RECORD INFO — visible en todos los breakpoints */}
                    <div className="cd-record-card">
                        <div className="cd-record-title">Record info</div>
                        <div className="cd-record-row">
                            <div className="cd-record-label">Created at</div>
                            <div className="cd-record-val">{dateCreated}</div>
                        </div>
                        <div className="cd-record-row">
                            <div className="cd-record-label">Last updated</div>
                            <div className="cd-record-val">{dateUpdated}</div>
                        </div>
                        <div className="cd-record-row">
                            <div className="cd-record-label">Customer ID</div>
                            <div className="cd-record-val">#{customer.id}</div>
                        </div>
                    </div>

                </div>

                {/* ════════════════════════
                    MAIN CONTENT
                ════════════════════════ */}
                <div className="cd-main">

                    <div className="cd-card">
                        <div className="cd-card-head">
                            <h3 className="cd-card-title">Contact info</h3>
                        </div>

                        <div className="cd-mobile-only">
                            <div className="cd-field-row">
                                <span className="cd-field-label">Full name</span>
                                <span className="cd-field-val">{customer.name}</span>
                            </div>
                            <div className="cd-field-row">
                                <span className="cd-field-label">Email</span>
                                <span className="cd-field-val link">{customer.email}</span>
                            </div>
                            <div className="cd-field-row">
                                <span className="cd-field-label">Phone</span>
                                <span className="cd-field-val link">{customer.phone || "—"}</span>
                            </div>
                        </div>

                        <div className="cd-desktop-only">
                            <div className="cd-contact-cols">
                                <div className="cd-contact-col">
                                    <div className="cd-contact-col-label">Full name</div>
                                    <div className="cd-contact-col-val">{customer.name}</div>
                                </div>
                                <div className="cd-contact-col">
                                    <div className="cd-contact-col-label">Email</div>
                                    <div className="cd-contact-col-val link">{customer.email}</div>
                                </div>
                                <div className="cd-contact-col">
                                    <div className="cd-contact-col-label">Phone</div>
                                    <div className="cd-contact-col-val link">{customer.phone || "—"}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="cd-two-col">

                        {/* Location — solo visible en tablet */}
                        <div className="cd-card cd-location-card">
                            <div className="cd-card-head">
                                <h3 className="cd-card-title">Location</h3>
                            </div>
                            <div className="cd-field-row">
                                <span className="cd-field-label">City / State</span>
                                <span className="cd-field-val">{customer.city}, {customer.state}</span>
                            </div>
                            <div className="cd-field-row">
                                <span className="cd-field-label">Zip code</span>
                                <span className="cd-field-val">{customer.zip_code}</span>
                            </div>
                        </div>

                        <div className="cd-card">
                            <div className="cd-card-head">
                                <h3 className="cd-card-title">Full address</h3>
                                <span className="cd-card-tag">{customer.city}, {customer.state}</span>
                            </div>

                            <div className="cd-mobile-only">
                                <div className="cd-field-row">
                                    <span className="cd-field-label">Address</span>
                                    <span className="cd-field-val">{customer.address}</span>
                                </div>
                                <div className="cd-field-row">
                                    <span className="cd-field-label">Address 2</span>
                                    <span className="cd-field-val muted">{customer.address2 || "—"}</span>
                                </div>
                                <div className="cd-field-row">
                                    <span className="cd-field-label">City</span>
                                    <span className="cd-field-val">{customer.city}</span>
                                </div>
                                <div className="cd-field-row">
                                    <span className="cd-field-label">State</span>
                                    <span className="cd-field-val">{customer.state}</span>
                                </div>
                                <div className="cd-field-row">
                                    <span className="cd-field-label">Zip code</span>
                                    <span className="cd-field-val">{customer.zip_code}</span>
                                </div>
                            </div>

                            <div className="cd-desktop-only">
                                <div className="cd-address-grid-desktop">
                                    <div className="cd-addr-col">
                                        <div className="cd-addr-col-label">Address line 1</div>
                                        <div className="cd-addr-col-val">{customer.address}</div>
                                    </div>
                                    <div className="cd-addr-col">
                                        <div className="cd-addr-col-label">Address line 2</div>
                                        <div className="cd-addr-col-val muted">{customer.address2 || "—"}</div>
                                    </div>
                                    <div className="cd-addr-col no-bottom">
                                        <div className="cd-addr-col-label">City</div>
                                        <div className="cd-addr-col-val">{customer.city}</div>
                                    </div>
                                    <div className="cd-addr-col no-bottom">
                                        <div className="cd-addr-col-label">State</div>
                                        <div className="cd-addr-col-val">{customer.state}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── NOTE ── */}
                    <div className="cd-card">
                        <div className="cd-card-head">
                            <h3 className="cd-card-title">Note</h3>
                        </div>
                        <div className="cd-note-box">
                            {customer.note || "No note provided."}
                        </div>
                        <div className="cd-note-dates">
                            <span>Created: {dateCreated}</span>
                            <span>Updated: {dateUpdated}</span>
                        </div>
                    </div>

                    <div className="cd-card">
                        <div className="cd-card-head">
                            <h3 className="cd-card-title">Activity summary</h3>
                        </div>
                        <div className="cd-stats-grid">
                            <div className="cd-stat">
                                <div className="cd-stat-label">Total jobs</div>
                                <div className="cd-stat-val">0</div>
                                <div className="cd-stat-sub">Since {dateCreated}</div>
                            </div>
                            <div className="cd-stat">
                                <div className="cd-stat-label">Open invoices</div>
                                <div className="cd-stat-val">0</div>
                                <div className="cd-stat-sub">$0.00 pending</div>
                            </div>
                            <div className="cd-stat">
                                <div className="cd-stat-label">Paid invoices</div>
                                <div className="cd-stat-val">0</div>
                                <div className="cd-stat-sub">$0.00 total</div>
                            </div>
                        </div>
                        <div className="cd-summary-footer">
                            <span>Created: {dateCreated}</span>
                            <span>Last updated: {dateUpdated}</span>
                        </div>
                    </div>

                </div>
            </div>

            <div className="modal fade" id="editCustomerModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Edit Customer: {customer.name}</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Full Name</label>
                                        <input type="text" className="form-control" value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Email</label>
                                        <input type="email" className="form-control" value={editData.email}
                                            onChange={(e) => setEditData({ ...editData, email: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Phone</label>
                                        <input type="text" className="form-control" value={editData.phone}
                                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label fw-bold">Address</label>
                                        <input type="text" className="form-control" value={editData.address}
                                            onChange={(e) => setEditData({ ...editData, address: e.target.value })} required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">City</label>
                                        <input type="text" className="form-control" value={editData.city}
                                            onChange={(e) => setEditData({ ...editData, city: e.target.value })} required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">State</label>
                                        <input type="text" className="form-control" value={editData.state}
                                            onChange={(e) => setEditData({ ...editData, state: e.target.value })} required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Zip Code</label>
                                        <input type="text" className="form-control" value={editData.zip_code}
                                            onChange={(e) => setEditData({ ...editData, zip_code: e.target.value })} required />
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label fw-bold">Internal Notes</label>
                                        <textarea className="form-control" rows="3" value={editData.note}
                                            onChange={(e) => setEditData({ ...editData, note: e.target.value })}></textarea>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}