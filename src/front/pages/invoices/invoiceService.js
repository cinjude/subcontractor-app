const baseUrl = import.meta.env.VITE_BACKEND_URL || "";
const token = () => localStorage.getItem('token');

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token()}`,
})

export const invoiceService = {
    
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${baseUrl}/api/invoices?${query}`, {
            headers: authHeaders(),
        });
        const data = await res.json()
        if(!res.ok) throw new Error(data.error || 'Failed to fetch invoices');
        return data;
    },

    getById: async (id) => {
        const res = await fetch(`${baseUrl}/api/invoices/${id}`, {
            headers: authHeaders(),
        });
        const data = await res.json()
        if(!res.ok) throw new Error(data.error || 'Invoices not found');
        return data
    },

    create: async (payload) => {
        const res = await fetch(`${baseUrl}/api/invoices`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await res.json()
        if(!res.ok) throw new Error(data.error || 'Failed to create invoice');
        return data;
    },

    update: async (id, payload) =>{
     const res= await fetch(`${baseUrl}/api/invoices/${id}`,{
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
     });
     const data = await res.json()
     if(!res.ok) throw new Error(data.error || 'Failed to updated invoice');
    return data;
    },

    delete: async (id) => {
        const res = await fetch(`${baseUrl}/api/invoices/${id}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        const data = await res.json()
        if(!res.ok) throw new Error(data.error || 'Failed to delete invoice');
        return data
    },

    updateStatus: async (id, status) => {
        const res = await fetch(`${baseUrl}/api/invoices/${id}/status`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({status})
        });
        const data = await res.json()
        if(!res.ok) throw new Error(data.error || 'Failed to update status' );
        return data
    },

    sendEmail: async (id) => {
        const res = await fetch(`${baseUrl}/api/invoices/${id}/send`, {
            method: 'POST',
            headers: authHeaders()
        });
        const data = await res.json()
        if(!res.ok) throw new Error(data.error || 'Failed to send invoice');
        return data
    },

    getStats: async () => {
        const res = await fetch(`${baseUrl}/api/invoices/stats`, {
            headers: authHeaders()
        });
        const data = await res.json()
        if(!res.ok) throw new Error(data.error || 'Failed to fetch stats');
        return data;
    },
  
};