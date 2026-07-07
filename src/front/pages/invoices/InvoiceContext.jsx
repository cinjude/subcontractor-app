
import { createContext, useContext, useState, useCallback } from "react";

const InvoiceContext = createContext({
    invoices: [],
    stats: null,
    loading: false,
    error: null,
    fetchInvoices: async () => { },
    fetchStats: async () => { },
    fetchInvoice: async () => { },
    createInvoice: async () => { },
    updateInvoice: async () => { },
    updateStatus: async () => { },
    deleteInvoice: async () => { },
    sendEmail: async () => { },
});

const BASE = import.meta.env.VITE_BACKEND_URL || "";

async function apiFetch(path, opts = {}) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE}/api${path}`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...opts.headers,
        },
        ...opts,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}

export function InvoiceProvider({ children }) {
    const [invoices, setInvoices] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchInvoices = useCallback(async (filters = {}) => {
        setLoading(true); setError(null);
        try {
            const q = new URLSearchParams(
                Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== ""))
            ).toString();
            const data = await apiFetch(`/invoices?${q}`);
            setInvoices(data.invoices || []);
            return data;
        } catch (e) { setError(e.message); return { invoices: [] }; }
        finally { setLoading(false); }
    }, []);

    const fetchStats = useCallback(async (filters = {}) => {
        try {
            const q = new URLSearchParams(
                Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== ""))
            ).toString();
            const d = await apiFetch(`/invoices/stats?${q}`);
            setStats(d);
            return d;
        } catch (e) { setError(e.message); }
    }, []);

    const fetchInvoice = useCallback(async (id) => {
        try { return await apiFetch(`/invoices/${id}`); }
        catch (e) { setError(e.message); throw e; }
    }, []);

    const createInvoice = useCallback(async (payload) => {
        setLoading(true); setError(null);
        try {
            const data = await apiFetch("/invoices", {
                method: "POST", body: JSON.stringify(payload),
            });
            setInvoices(prev => [data.invoice, ...prev]);
            return data.invoice;
        } catch (e) { setError(e.message); throw e; }
        finally { setLoading(false); }
    }, []);

    const updateInvoice = useCallback(async (id, payload) => {
        try {
            const data = await apiFetch(`/invoices/${id}`, {
                method: "PUT", body: JSON.stringify(payload),
            });
            setInvoices(prev => prev.map(i => i.id === id ? data.invoice : i));
            return data.invoice;
        } catch (e) { setError(e.message); throw e; }
    }, []);

    const updateStatus = useCallback(async (id, status) => {
        try {
            const data = await apiFetch(`/invoices/${id}/status`, {
                method: "PATCH", body: JSON.stringify({ status }),
            });
            setInvoices(prev => prev.map(i => i.id === id ? data.invoice : i));
            return data.invoice;
        } catch (e) { setError(e.message); throw e; }
    }, []);

    const deleteInvoice = useCallback(async (id) => {
        try {
            await apiFetch(`/invoices/${id}`, { method: "DELETE" });
            setInvoices(prev => prev.filter(i => i.id !== id));
        } catch (e) { setError(e.message); throw e; }
    }, []);

    const sendEmail = useCallback(async (id, recipientEmail = null) => {
        try {
            const data = await apiFetch(`/invoices/${id}/send`, {
                method: "POST",
                body = JSON.stringify(recipientEmail ? { recipient_email: recipientEmail } : {})
            });
            setInvoices(prev => prev.map(i => i.id === id ? data.invoice : i));
            return data;
        } catch (e) { setError(e.message); throw e; }
    }, []);

    return (
        <InvoiceContext.Provider value={{
            invoices, stats, loading, error,
            fetchInvoices, fetchStats, fetchInvoice,
            createInvoice, updateInvoice, updateStatus, deleteInvoice,
            sendEmail,
        }}>
            {children}
        </InvoiceContext.Provider>
    );
}

export const useInvoice = () => useContext(InvoiceContext);