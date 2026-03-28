import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";



export default function CustomerDetails() {

    const { id } = useParams()

    const navigate = useNavigate()
    const { store } = useGlobalReducer()

    const [customer, setCustomer] = useState([])
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    const getSingleCustomer = async () => {
        setLoadingCustomers(true);

        const token = store.token || localStorage.getItem(token)

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/customer/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.data
            setCustomer(data)

        } catch (error) {
            console.error("error retrieving customer id", id, error)
        }
    }

    useEffect(() => {
        getSingleCustomer()
    }, [])

    console.log("Single customer", customer)


    return (
        <div className="container bg-white">
            <div className="">
                <button className="border border-0"
                    onClick={() => navigate(-1)}> <span> ← </span> Back to customer</button>
            </div>
        </div>
    );
}