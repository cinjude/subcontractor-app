import { useEffect, useState } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { Link, useNavigate } from "react-router-dom";
import "./CustomerPageList.css";
import customerService from "./customerService";
import Swal from 'sweetalert2'

const getInitials = (name = "") =>
    name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");



const CustomerPageList = ({ onReady, onEdit }) => {

    const navigate = useNavigate()

    const { store } = useGlobalReducer();
    const [customers, setCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
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

    const fetchCustomers = async () => {
        setLoadingCustomers(true);
        const token = store.token || localStorage.getItem("token");
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/customers`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            if (!response.ok) { console.error("Error fetching customers:", data.error); return; }
            setCustomers(data);
        } catch (error) {
            console.error("Network error while fetching customers:", error);
        } finally {
            setLoadingCustomers(false);
        }
    };

    useEffect(() => { fetchCustomers(); }, [store.token]);
    useEffect(() => { if (onReady) onReady(fetchCustomers); }, [store.token]);

    if (loadingCustomers) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
            </div>
        );
    }

    const handleDelete = async (id) => {
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
                    fetchCustomers()
                });
            }
        });
    };

    const EmptyState = () => (
        <div className="cpl-empty">
            <div className="cpl-empty-icon">👤</div>
            <p className="cpl-empty-text">No customers yet</p>
            <p className="cpl-empty-sub text-muted">Add your first customer to get started.</p>
        </div>);

    return (
        <div className="mt-3">

            {/* ── DESKTOP: tabla (≥ 769px) ── */}
            <div className="cpl-table-wrap">
                {customers.length === 0 ? <EmptyState /> : (
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>City</th>
                                <th>State</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="cpl-avatar">{getInitials(customer.name)}</div>
                                            <span className="fw-semibold">{customer.name}</span>
                                        </div>
                                    </td>
                                    <td className="text-muted">{customer.email}</td>
                                    <td>{customer.phone || "—"}</td>
                                    <td>{customer.city}</td>
                                    <td>{customer.state}</td>
                                    <td>
                                        <Link to={"/providerdashboard/customer/" + customer.id} className="btn btn-sm btn-outline-primary">
                                            View
                                        </Link>
                                        <button onClick={() => onEdit(customer)} type="button" className="btn btn-sm btn-outline-warning ms-2" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(customer.id)} className="btn btn-sm btn-outline-danger ms-2">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── MOBILE / TABLET: cards (≤ 768px) ── */}
            <div className="cpl-cards-wrap">
                {customers.length === 0 ? <EmptyState /> : (
                    customers.map((customer) => (
                        <div className="cpl-card" key={customer.id}>

                            <div className="cpl-card-header">
                                <div className="cpl-avatar">{getInitials(customer.name)}</div>
                                <div className="cpl-card-info">
                                    <p className="cpl-card-name">{customer.name}</p>
                                    <p className="cpl-card-email">{customer.email}</p>
                                </div>
                                <span className="cpl-badge active">Active</span>
                            </div>

                            <div className="cpl-card-meta">
                                <div className="cpl-card-meta-item">
                                    <span className="cpl-card-meta-label">City</span>
                                    <span className="cpl-card-meta-val">{customer.city || "—"}</span>
                                </div>
                                <div className="cpl-card-meta-item">
                                    <span className="cpl-card-meta-label">State</span>
                                    <span className="cpl-card-meta-val">{customer.state || "—"}</span>
                                </div>
                                {customer.phone && (
                                    <div className="cpl-card-meta-item">
                                        <span className="cpl-card-meta-label">Phone</span>
                                        <span className="cpl-card-meta-val">{customer.phone}</span>
                                    </div>
                                )}
                            </div>

                            <div className="cpl-card-actions">
                                <Link to={"/providerdashboard/customer/" + customer.id} className="btn btn-sm btn-outline-primary" > View  </Link>
                                <button
                                    onClick={() => onEdit(customer)}
                                    type="button"
                                    className="btn btn-sm btn-outline-warning"
                                    data-bs-toggle="modal"
                                    data-bs-target="#staticBackdrop"
                                >
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(customer.id)} className="btn btn-sm btn-outline-danger">Delete</button>
                            </div>

                        </div>
                    ))
                )}
            </div>
        </div >
    );
};
export default CustomerPageList;