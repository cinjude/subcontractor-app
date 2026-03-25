import { useEffect, useState } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";




const CustomerPageList = () => {

    const { store, dispatch } = useGlobalReducer()
    const [customers, setCustomers] = useState([])
    const [loadingCustomers, setLoadingCustomers] = useState(false)

    const fetchCustomers = async () => {
        setLoadingCustomers(true)
        const token = store.token || localStorage.getItem('token')

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            if (!response.ok) {
                console.error("Error fetching customers:", data.error);
                return;
            }
            setCustomers(data)
            console.log("Customers:", data)
        } catch (error) {
            console.error('Network error while fetching customers:', error)
        } finally {
            setLoadingCustomers(false)
        }

    }

    useEffect(() => {
        fetchCustomers()
    }, [store.token])



    return (
        <div>
            {loadingCustomers ? (
                <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status" />
                </div>
            ) : (
                <table className="table table-hover mt-3">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>City</th>
                            <th>State</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center text-muted">
                                    No customers yet
                                </td>
                            </tr>
                        ) : (
                            customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td>{customer.name}</td>
                                    <td>{customer.email}</td>
                                    <td>{customer.phone || "—"}</td>
                                    <td>{customer.city}</td>
                                    <td>{customer.state}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};


export default CustomerPageList;