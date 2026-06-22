import useGlobalReducer from "../../hooks/useGlobalReducer";
import { useRef, useState } from "react";
import CustomerPageList from "./CustomerPageList"
import Swal from 'sweetalert2'

export const CustomersPage = () => {

    const { store, dispatch } = useGlobalReducer();

    const initialhtmlForm = {
        name: '',
        email: '',
        address: '',
        address2: "",
        city: '',
        state: '',
        zip_code: '',
        phone: '',
        note: ''
    };

    const [formData, setFormData] = useState(initialhtmlForm)
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const fetchCustomersRef = useRef(null)

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }))
    }

    const handleSubmit = async () => {
        setError(null);
        setLoading(true);

        const token = store.token || localStorage.getItem("token");

        const url = isEditing
            ? `${import.meta.env.VITE_BACKEND_URL}/api/customer/${editId}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/customers/create`;

        const method = isEditing ? 'PUT' : 'POST';

        try {
            const { address2, ...dataToSend } = formData;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (response.ok) {
                dispatch({ type: 'set-customers', payload: data.customers });

                if (fetchCustomersRef.current) fetchCustomersRef.current();

                setFormData(initialhtmlForm);
                setIsEditing(false);

                const modalCloseBtn = document.querySelector("[data-bs-dismiss='modal']");
                if (modalCloseBtn) modalCloseBtn.click();

                Swal.fire("Success!", isEditing ? "Updated" : "Created", "success");
            } else {
                // Si la API responde pero con error (ej: email duplicado)
                setError(data.error || 'Failed to process request');
                Swal.fire("Error", data.error || "Algo salió mal", "error");
            }

        } catch (err) {
            console.error('Error:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const createCustomer = () => {
        setEditId(null)
        setIsEditing(false);
        setFormData(initialhtmlForm);
    }

    const handleEditClick = (customer) => {
        setEditId(customer.id)
        setIsEditing(true)
        setFormData({
            name: customer.name || '',
            email: customer.email || '',
            address: customer.address || '',
            address2: customer.address2 || '',
            city: customer.city || '',
            state: customer.state || '',
            zip_code: customer.zip_code || '',
            phone: customer.phone || '',
            note: customer.note || ''
        });
    };

    return (
        <div>
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4>Customers Management</h4>
                        <button onClick={createCustomer} type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                            New Customer
                        </button>
                    </div>
                    <div>
                        <CustomerPageList
                            onReady={(fn) => fetchCustomersRef.current = fn}
                            onEdit={handleEditClick}
                        />
                    </div>

                    <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h1 className="modal-title fs-5" id="staticBackdropLabel">{isEditing ? 'Edit Customer' : 'Add new Customer'}</h1>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>

                                <div className="modal-body">
                                    {error && (
                                        <div className="alert alert-danger py-2">{error}</div>
                                    )}

                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label htmlFor="name" className="form-label">Name</label>
                                            <input type="text" className="form-control" id="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="email" className="form-label">Email</label>
                                            <input type="email" className="form-control" id="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label htmlFor="phone" className="form-label">Phone</label>
                                            <input type="tel" className="form-control" id="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label htmlFor="address" className="form-label">Address</label>
                                            <input type="text" className="form-control" id="address" placeholder="1234 Main St"
                                                value={formData.address}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label htmlFor="address2" className="form-label">Address 2</label>
                                            <input type="text" className="form-control" id="address2" placeholder="Apartment, studio, or floor"
                                                value={formData.address2}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="city" className="form-label">City</label>
                                            <input type="text" className="form-control" id="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label htmlFor="state" className="form-label">State</label>
                                            <select id="state" className="form-select"
                                                value={formData.state}
                                                onChange={handleChange}
                                            >
                                                <option value="">Choose...</option>
                                                <option value="AL">Alabama</option>
                                                <option value="CA">California</option>
                                                <option value="FL">Florida</option>
                                                <option value="NY">New York</option>
                                                <option value="MD">Maryland</option>
                                                <option value="DE">Delaware</option>
                                                <option value="NJ">New Jersey</option>
                                                <option value="PA">Pennsylvania</option>
                                                <option value="VA">Virginia</option>
                                                <option value="IN">Indiana</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <label htmlFor="zip_code" className="form-label">Zip</label>
                                            <input type="text" className="form-control" id="zip_code"
                                                value={formData.zip_code}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label htmlFor="note" className="form-label">Note</label>
                                            <input type="text" className="form-control" id="note"
                                                value={formData.note}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        data-bs-dismiss="modal"
                                        onClick={() => { setFormData(initialhtmlForm); setError(null); }}
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? "Cargando..." : isEditing ? "Save Changes" : "Create Customer"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );


}


