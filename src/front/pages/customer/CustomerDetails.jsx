import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { Link } from "react-router-dom";
import "./customerDetails.css";
import { format, parseISO } from "date-fns";
import { enGB } from "date-fns/locale";

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

    const dateCreated = customer?.create_at;
    const dateUpdated = customer?.updated_at;

    const formattedDate = (rawDate) => {
        if (!rawDate) return "N/A";

        return format(parseISO(rawDate), "d MMMM yyyy", { locale: enGB })
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

            <div className="contact-info bg-white mt-4 ">
                <div>
                    <h5 className="mb-0 pt-2 ms-3"> <strong>Contact Information</strong></h5>
                    <p className="ms-3">Primary details</p>
                </div>
                <div className=" d-flex justify-content-between">
                    <div className="ms-0 contact-customer-info">
                        <p className="mb-0 ms-3"> Full Name</p>
                        <p className="ms-3"> <strong>{customer.name}</strong></p>
                    </div>
                    <div>
                    </div>
                    <div className="contact-customer-info-email">
                        <p className="mb-0 ms-3">Email</p>
                        <p className="text-primary ms-3">{customer.email}</p>
                    </div>
                    <div className="me-0 contact-customer-info-phone">
                        <p className="mb-0 ms-3"> Phone Number</p>
                        <p className="text-primary ms-3">{customer.phone}</p>
                    </div>
                </div>

            </div>
            <div className="customer-address bg-white mt-4">
                <div className="d-flex justify-content-between pt-2">
                    <div>
                        <h5 className="mb-0 ms-3">Address</h5>
                        <p className="ms-3">Billing and service location</p>
                    </div>
                    <div className="me-4 "> <p className="p-1 rounded-pill bg-body-secondary"> {customer.city}, {customer.state}</p></div>
                </div>
                <div className="d-flex justify-content-between">
                    <div className="customer-address1">
                        <p className="ms-3 mb-0">Address line 1</p>
                        <p className="ms-3"> <strong>{customer.address}</strong></p>
                    </div>
                    <div className="customer-address2">
                        <p className="ms-3 mb-0">Address line 2</p>
                        <p className="ms-3">{customer.address2}</p>
                    </div>
                </div>
                <div className="d-flex justify-content-between">
                    <div className="customer-address-city pt-1">
                        <p className="ms-3 mb-0">City</p>
                        <p className="ms-3"> <b>{customer.city}</b></p>
                    </div>
                    <div className="customer-address-state pt-1">
                        <p className="ms-3 mb-0">State</p>
                        <p className="ms-3"> <b>{customer.state}</b></p>
                    </div>
                    <div className="customer-address-zip pt-1">
                        <p className="ms-3 mb-0">Zip Code</p>
                        <p className="ms-3"> <b>{customer.zip_code}</b></p>
                    </div>
                </div>
            </div>
            <div className="customer-note bg-white mt-4">
                <div className="pt-2 ms-3">
                    <h5 className="mb-0">Internal note</h5>
                    <p className="mb-0">Private — visible only to your team</p>
                </div>
                <hr className="mb-0" />
                <div className="customer-notes pt-0 mt-0">
                    <p className="bg-body-secondary p-2 mt-2 rounded-3">{customer.note || "No note provided"}</p>
                </div>
            </div>
            <div className="customer-summary bg-white mt-4">
                <div className="pt-2">
                    <h5 className="mb-0 ms-3">Activity summary</h5>
                    <p className="ms-3">Customer job history overview</p>
                </div>
                <hr />
                <div className="d-flex justify-content-between pb-3 ps-3 pe-3">
                    <div className="customer-summary-total-jobs bg-body-secondary rounded-3 p-3">
                        <p className="mb-0">Total jobs</p>
                        <p className="mb-0"><strong>0</strong></p>
                        <p >Since  </p>
                    </div>
                    <div className="customer-summary-open-invoice bg-body-secondary rounded-3 p-3">
                        <p className="mb-0">Open Invoice</p>
                        <p className="mb-0"> <strong>0</strong></p>
                        <p className="mb-0">$0.00</p>
                    </div>
                    <div className="customer-summary-paid-invoice bg-body-secondary rounded-3 p-3">
                        <p className="mb-0">Paid Invoice</p>
                        <p className="mb-0"> <strong>0</strong></p>
                        <p className="mb-0">$0.00</p>
                    </div>
                </div>
                <hr className=" sumary-hr " />
                <div className="d-flex justify-content-between">
                    <p className="ms-3">Created: {formattedDate(dateCreated)}</p>
                    <p className="me-3">Last updated: {formattedDate(dateUpdated)}</p>
                </div>

            </div>

        </div>
    );
}