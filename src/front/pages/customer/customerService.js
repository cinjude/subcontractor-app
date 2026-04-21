import Swal from 'sweetalert2'

const BASE_URL = import.meta.env.VITE_BACKEND_URL + "/api";

export const loadAppData = async (dispatch, token) => {
    try {
        const headers = { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        };

        const [resCust, resServ] = await Promise.all([
            fetch(`${BASE_URL}/customers`, { headers }),
            fetch(`${BASE_URL}/services`, { headers })
        ]);

        if (resCust.ok) {
            const customers = await resCust.json();
            dispatch({ type: "set-customers", payload: customers });
        }

        if (resServ.ok) {
            const servicesData = await resServ.json();
            dispatch({ type: "set-services", payload: servicesData.services });
        }
    } catch (error) {
        console.error("Error loading app data:", error);
    }
};

const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

const customerService = {

    update: async (id, editData) => {
        const res = await fetch(`${BASE_URL}/customer/${id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(editData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error updating customer");
        return data;
    },

    delete: async (id, token) => {
        try {
            const response = await fetch(`${BASE_URL}/customer/${id}`, { 
                method: "DELETE",
                headers: { 
                    "Content-Type": "application/json", 
                    Authorization: `Bearer ${token}` 
                } 
            });

            const data = await response.json(); 
            if (!response.ok) {
                throw new Error(data.msg || data.error || "Server error");
            }
            return data;
        } catch (error) {
            Swal.showValidationMessage(`Error: ${error.message}`);
            throw error; 
        }
    }
};

export default customerService;