import { useEffect, useState } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";


export default function ServicesP() {

    const [loading, setLoading] = useState(true);

    const { store, dispatch } = useGlobalReducer()
    const fetchServicesStats = async () => {

        setLoading(true);
        const token = store.token || localStorage.getItem("token");

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/services/stats`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch services stats");
            }
            else {
                const data = await response.json();
                dispatch({ type: "set-services-stats", payload: data });
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServicesStats();
    }, [store.token]);
    console.log(store.servicesStats);

    return (
        <div className="container">
            <div className="">
                <div className="">
                    <h2>Services</h2>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <p className="">Manage your service catalog and materials</p>
                    <button className="btn btn-primary">Add Service</button>
                </div>
                <div className="services-stats mt-4">
                    <div className="row">
                        <div className="col-12 col-md-4">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">Total Services</h5>
                                    <p className="card-text">10</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">Avg. price</h5>
                                    <p className="card-text">20</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">Materials tracked</h5>
                                    <p className="card-text">30</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}