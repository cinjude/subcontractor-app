
import { useParams } from "react-router-dom"
import useGlobalReducer from "../../hooks/useGlobalReducer"
import { useEffect, useState } from "react"

const ServicesDetails = () => {

    const { store } = useGlobalReducer()
    const { id } = useParams()

    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(false);

    const getServicesid = async () => {

        setLoading(true)
        const token = store?.token || localStorage.getItem("token")
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/services/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log("res detail", res)
            const data = await res.json();

            if (res.ok) {
                setService(data.service)
            }
            console.log("data serviceDetail", data)

        } catch (error) {
            console.error("Error retrieving service", id, error)
        } finally {
            setLoading(false)
        }

    }

    useEffect(() => {
        getServicesid();
    }, [store?.token])

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>;
    if (!service) return <div className="text-center py-5 text-muted">Service not found.</div>;

    return (
        <div>
            <h1>Services Details</h1>
        </div>
    )
}

export default ServicesDetails;