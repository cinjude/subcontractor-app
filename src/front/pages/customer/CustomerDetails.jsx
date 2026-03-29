import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";



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

    console.log("Single customer array", customer)

    return (
        <div className="container bg-white">
            <div className="">
                <button className="border border-0"
                    onClick={() => navigate(-1)}> <span> ← </span> Back to customer</button>
            </div>
        </div>
    );
}