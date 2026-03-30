import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { Link } from "react-router-dom";
import "./customerDetails.css";

const getInitials = (name = "") => {
    if (!name || name.trim() === "") return "?"

    return name.split(" ").slice(0, 2).map((word) => word[0]?.toUpperCase() || "").join("");
}

export default function CustomerDetails() {

    const { id } = useParams()

    const navigate = useNavigate()
    const { store } = useGlobalReducer()

    const [customer, setCustomer] = useState(null)
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    const getSingleCustomer = async () => {
        setLoadingCustomers(true);

        const token = store?.token || localStorage.getItem('token')
        if (!token) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()
            setCustomer(data.customer)

        } catch (error) {
            console.error("error retrieving customer id", id, error)
        } finally {
            setLoadingCustomers(false)
        }
    }

    useEffect(() => {
        getSingleCustomer()
    }, [store.token])

    if (loadingCustomers) {
        return <div>Loading...</div>
    }
    if (!customer) {
        return <div>Customer not found</div>
    }

    console.log("Single customer array", customer)

    return (
        <div className="container">
            <header className="d-flex justify-content-between align-items-center">
                <button className="border border-0"
                    onClick={() => navigate(-1)}> <span> ← </span> Back to customer</button>
                <div className="detail-button">
                    <Link className="btn btn-sm btn-outline-warning ms-2">Edit</Link>
                    <button className="btn btn-sm btn-outline-danger ms-2">Delete</button>
                </div>
            </header>


            <div className="profile-header-customer  d-flex justify-content-start align-items-center bg-success-subtle">
                <div className=""> <p className="cpl-avatar-details fs-3"> {getInitials(customer?.name)}</p> </div>
                <div className="ms-4 .text-info">
                    <h3 className="mb-0">{customer.name}</h3>
                    <p className=" ">Customer id #{customer.id}</p>
                </div>
            </div>

            <div className="contact-info bg-white p-3 mt-4 ">
                <div>
                    <h4 className="mb-0">Contact Information</h4>
                    <p>Primary details</p>
                </div>
                <div className=" d-flex justify-content-between">
                    <div>
                        <p> Full Name</p>
                        <p>{customer.name}</p>
                    </div>
                    <div>
                    </div>
                    <div>
                        <p> Phone Number</p>
                        <p>{customer.phone}</p>
                    </div>
                </div>

            </div>

        </div>
    );
}