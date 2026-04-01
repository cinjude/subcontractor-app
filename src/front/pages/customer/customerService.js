

const BASE_URL = import.meta.env.VITE_BACKEND_URL + "/api";

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

        const data = await response.json(); 

        if (!response.ok) {
            throw new Error(data.msg || "Server error 500");
        }
        return data;
    } catch (error) {
        Swal.showValidationMessage(`Error: ${error.message}`);
    }
}
    
};

export default customerService;